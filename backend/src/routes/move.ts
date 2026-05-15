import { Router, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { resolveSafe, toApiPath } from "../storage";
import { Errors } from "../errors";

export const moveRouter = Router();

// Docker Desktop's WSL2 bind mount has a known stale-dirent bug after
// rename(2) across directories: readdir sees the entry but stat returns
// ENOENT. Copying the bytes and unlinking the source uses different
// syscalls (open/write/unlink) and avoids the bad cache state.
function moveEntry(src: string, dst: string): void {
  const stat = fs.lstatSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst);
    for (const name of fs.readdirSync(src)) {
      moveEntry(path.join(src, name), path.join(dst, name));
    }
    fs.rmdirSync(src);
  } else {
    fs.writeFileSync(dst, fs.readFileSync(src));
    fs.unlinkSync(src);
  }
}

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

    moveEntry(fromAbs, toAbs);
    res.json({ from: toApiPath(fromAbs), to: toApiPath(toAbs) });
  } catch (e) {
    next(e);
  }
});
