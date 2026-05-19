import fs from "fs";
import path from "path";
import { appWithToken, authed, seedFile, seedFolder, seedTextFile } from "../helpers";

const STORAGE = process.env.STORAGE_ROOT!;

describe("POST /api/file (create text file)", () => {
  it("creates a text file with content under an existing parent", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/notes");
    const res = await authed(app, token)
      .post("/api/file")
      .send({ path: "/notes/todo.md", content: "# Todo\n" });
    expect(res.status).toBe(201);
    expect(res.body.path).toBe("/notes/todo.md");
    expect(res.body.size).toBe(7);
    expect(res.body.mimeType).toBe("text/markdown");
    expect(fs.readFileSync(path.join(STORAGE, "notes", "todo.md"), "utf8")).toBe("# Todo\n");
  });

  it("defaults to empty content when content is omitted", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/empties");
    const res = await authed(app, token).post("/api/file").send({ path: "/empties/blank.md" });
    expect(res.status).toBe(201);
    expect(res.body.size).toBe(0);
  });

  it("409 when the file already exists", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/dupcreate");
    await seedTextFile(app, token, "/dupcreate/x.txt", "first");
    const res = await authed(app, token)
      .post("/api/file")
      .send({ path: "/dupcreate/x.txt", content: "second" });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("ALREADY_EXISTS");
  });

  it("404 when the parent folder does not exist", async () => {
    const { app, token } = await appWithToken();
    const res = await authed(app, token)
      .post("/api/file")
      .send({ path: "/does-not-exist/x.txt", content: "" });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("400 when content is not a string", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/badcontent");
    const res = await authed(app, token)
      .post("/api/file")
      .send({ path: "/badcontent/x.md", content: 42 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_REQUEST");
  });

  it("400 INVALID_PATH on traversal", async () => {
    const { app, token } = await appWithToken();
    const res = await authed(app, token)
      .post("/api/file")
      .send({ path: "/../escape.txt", content: "" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_PATH");
  });
});

describe("PUT /api/file (overwrite text file)", () => {
  it("overwrites an existing file and returns updated metadata", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/edit");
    await seedTextFile(app, token, "/edit/note.md", "old");
    const res = await authed(app, token)
      .put("/api/file")
      .send({ path: "/edit/note.md", content: "new content" });
    expect(res.status).toBe(200);
    expect(res.body.size).toBe(11);
    expect(fs.readFileSync(path.join(STORAGE, "edit", "note.md"), "utf8")).toBe("new content");
  });

  it("404 when the file does not exist", async () => {
    const { app, token } = await appWithToken();
    const res = await authed(app, token)
      .put("/api/file")
      .send({ path: "/missing.txt", content: "x" });
    expect(res.status).toBe(404);
  });

  it("400 when the path resolves to a folder", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/notafile");
    const res = await authed(app, token)
      .put("/api/file")
      .send({ path: "/notafile", content: "x" });
    expect(res.status).toBe(400);
  });

  it("400 when content is missing", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/nocontent");
    await seedTextFile(app, token, "/nocontent/x.md", "");
    const res = await authed(app, token).put("/api/file").send({ path: "/nocontent/x.md" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/file (inline) + /api/file/download", () => {
  it("inline sets Content-Disposition: inline with UTF-8 encoded filename", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/inline");
    await seedFile(app, token, "/inline", "report.txt", "hello");
    const res = await authed(app, token).get("/api/file?path=/inline/report.txt");
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toMatch(/^inline/);
    expect(res.headers["content-disposition"]).toMatch(/filename\*=UTF-8''report\.txt/);
  });

  it("download sets Content-Disposition: attachment", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/dl");
    await seedFile(app, token, "/dl", "x.txt", "hi");
    const res = await authed(app, token).get("/api/file/download?path=/dl/x.txt");
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toMatch(/^attachment/);
    expect(res.text).toBe("hi");
  });

  it("416 on unsatisfiable Range", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/range");
    await seedFile(app, token, "/range", "blob.bin", Buffer.from("0123456789"));
    const res = await authed(app, token)
      .get("/api/file?path=/range/blob.bin")
      .set("Range", "bytes=100-200");
    expect(res.status).toBe(416);
    expect(res.headers["content-range"]).toBe("bytes */10");
  });

  it("416 on malformed Range header", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/badrange");
    await seedFile(app, token, "/badrange", "b.bin", Buffer.from("abcd"));
    const res = await authed(app, token)
      .get("/api/file?path=/badrange/b.bin")
      .set("Range", "items=0-3");
    expect(res.status).toBe(416);
  });

  it("suffix range request bytes=-N returns the last N bytes", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/suffix");
    await seedFile(app, token, "/suffix", "b.bin", Buffer.from("0123456789"));
    const res = await authed(app, token)
      .get("/api/file?path=/suffix/b.bin")
      .set("Range", "bytes=-3");
    expect(res.status).toBe(206);
    expect(res.headers["content-range"]).toBe("bytes 7-9/10");
    expect(res.body.toString()).toBe("789");
  });

  it("400 when the path resolves to a folder", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/foldernotfile");
    const res = await authed(app, token).get("/api/file?path=/foldernotfile");
    expect(res.status).toBe(400);
  });

  it("404 when the file does not exist", async () => {
    const { app, token } = await appWithToken();
    const res = await authed(app, token).get("/api/file?path=/nope.txt");
    expect(res.status).toBe(404);
  });

  it("accepts token via ?t= query param (for <img>/<video> tags)", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/qtoken");
    await seedFile(app, token, "/qtoken", "x.txt", "ok");
    // Note: no Authorization header — only ?t=
    const supertest = (await import("supertest")).default;
    const res = await supertest(app).get(`/api/file?path=/qtoken/x.txt&t=${token}`);
    expect(res.status).toBe(200);
    expect(res.text).toBe("ok");
  });
});
