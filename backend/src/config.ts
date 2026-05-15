import path from "path";
import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Env var ${name} is not a number`);
  return n;
}

export const config = {
  port: int("PORT", 3000),
  storageRoot: path.resolve(process.cwd(), process.env.STORAGE_ROOT || "./storage"),
  auth: {
    username: required("AUTH_USERNAME"),
    password: required("AUTH_PASSWORD"),
  },
  jwt: {
    secret: required("JWT_SECRET"),
    ttlHours: int("JWT_TTL_HOURS", 24),
  },
  upload: {
    maxFileBytes: int("MAX_FILE_BYTES", 100 * 1024 * 1024),
    maxFilesPerRequest: int("MAX_FILES_PER_REQUEST", 20),
  },
};
