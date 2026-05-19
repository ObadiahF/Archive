import fs from "fs";
import path from "path";
import { appWithToken, authed, seedFile, seedFolder } from "../helpers";

const STORAGE = process.env.STORAGE_ROOT!;

describe("DELETE /api/entry", () => {
  it("deletes a file and returns 204", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/del");
    await seedFile(app, token, "/del", "x.txt", "x");
    const res = await authed(app, token).delete("/api/entry?path=/del/x.txt");
    expect(res.status).toBe(204);
    expect(fs.existsSync(path.join(STORAGE, "del", "x.txt"))).toBe(false);
  });

  it("deletes a folder recursively", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/rec/a/b", { recursive: true });
    await seedFile(app, token, "/rec/a/b", "deep.txt", "x");
    const res = await authed(app, token).delete("/api/entry?path=/rec");
    expect(res.status).toBe(204);
    expect(fs.existsSync(path.join(STORAGE, "rec"))).toBe(false);
  });

  it("404 when the entry does not exist", async () => {
    const { app, token } = await appWithToken();
    const res = await authed(app, token).delete("/api/entry?path=/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("400 INVALID_REQUEST when deleting the storage root", async () => {
    const { app, token } = await appWithToken();
    const res = await authed(app, token).delete("/api/entry?path=/");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_REQUEST");
  });

  it("400 INVALID_PATH on traversal attempts", async () => {
    const { app, token } = await appWithToken();
    const res = await authed(app, token).delete(
      "/api/entry?path=" + encodeURIComponent("/../etc/passwd"),
    );
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_PATH");
  });
});
