import { Router, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { resolveSafe, mimeFor, toApiPath } from "../storage";
import { Errors } from "../errors";

export const listRouter = Router();

listRouter.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiPath = typeof req.query.path === "string" ? req.query.path : "/";
    const absolute = resolveSafe(apiPath);

    if (!fs.existsSync(absolute)) throw Errors.notFound("Folder not found");
    const stat = fs.statSync(absolute);
    if (!stat.isDirectory()) throw Errors.invalidRequest("Path is not a folder");

    const entries = fs
      .readdirSync(absolute, { withFileTypes: true })
      .flatMap((d) => {
        const entryAbs = path.join(absolute, d.name);
        let s: fs.Stats;
        try {
          s = fs.statSync(entryAbs);
        } catch (err) {
          // Ghost entry: readdir sees it but stat can't reach it. Happens
          // intermittently on Docker Desktop's WSL2 bind mount after a
          // cross-directory rename. Skip it rather than 500.
          if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
          throw err;
        }
        const isFile = d.isFile();
        return [{
          name: d.name,
          path: toApiPath(entryAbs),
          type: isFile ? "file" : "folder",
          size: isFile ? s.size : null,
          mimeType: isFile ? mimeFor(d.name) : null,
          modifiedAt: s.mtime.toISOString(),
        }];
      });

    const normalizedApiPath = toApiPath(absolute);
    const parent = normalizedApiPath === "/" ? null : toApiPath(path.dirname(absolute));

    res.json({ path: normalizedApiPath, parent, entries });
  } catch (e) {
    next(e);
  }
});
