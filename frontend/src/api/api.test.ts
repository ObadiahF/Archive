import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/test/server"
import { TEST_PASSWORD, TEST_USERNAME, backendFile, backendFolder } from "@/test/fixtures"
import { installMockXhr } from "@/test/mockXhr"
import { clearToken, setToken } from "./auth"
import {
  ApiError,
  createFile,
  createFolder,
  deleteEntry,
  downloadFile,
  getFileText,
  getFileUrl,
  getFolderTree,
  listFolder,
  login,
  logout,
  me,
  moveEntry,
  uploadFile,
  writeFile,
} from "./api"

const FUTURE = new Date(Date.now() + 60 * 60 * 1000).toISOString()

function authed() {
  setToken("test.jwt.token", FUTURE)
}

const locationAssign = vi.fn()

beforeEach(() => {
  vi.stubGlobal("location", {
    ...window.location,
    assign: locationAssign,
    pathname: "/files",
  })
  locationAssign.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("login / logout / me", () => {
  it("login() stores the returned token", async () => {
    await login(TEST_USERNAME, TEST_PASSWORD)
    expect(localStorage.getItem("archive.token")).toBe("test.jwt.token")
  })

  it("login() throws ApiError with code on 401", async () => {
    await expect(login("nope", "nope")).rejects.toBeInstanceOf(ApiError)
    try {
      await login("nope", "nope")
    } catch (err) {
      const e = err as ApiError
      expect(e.status).toBe(401)
      expect(e.code).toBe("INVALID_CREDENTIALS")
    }
  })

  it("logout() clears the token", async () => {
    authed()
    await logout()
    expect(localStorage.getItem("archive.token")).toBeNull()
  })

  it("me() returns the user with a valid token", async () => {
    authed()
    const user = await me()
    expect(user.username).toBe(TEST_USERNAME)
  })

  it("me() with no token redirects to /login and throws", async () => {
    clearToken()
    await expect(me()).rejects.toBeInstanceOf(ApiError)
    expect(locationAssign).toHaveBeenCalledWith("/login")
  })
})

describe("listFolder() + getFolderTree()", () => {
  beforeEach(authed)

  it("encodes the path and returns sorted entries (folders before files)", async () => {
    let captured: URL | null = null
    server.use(
      http.get("/api/list", ({ request }) => {
        captured = new URL(request.url)
        return HttpResponse.json({
          path: "/photos 2024",
          parent: "/",
          entries: [
            backendFile({ name: "z.txt", path: "/z.txt" }),
            backendFolder({ name: "alpha", path: "/alpha" }),
            backendFile({ name: "a.txt", path: "/a.txt" }),
            backendFolder({ name: "Beta", path: "/Beta" }),
          ],
        })
      }),
    )
    const entries = await listFolder("photos 2024")
    expect(captured).not.toBeNull()
    expect(captured!.searchParams.get("path")).toBe("/photos 2024")
    expect(entries.map((e) => `${e.kind}:${e.name}`)).toEqual([
      "folder:alpha",
      "folder:Beta",
      "file:a.txt",
      "file:z.txt",
    ])
  })

  it("converts backend paths (leading slash) into frontend paths (no leading slash)", async () => {
    const entries = await listFolder("/")
    expect(entries.every((e) => !e.path.startsWith("/"))).toBe(true)
  })

  it("getFolderTree() returns only folder entries", async () => {
    const folders = await getFolderTree("/")
    expect(folders.every((e) => e.kind === "folder")).toBe(true)
  })
})

describe("file read / download", () => {
  beforeEach(authed)

  it("downloadFile() returns a Blob-like with text() content", async () => {
    const blob = await downloadFile("/note.md")
    expect(typeof blob.text).toBe("function")
    expect(await blob.text()).toBe("hello world")
  })

  it("getFileUrl() returns an object URL string", async () => {
    const url = await getFileUrl("/note.md")
    expect(typeof url).toBe("string")
    expect(url).toMatch(/^blob:/)
  })

  it("getFileText() returns text content", async () => {
    const text = await getFileText("/note.md")
    expect(text).toBe("hello world")
  })
})

describe("upload (XHR with progress)", () => {
  beforeEach(authed)

  it("uploads, sends the auth header, and reports progress", async () => {
    const xhr = installMockXhr({
      status: 201,
      body: {
        files: [
          { name: "doc.txt", path: "/doc.txt", size: 5, mimeType: "text/plain" },
        ],
      },
      progress: [
        { loaded: 50, total: 100 },
        { loaded: 100, total: 100 },
      ],
    })
    try {
      const file = new File(["hello"], "doc.txt", { type: "text/plain" })
      const progress: number[] = []
      const result = await uploadFile("photos", file, (e) => {
        progress.push(e.loaded)
      })
      expect(result.kind).toBe("file")
      expect(result.name).toBe("doc.txt")
      expect(progress).toEqual([50, 100])
      expect(xhr.requests).toHaveLength(1)
      expect(xhr.requests[0].method).toBe("POST")
      expect(xhr.requests[0].url).toMatch(/\/api\/upload$/)
      expect(xhr.requests[0].headers.authorization).toBe("Bearer test.jwt.token")
    } finally {
      xhr.restore()
    }
  })

  it("rejects with ApiError on non-2xx response", async () => {
    const xhr = installMockXhr({
      status: 413,
      body: { error: "File too large", code: "FILE_TOO_LARGE" },
    })
    try {
      const file = new File(["x"], "x.txt")
      await expect(uploadFile("", file)).rejects.toMatchObject({
        status: 413,
        code: "FILE_TOO_LARGE",
      })
    } finally {
      xhr.restore()
    }
  })

  it("redirects to /login on 401 during upload", async () => {
    const xhr = installMockXhr({
      status: 401,
      body: { error: "nope", code: "UNAUTHENTICATED" },
    })
    try {
      const file = new File(["x"], "x.txt")
      await expect(uploadFile("", file)).rejects.toMatchObject({ status: 401 })
      expect(locationAssign).toHaveBeenCalledWith("/login")
    } finally {
      xhr.restore()
    }
  })
})

describe("create / write / delete / move", () => {
  beforeEach(authed)

  it("createFolder() composes the new path and returns metadata", async () => {
    const folder = await createFolder("photos", "2025")
    expect(folder.kind).toBe("folder")
    expect(folder.name).toBe("2025")
    expect(folder.path).toBe("photos/2025")
  })

  it("createFolder() composes correctly for root parent", async () => {
    const folder = await createFolder("", "top")
    expect(folder.path).toBe("top")
  })

  it("createFile() returns a file with size derived from response", async () => {
    let receivedBody: { path: string; content: string } | null = null
    server.use(
      http.post("/api/file", async ({ request }) => {
        receivedBody = (await request.json()) as { path: string; content: string }
        return HttpResponse.json(
          {
            path: receivedBody.path,
            size: receivedBody.content.length,
            modifiedAt: new Date().toISOString(),
            mimeType: "text/markdown",
          },
          { status: 201 },
        )
      }),
    )
    const file = await createFile("notes", "todo.md", "# hi\n")
    expect(receivedBody).not.toBeNull()
    expect(receivedBody!.path).toBe("/notes/todo.md")
    expect(receivedBody!.content).toBe("# hi\n")
    expect(file.size).toBe(5)
  })

  it("writeFile() PUTs to the api and returns metadata", async () => {
    const file = await writeFile("/notes/todo.md", "x")
    expect(file.kind).toBe("file")
  })

  it("deleteEntry() rejects deleting the root", async () => {
    await expect(deleteEntry("/")).rejects.toBeInstanceOf(ApiError)
  })

  it("deleteEntry() sends the encoded path", async () => {
    let captured: URL | null = null
    server.use(
      http.delete("/api/entry", ({ request }) => {
        captured = new URL(request.url)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await deleteEntry("photos/img 1.jpg")
    expect(captured).not.toBeNull()
    expect(captured!.searchParams.get("path")).toBe("/photos/img 1.jpg")
  })

  it("moveEntry() sends absolute api paths in the body", async () => {
    let body: { from: string; to: string } | null = null
    server.use(
      http.post("/api/move", async ({ request }) => {
        body = (await request.json()) as { from: string; to: string }
        return HttpResponse.json(body)
      }),
    )
    await moveEntry("a/b.txt", "c/b.txt")
    expect(body).toEqual({ from: "/a/b.txt", to: "/c/b.txt" })
  })
})

describe("error mapping", () => {
  beforeEach(authed)

  it("401 on any request clears the token and redirects", async () => {
    server.use(
      http.get("/api/list", () =>
        HttpResponse.json({ error: "no", code: "UNAUTHENTICATED" }, { status: 401 }),
      ),
    )
    await expect(listFolder("/")).rejects.toBeInstanceOf(ApiError)
    expect(localStorage.getItem("archive.token")).toBeNull()
    expect(locationAssign).toHaveBeenCalledWith("/login")
  })

  it("parses error code from json body", async () => {
    server.use(
      http.get("/api/list", () =>
        HttpResponse.json({ error: "boom", code: "INVALID_PATH" }, { status: 400 }),
      ),
    )
    await expect(listFolder("..")).rejects.toMatchObject({
      status: 400,
      code: "INVALID_PATH",
    })
  })

  it("tolerates a non-JSON error body", async () => {
    server.use(
      http.get("/api/list", () => new HttpResponse("server died", { status: 500 })),
    )
    await expect(listFolder("/")).rejects.toMatchObject({ status: 500 })
  })
})
