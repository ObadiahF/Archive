import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { ApiError } from "./errors";
import { requireAuth } from "./auth";
import { ensureStorageRoot } from "./storage";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { listRouter } from "./routes/list";
import { fileRouter } from "./routes/file";
import { uploadRouter } from "./routes/upload";
import { folderRouter } from "./routes/folder";
import { moveRouter } from "./routes/move";
import { entryRouter } from "./routes/entry";

export function createApp() {
  ensureStorageRoot();

  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);

  app.use("/api/list", requireAuth, listRouter);
  app.use("/api/file", requireAuth, fileRouter);
  app.use("/api/upload", requireAuth, uploadRouter);
  app.use("/api/folder", requireAuth, folderRouter);
  app.use("/api/move", requireAuth, moveRouter);
  app.use("/api/entry", requireAuth, entryRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found", code: "NOT_FOUND" });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: err.message, code: err.code });
    }
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", code: "INTERNAL" });
  });

  return app;
}
