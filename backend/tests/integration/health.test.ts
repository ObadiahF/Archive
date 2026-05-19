import request from "supertest";
import { createApp } from "../../src/app";

describe("operational endpoints", () => {
  const app = createApp();

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("404 for unknown routes", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
