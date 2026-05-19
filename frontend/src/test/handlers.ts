import { http, HttpResponse } from "msw"
import {
  TEST_PASSWORD,
  TEST_USERNAME,
  backendFile,
  backendFolder,
  futureIso,
} from "./fixtures"

interface LoginBody {
  username?: string
  password?: string
}

export const defaultHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as LoginBody
    if (body.username !== TEST_USERNAME || body.password !== TEST_PASSWORD) {
      return HttpResponse.json(
        { error: "Invalid username or password", code: "INVALID_CREDENTIALS" },
        { status: 401 },
      )
    }
    return HttpResponse.json({
      token: "test.jwt.token",
      expiresAt: futureIso(24),
      user: { username: TEST_USERNAME },
    })
  }),

  http.get("/api/auth/me", ({ request }) => {
    const auth = request.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: "Missing token", code: "UNAUTHENTICATED" },
        { status: 401 },
      )
    }
    return HttpResponse.json({ user: { username: TEST_USERNAME } })
  }),

  http.get("/api/list", ({ request }) => {
    const url = new URL(request.url)
    const path = url.searchParams.get("path") ?? "/"
    return HttpResponse.json({
      path,
      parent: path === "/" ? null : "/",
      entries: [
        backendFolder({ name: "photos", path: "/photos" }),
        backendFile({ name: "readme.md", path: "/readme.md" }),
      ],
    })
  }),

  http.get("/api/file", () => {
    return new HttpResponse("hello world", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  }),

  http.post("/api/folder", async ({ request }) => {
    const body = (await request.json()) as { path: string }
    return HttpResponse.json(
      { path: body.path, createdAt: new Date().toISOString() },
      { status: 201 },
    )
  }),

  http.post("/api/file", async ({ request }) => {
    const body = (await request.json()) as { path: string; content?: string }
    return HttpResponse.json(
      {
        path: body.path,
        size: (body.content ?? "").length,
        modifiedAt: new Date().toISOString(),
        mimeType: "text/plain",
      },
      { status: 201 },
    )
  }),

  http.put("/api/file", async ({ request }) => {
    const body = (await request.json()) as { path: string; content: string }
    return HttpResponse.json({
      path: body.path,
      size: body.content.length,
      modifiedAt: new Date().toISOString(),
      mimeType: "text/plain",
    })
  }),

  http.post("/api/move", async ({ request }) => {
    const body = (await request.json()) as { from: string; to: string }
    return HttpResponse.json({ from: body.from, to: body.to })
  }),

  http.delete("/api/entry", () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post("/api/upload", () => {
    return HttpResponse.json(
      {
        files: [
          {
            name: "uploaded.txt",
            path: "/uploaded.txt",
            size: 11,
            mimeType: "text/plain",
          },
        ],
      },
      { status: 201 },
    )
  }),
]
