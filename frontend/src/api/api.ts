import type { FsEntry, FsFile, FsFolder, UploadProgressEvent } from "./types"
import { clearToken, getToken, setToken } from "./auth"

const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, "") || ""

interface BackendEntry {
  name: string
  path: string
  type: "file" | "folder"
  size: number | null
  mimeType: string | null
  modifiedAt: string
}

interface ListResponse {
  path: string
  parent: string | null
  entries: BackendEntry[]
}

export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

function toApiPath(p: string): string {
  if (!p || p === "/") return "/"
  const trimmed = p.replace(/^\/+/, "").replace(/\/+$/, "")
  return trimmed ? "/" + trimmed : "/"
}

function toFrontendPath(apiPath: string): string {
  return apiPath.replace(/^\/+/, "")
}

function entryToFs(e: BackendEntry): FsEntry {
  const modifiedAt = Date.parse(e.modifiedAt) || Date.now()
  if (e.type === "folder") {
    return {
      name: e.name,
      path: toFrontendPath(e.path),
      kind: "folder",
      modifiedAt,
    } satisfies FsFolder
  }
  return {
    name: e.name,
    path: toFrontendPath(e.path),
    kind: "file",
    modifiedAt,
    size: e.size ?? 0,
    mimeType: e.mimeType ?? "application/octet-stream",
  } satisfies FsFile
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`
  let code: string | undefined
  try {
    const body = await res.json()
    if (body && typeof body.error === "string") message = body.error
    if (body && typeof body.code === "string") code = body.code
  } catch {
    /* non-JSON body */
  }
  return new ApiError(message, res.status, code)
}

async function request(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(API_BASE + input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...authHeaders(),
    },
  })
  if (res.status === 401) {
    clearToken()
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login")
    }
    throw await parseError(res)
  }
  if (!res.ok) throw await parseError(res)
  return res
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(API_BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw await parseError(res)
  const data = (await res.json()) as { token: string; expiresAt: string }
  setToken(data.token, data.expiresAt)
}

export async function logout(): Promise<void> {
  clearToken()
}

export async function me(): Promise<{ username: string }> {
  const res = await request("/api/auth/me")
  const data = (await res.json()) as { user: { username: string } }
  return data.user
}

export async function listFolder(path: string): Promise<FsEntry[]> {
  const apiPath = toApiPath(path)
  const res = await request(`/api/list?path=${encodeURIComponent(apiPath)}`)
  const data = (await res.json()) as ListResponse
  const entries = data.entries.map(entryToFs)
  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return entries
}

export async function getFolderTree(path: string = ""): Promise<FsFolder[]> {
  const entries = await listFolder(path)
  return entries.filter((e): e is FsFolder => e.kind === "folder")
}

export async function downloadFile(path: string): Promise<Blob> {
  const apiPath = toApiPath(path)
  const res = await request(`/api/file?path=${encodeURIComponent(apiPath)}`)
  return await res.blob()
}

export async function getFileUrl(path: string): Promise<string> {
  const blob = await downloadFile(path)
  return URL.createObjectURL(blob)
}

export async function getFileText(path: string): Promise<string> {
  const blob = await downloadFile(path)
  return blob.text()
}

export async function uploadFile(
  folderPath: string,
  file: File,
  onProgress?: (e: UploadProgressEvent) => void,
): Promise<FsFile> {
  const apiPath = toApiPath(folderPath)
  const form = new FormData()
  form.append("path", apiPath)
  form.append("files", file, file.name)

  return new Promise<FsFile>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", API_BASE + "/api/upload")
    const token = getToken()
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress({ loaded: ev.loaded, total: ev.total })
      }
    }
    xhr.onload = () => {
      if (xhr.status === 401) {
        clearToken()
        if (typeof window !== "undefined") window.location.assign("/login")
        reject(new ApiError("Unauthenticated", 401, "UNAUTHENTICATED"))
        return
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as { files: BackendEntry[] }
          const first = body.files[0]
          resolve(entryToFs(first) as FsFile)
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)))
        }
      } else {
        let message = `Upload failed (${xhr.status})`
        let code: string | undefined
        try {
          const body = JSON.parse(xhr.responseText)
          if (typeof body.error === "string") message = body.error
          if (typeof body.code === "string") code = body.code
        } catch {
          /* ignore */
        }
        reject(new ApiError(message, xhr.status, code))
      }
    }
    xhr.onerror = () => reject(new ApiError("Network error during upload", 0))
    xhr.send(form)
  })
}

export async function createFolder(parentPath: string, name: string): Promise<FsFolder> {
  const parent = toApiPath(parentPath)
  const newPath = parent === "/" ? `/${name}` : `${parent}/${name}`
  await request("/api/folder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: newPath }),
  })
  return {
    name,
    path: toFrontendPath(newPath),
    kind: "folder",
    modifiedAt: Date.now(),
  }
}

interface FileMetadataResponse {
  path: string
  size: number
  modifiedAt: string
  mimeType: string
}

function metadataToFsFile(meta: FileMetadataResponse): FsFile {
  const segments = meta.path.split("/").filter((s) => s.length > 0)
  const name = segments[segments.length - 1] ?? ""
  return {
    name,
    path: toFrontendPath(meta.path),
    kind: "file",
    modifiedAt: Date.parse(meta.modifiedAt) || Date.now(),
    size: meta.size,
    mimeType: meta.mimeType,
  }
}

export async function createFile(
  parentPath: string,
  name: string,
  content: string = "",
): Promise<FsFile> {
  const parent = toApiPath(parentPath)
  const newPath = parent === "/" ? `/${name}` : `${parent}/${name}`
  const res = await request("/api/file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: newPath, content }),
  })
  const data = (await res.json()) as FileMetadataResponse
  return metadataToFsFile(data)
}

export async function writeFile(path: string, content: string): Promise<FsFile> {
  const apiPath = toApiPath(path)
  const res = await request("/api/file", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: apiPath, content }),
  })
  const data = (await res.json()) as FileMetadataResponse
  return metadataToFsFile(data)
}

export async function deleteEntry(path: string): Promise<void> {
  const apiPath = toApiPath(path)
  if (apiPath === "/") throw new ApiError("Cannot delete the root", 400)
  await request(`/api/entry?path=${encodeURIComponent(apiPath)}`, { method: "DELETE" })
}

export async function moveEntry(from: string, to: string): Promise<void> {
  const fromApi = toApiPath(from)
  const toApi = toApiPath(to)
  await request("/api/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromApi, to: toApi }),
  })
}
