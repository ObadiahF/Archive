import { Router, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { resolveSafe, toApiPath } from "../storage";
import { Errors } from "../errors";

export const moveRouter = Router();

moveRouter.post("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.body ?? {};
    if (typeof from !== "string" || typeof to !== "string") {
      throw Errors.invalidRequest("from and to are required");
    }

    const fromAbs = resolveSafe(from);
    const toAbs = resolveSafe(to);

    if (!fs.existsSync(fromAbs)) throw Errors.notFound("Source not found");
    if (fs.existsSync(toAbs)) throw Errors.alreadyExists("Destination already exists");

    const toParent = path.dirname(toAbs);
    if (!fs.existsSync(toParent)) throw Errors.notFound("Destination parent folder does not exist");

    fs.renameSync(fromAbs, toAbs);
    res.json({ from: toApiPath(fromAbs), to: toApiPath(toAbs) });
  } catch (e) {
    next(e);
  }
});
