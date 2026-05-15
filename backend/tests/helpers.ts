import request from "supertest";
import { Express } from "express";

export async function getToken(app: Express): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username: "testuser", password: "testpass" });
  return res.body.token;
}
