import path from "path";
import fs from "fs";
import { config } from "./config";
import { Errors } from "./errors";

const MIME_BY_EXT: Record<string, string> = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".zip": "application/zip",
};

export function mimeFor(name: string): string {
  return MIME_BY_EXT[path.extname(name).toLowerCase()] || "application/octet-stream";
}

/**
 * Resolve an API path (POSIX-style, leading slash) to an absolute filesystem path
 * inside STORAGE_ROOT. Throws INVALID_PATH on traversal or malformed input.
 */
export function resolveSafe(apiPath: string): string {
  if (typeof apiPath !== "string" || !apiPath.startsWith("/")) {
    throw Errors.invalidPath("Path must start with /");
  }
  if (apiPath.includes("\0")) throw Errors.invalidPath("Null byte in path");

  const rawSegments = apiPath.split("/").filter((s) => s.length > 0);
  if (rawSegments.some((s) => s === "..")) {
    throw Errors.invalidPath("Path traversal not allowed");
  }

  const normalized = path.posix.normalize(apiPath);
  const segments = normalized.split("/").filter((s) => s.length > 0);
  const absolute = path.resolve(config.storageRoot, ...segments);

  const root = config.storageRoot + path.sep;
  if (absolute !== config.storageRoot && !absolute.startsWith(root)) {
    throw Errors.invalidPath("Path escapes storage root");
  }
  return absolute;
}

export function toApiPath(absolute: string): string {
  const rel = path.relative(config.storageRoot, absolute);
  if (rel === "") return "/";
  return "/" + rel.split(path.sep).join("/");
}

export function ensureStorageRoot(): void {
  if (!fs.existsSync(config.storageRoot)) {
    fs.mkdirSync(config.storageRoot, { recursive: true });
  }
}
