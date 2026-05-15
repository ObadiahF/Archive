import { Router, Request, Response, NextFunction } from "express";
import fs from "fs";
import { resolveSafe } from "../storage";
import { config } from "../config";
import { Errors } from "../errors";

export const entryRouter = Router();

entryRouter.delete("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiPath = typeof req.query.path === "string" ? req.query.path : "";
    const absolute = resolveSafe(apiPath);

    if (absolute === config.storageRoot) throw Errors.invalidRequest("Cannot delete storage root");
    if (!fs.existsSync(absolute)) throw Errors.notFound("Path not found");

    fs.rmSync(absolute, { recursive: true, force: true });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
