import request from "supertest";
import fs from "fs";
import path from "path";
import { createApp } from "../src/app";
import { getToken } from "./helpers";

const STORAGE = process.env.STORAGE_ROOT!;

describe("upload + browse + file ops", () => {
  const app = createApp();
  let token: string;

  beforeAll(async () => {
    token = await getToken(app);
  });

  it("rejects all protected routes without auth", async () => {
    const r1 = await request(app).get("/api/list");
    const r2 = await request(app).post("/api/upload");
    expect(r1.status).toBe(401);
    expect(r2.status).toBe(401);
  });

  it("creates a folder, uploads files, lists them, downloads, then deletes", async () => {
    const folder = await request(app)
      .post("/api/folder")
      .set("Authorization", `Bearer ${token}`)
      .send({ path: "/photos" });
    expect(folder.status).toBe(201);
    expect(folder.body.path).toBe("/photos");

    const upload = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("path", "/photos")
      .attach("files", Buffer.from("hello world"), "hello.txt");
    expect(upload.status).toBe(201);
    expect(upload.body.files).toHaveLength(1);
    expect(upload.body.files[0].path).toBe("/photos/hello.txt");
    expect(upload.body.files[0].size).toBe(11);

    const list = await request(app)
      .get("/api/list?path=/photos")
      .set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.path).toBe("/photos");
    expect(list.body.parent).toBe("/");
    expect(list.body.entries).toHaveLength(1);
    expect(list.body.entries[0].name).toBe("hello.txt");
    expect(list.body.entries[0].type).toBe("file");

    const dl = await request(app)
      .get("/api/file/download?path=/photos/hello.txt")
      .set("Authorization", `Bearer ${token}`);
    expect(dl.status).toBe(200);
    expect(dl.headers["content-disposition"]).toMatch(/attachment/);
    expect(dl.text).toBe("hello world");

    const inline = await request(app)
      .get(`/api/file?path=/photos/hello.txt&t=${token}`);
    expect(inline.status).toBe(200);
    expect(inline.headers["content-disposition"]).toMatch(/inline/);
    expect(inline.headers["accept-ranges"]).toBe("bytes");

    const del = await request(app)
      .delete("/api/entry?path=/photos/hello.txt")
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(204);
    expect(fs.existsSync(path.join(STORAGE, "photos", "hello.txt"))).toBe(false);
  });

  it("rejects upload to a nonexistent folder", async () => {
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("path", "/does-not-exist")
      .attach("files", Buffer.from("x"), "x.txt");
    expect(res.status).toBe(404);
  });

  it("rejects duplicate uploads without overwrite, accepts with overwrite", async () => {
    await request(app)
      .post("/api/folder")
      .set("Authorization", `Bearer ${token}`)
      .send({ path: "/dups" });

    await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("path", "/dups")
      .attach("files", Buffer.from("a"), "a.txt");

    const dup = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("path", "/dups")
      .attach("files", Buffer.from("b"), "a.txt");
    expect(dup.status).toBe(409);

    const ow = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("path", "/dups")
      .field("overwrite", "true")
      .attach("files", Buffer.from("b"), "a.txt");
    expect(ow.status).toBe(201);
    expect(ow.body.files[0].size).toBe(1);
  });

  it("supports Range requests for media streaming", async () => {
    await request(app)
      .post("/api/folder")
      .set("Authorization", `Bearer ${token}`)
      .send({ path: "/media" });

    const body = Buffer.from("0123456789abcdef");
    await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("path", "/media")
      .attach("files", body, "blob.bin");

    const res = await request(app)
      .get("/api/file?path=/media/blob.bin")
      .set("Authorization", `Bearer ${token}`)
      .set("Range", "bytes=4-7");
    expect(res.status).toBe(206);
    expect(res.headers["content-range"]).toBe("bytes 4-7/16");
    expect(res.headers["content-length"]).toBe("4");
    expect(res.body.toString()).toBe("4567");
  });
});

describe("folder + move", () => {
  const app = createApp();
  let token: string;

  beforeAll(async () => {
    token = await getToken(app);
  });

  it("creates folder recursively", async () => {
    const res = await request(app)
      .post("/api/folder")
      .set("Authorization", `Bearer ${token}`)
      .send({ path: "/a/b/c", recursive: true });
    expect(res.status).toBe(201);
    expect(fs.existsSync(path.join(STORAGE, "a", "b", "c"))).toBe(true);
  });

  it("rejects folder creation when parent missing and not recursive", async () => {
    const res = await request(app)
      .post("/api/folder")
      .set("Authorization", `Bearer ${token}`)
      .send({ path: "/missing-parent/child" });
    expect(res.status).toBe(404);
  });

  it("renames a file via /move", async () => {
    await request(app)
      .post("/api/folder")
      .set("Authorization", `Bearer ${token}`)
      .send({ path: "/move-test" });
    await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("path", "/move-test")
      .attach("files", Buffer.from("data"), "old.txt");

    const res = await request(app)
      .post("/api/move")
      .set("Authorization", `Bearer ${token}`)
      .send({ from: "/move-test/old.txt", to: "/move-test/new.txt" });
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(STORAGE, "move-test", "new.txt"))).toBe(true);
    expect(fs.existsSync(path.join(STORAGE, "move-test", "old.txt"))).toBe(false);
  });

  it("rejects move to existing destination", async () => {
    await request(app)
      .post("/api/folder")
      .set("Authorization", `Bearer ${token}`)
      .send({ path: "/move-conflict" });
    await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("path", "/move-conflict")
      .attach("files", Buffer.from("a"), "a.txt")
      .attach("files", Buffer.from("b"), "b.txt");

    const res = await request(app)
      .post("/api/move")
      .set("Authorization", `Bearer ${token}`)
      .send({ from: "/move-conflict/a.txt", to: "/move-conflict/b.txt" });
    expect(res.status).toBe(409);
  });
});

describe("path security", () => {
  const app = createApp();
  let token: string;

  beforeAll(async () => {
    token = await getToken(app);
  });

  it("rejects traversal attempts", async () => {
    const cases = ["/../etc/passwd", "/foo/../../etc", "../escape"];
    for (const p of cases) {
      const res = await request(app)
        .get(`/api/list?path=${encodeURIComponent(p)}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_PATH");
    }
  });

  it("rejects deleting the storage root", async () => {
    const res = await request(app)
      .delete("/api/entry?path=/")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
