import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { resolveSafe, mimeFor, toApiPath } from "../storage";
import { Errors } from "../errors";

const upload = multer({
  storage: multer.memoryStorage(),
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

    try {
      const destPath = typeof req.body.path === "string" ? req.body.path : null;
      if (!destPath) throw Errors.invalidRequest("Form field 'path' is required");
      if (files.length === 0) {
        throw Errors.invalidRequest("No files provided in field 'files'");
      }

      const destAbs = resolveSafe(destPath);
      if (!fs.existsSync(destAbs)) throw Errors.notFound("Destination folder not found");
      if (!fs.statSync(destAbs).isDirectory()) {
        throw Errors.invalidRequest("Destination path is not a folder");
      }

      const overwrite = req.body.overwrite === "true";

      for (const f of files) {
        const target = path.join(destAbs, path.basename(f.originalname));
        if (fs.existsSync(target) && !overwrite) {
          throw Errors.alreadyExists(`File already exists: ${path.basename(f.originalname)}`);
        }
      }

      const written = files.map((f) => {
        const target = path.join(destAbs, path.basename(f.originalname));
        fs.writeFileSync(target, f.buffer);
        const stat = fs.statSync(target);
        return {
          name: path.basename(target),
          path: toApiPath(target),
          size: stat.size,
          mimeType: mimeFor(target),
        };
      });

      res.status(201).json({ files: written });
    } catch (e) {
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
