import { Router, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { resolveSafe, toApiPath } from "../storage";
import { Errors } from "../errors";

export const folderRouter = Router();

folderRouter.post("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path: apiPath, recursive } = req.body ?? {};
    if (typeof apiPath !== "string") throw Errors.invalidRequest("path is required");

    const absolute = resolveSafe(apiPath);
    if (fs.existsSync(absolute)) throw Errors.alreadyExists("Folder already exists");

    if (!recursive) {
      const parent = path.dirname(absolute);
      if (!fs.existsSync(parent)) throw Errors.notFound("Parent folder does not exist");
    }

    fs.mkdirSync(absolute, { recursive: !!recursive });
    const stat = fs.statSync(absolute);
    res.status(201).json({ path: toApiPath(absolute), createdAt: stat.birthtime.toISOString() });
  } catch (e) {
    next(e);
  }
});
