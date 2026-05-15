import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { config } from "../config";
import { resolveSafe, mimeFor, toApiPath } from "../storage";
import { Errors } from "../errors";

const TMP_DIR = path.join(os.tmpdir(), "fileuploadmanager-staging");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TMP_DIR),
  filename: (_req, file, cb) => {
    const id = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${id}-${path.basename(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileBytes,
    files: config.upload.maxFilesPerRequest,
  },
});

export const uploadRouter = Router();

uploadRouter.post(
  "/",
  upload.array("files", config.upload.maxFilesPerRequest),
  (req: Request, res: Response, next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const cleanup = () => files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));

    try {
      const destPath = typeof req.body.path === "string" ? req.body.path : null;
      if (!destPath) {
        cleanup();
        throw Errors.invalidRequest("Form field 'path' is required");
      }
      if (files.length === 0) {
        throw Errors.invalidRequest("No files provided in field 'files'");
      }

      const destAbs = resolveSafe(destPath);
      if (!fs.existsSync(destAbs)) {
        cleanup();
        throw Errors.notFound("Destination folder not found");
      }
      if (!fs.statSync(destAbs).isDirectory()) {
        cleanup();
        throw Errors.invalidRequest("Destination path is not a folder");
      }

      const overwrite = req.body.overwrite === "true";

      for (const f of files) {
        const target = path.join(destAbs, path.basename(f.originalname));
        if (fs.existsSync(target) && !overwrite) {
          cleanup();
          throw Errors.alreadyExists(`File already exists: ${path.basename(f.originalname)}`);
        }
      }

      const moved = files.map((f) => {
        const target = path.join(destAbs, path.basename(f.originalname));
        fs.renameSync(f.path, target);
        const stat = fs.statSync(target);
        return {
          name: path.basename(target),
          path: toApiPath(target),
          size: stat.size,
          mimeType: mimeFor(target),
        };
      });

      res.status(201).json({ files: moved });
    } catch (e) {
      cleanup();
      next(e);
    }
  }
);

uploadRouter.use((err: Error, _req: Request, _res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") return next(Errors.fileTooLarge(err.message));
    return next(Errors.invalidRequest(err.message));
  }
  next(err);
});
