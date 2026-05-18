import { Router, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { resolveSafe, toApiPath, mimeFor } from "../storage";
import { Errors } from "../errors";

export const fileRouter = Router();

function streamFile(req: Request, res: Response, disposition: "inline" | "attachment") {
  const apiPath = typeof req.query.path === "string" ? req.query.path : "";
  const absolute = resolveSafe(apiPath);

  if (!fs.existsSync(absolute)) throw Errors.notFound("File not found");
  const stat = fs.statSync(absolute);
  if (!stat.isFile()) throw Errors.invalidRequest("Path is not a file");

  const filename = path.basename(absolute);
  const mime = mimeFor(filename);
  const total = stat.size;
  const encodedName = encodeURIComponent(filename);

  res.setHeader("Content-Type", mime);
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${filename.replace(/"/g, "")}"; filename*=UTF-8''${encodedName}`
  );
  res.setHeader("Last-Modified", stat.mtime.toUTCString());
  res.setHeader("Accept-Ranges", "bytes");

  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      res.status(416).setHeader("Content-Range", `bytes */${total}`);
      return res.end();
    }
    const startStr = match[1];
    const endStr = match[2];
    let start = startStr ? Number(startStr) : 0;
    let end = endStr ? Number(endStr) : total - 1;
    if (!startStr && endStr) {
      start = Math.max(0, total - Number(endStr));
      end = total - 1;
    }
    if (start > end || start >= total) {
      res.status(416).setHeader("Content-Range", `bytes */${total}`);
      return res.end();
    }
    end = Math.min(end, total - 1);
    const chunkSize = end - start + 1;
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
    res.setHeader("Content-Length", chunkSize);
    fs.createReadStream(absolute, { start, end }).pipe(res);
    return;
  }

  res.setHeader("Content-Length", total);
  fs.createReadStream(absolute).pipe(res);
}

fileRouter.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    streamFile(req, res, "inline");
  } catch (e) {
    next(e);
  }
});

fileRouter.get("/download", (req: Request, res: Response, next: NextFunction) => {
  try {
    streamFile(req, res, "attachment");
  } catch (e) {
    next(e);
  }
});

function fileMetadata(absolute: string) {
  const stat = fs.statSync(absolute);
  return {
    path: toApiPath(absolute),
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    mimeType: mimeFor(absolute),
  };
}

fileRouter.post("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path: apiPath, content } = req.body ?? {};
    if (typeof apiPath !== "string") throw Errors.invalidRequest("path is required");
    if (content !== undefined && typeof content !== "string") {
      throw Errors.invalidRequest("content must be a string");
    }

    const absolute = resolveSafe(apiPath);
    if (fs.existsSync(absolute)) throw Errors.alreadyExists("File already exists");

    const parent = path.dirname(absolute);
    if (!fs.existsSync(parent) || !fs.statSync(parent).isDirectory()) {
      throw Errors.notFound("Parent folder does not exist");
    }

    fs.writeFileSync(absolute, content ?? "", "utf8");
    res.status(201).json(fileMetadata(absolute));
  } catch (e) {
    next(e);
  }
});

fileRouter.put("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path: apiPath, content } = req.body ?? {};
    if (typeof apiPath !== "string") throw Errors.invalidRequest("path is required");
    if (typeof content !== "string") throw Errors.invalidRequest("content must be a string");

    const absolute = resolveSafe(apiPath);
    if (!fs.existsSync(absolute)) throw Errors.notFound("File not found");
    if (!fs.statSync(absolute).isFile()) throw Errors.invalidRequest("Path is not a file");

    fs.writeFileSync(absolute, content, "utf8");
    res.json(fileMetadata(absolute));
  } catch (e) {
    next(e);
  }
});
