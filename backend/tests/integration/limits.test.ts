import { appWithToken, authed, seedFolder } from "../helpers";

const MAX_BYTES = Number(process.env.MAX_FILE_BYTES); // 10 MB in test setup
const MAX_FILES = Number(process.env.MAX_FILES_PER_REQUEST); // 5 in test setup

describe("upload limits", () => {
  it("413 FILE_TOO_LARGE when a single file exceeds MAX_FILE_BYTES", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/big");
    const tooBig = Buffer.alloc(MAX_BYTES + 1024, 0x41);
    const res = await authed(app, token)
      .post("/api/upload")
      .field("path", "/big")
      .attach("files", tooBig, "huge.bin");
    expect(res.status).toBe(413);
    expect(res.body.code).toBe("FILE_TOO_LARGE");
  });

  it("rejects when more than MAX_FILES_PER_REQUEST files are attached", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/many");

    let req = authed(app, token).post("/api/upload").field("path", "/many");
    for (let i = 0; i < MAX_FILES + 1; i++) {
      req = req.attach("files", Buffer.from("x"), `f${i}.txt`);
    }
    const res = await req;
    expect(res.status).toBe(400);
  });

  it("413 FILE_TOO_LARGE for JSON body exceeding 5MB limit on POST /api/file", async () => {
    const { app, token } = await appWithToken();
    await seedFolder(app, token, "/jsonbig");
    const huge = "a".repeat(6 * 1024 * 1024);
    const res = await authed(app, token)
      .post("/api/file")
      .send({ path: "/jsonbig/big.txt", content: huge });
    expect(res.status).toBe(413);
    expect(res.body.code).toBe("FILE_TOO_LARGE");
  });
});
