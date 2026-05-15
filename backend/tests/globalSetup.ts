import os from "os";
import path from "path";
import fs from "fs";

module.exports = async function () {
  const dir = path.join(os.tmpdir(), "fum-test-storage");
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
};
