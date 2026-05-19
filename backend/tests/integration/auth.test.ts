import request from "supertest";
import { createApp } from "../../src/app";

describe("auth", () => {
  const app = createApp();

  it("rejects login with bad credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "testuser", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects login with missing fields", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_REQUEST");
  });

  it("issues a token on valid login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "testuser", password: "testpass" });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(typeof res.body.expiresAt).toBe("string");
    expect(res.body.user.username).toBe("testuser");
  });

  it("GET /me without token returns 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /me with valid token returns user", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: "testuser", password: "testpass" });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("testuser");
  });

  it("accepts token via ?t= query param", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: "testuser", password: "testpass" });
    const res = await request(app).get(`/api/auth/me?t=${login.body.token}`);
    expect(res.status).toBe(200);
  });
});
