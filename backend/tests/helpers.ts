import request from "supertest";
import { Express } from "express";
import { createApp } from "../src/app";

export async function getToken(app: Express): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username: "testuser", password: "testpass" });
  return res.body.token;
}

/**
 * Create a fresh Express app and return it with a valid auth token for the
 * configured test user. Saves four lines of boilerplate per test file.
 */
export async function appWithToken(): Promise<{ app: Express; token: string }> {
  const app = createApp();
  const token = await getToken(app);
  return { app, token };
}

export async function seedFolder(
  app: Express,
  token: string,
  apiPath: string,
  opts: { recursive?: boolean } = {},
): Promise<void> {
  await request(app)
    .post("/api/folder")
    .set("Authorization", `Bearer ${token}`)
    .send({ path: apiPath, recursive: opts.recursive ?? false });
}

export async function seedFile(
  app: Express,
  token: string,
  folder: string,
  name: string,
  content: Buffer | string = "hello",
): Promise<void> {
  await request(app)
    .post("/api/upload")
    .set("Authorization", `Bearer ${token}`)
    .field("path", folder)
    .attach("files", typeof content === "string" ? Buffer.from(content) : content, name);
}

export async function seedTextFile(
  app: Express,
  token: string,
  apiPath: string,
  content: string = "",
): Promise<void> {
  await request(app)
    .post("/api/file")
    .set("Authorization", `Bearer ${token}`)
    .send({ path: apiPath, content });
}

export function authed(app: Express, token: string) {
  return {
    get: (url: string) => request(app).get(url).set("Authorization", `Bearer ${token}`),
    post: (url: string) => request(app).post(url).set("Authorization", `Bearer ${token}`),
    put: (url: string) => request(app).put(url).set("Authorization", `Bearer ${token}`),
    delete: (url: string) => request(app).delete(url).set("Authorization", `Bearer ${token}`),
  };
}
