import os from "os";
import path from "path";
import fs from "fs";

const tmpRoot = path.join(os.tmpdir(), "fum-test-storage");
fs.mkdirSync(tmpRoot, { recursive: true });

process.env.STORAGE_ROOT = tmpRoot;
process.env.AUTH_USERNAME = "testuser";
process.env.AUTH_PASSWORD = "testpass";
process.env.JWT_SECRET = "test-secret-do-not-use-in-prod";
process.env.JWT_TTL_HOURS = "1";
process.env.MAX_FILE_BYTES = String(10 * 1024 * 1024);
process.env.MAX_FILES_PER_REQUEST = "5";
