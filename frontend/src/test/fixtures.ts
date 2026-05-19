import type { FsFile, FsFolder } from "@/api/types"

export const TEST_TOKEN = "test.jwt.token"
export const TEST_USERNAME = "testuser"
export const TEST_PASSWORD = "testpass"

export function makeFile(overrides: Partial<FsFile> = {}): FsFile {
  return {
    name: "note.md",
    path: "note.md",
    kind: "file",
    size: 42,
    mimeType: "text/markdown",
    modifiedAt: Date.parse("2026-05-10T12:00:00Z"),
    ...overrides,
  }
}

export function makeFolder(overrides: Partial<FsFolder> = {}): FsFolder {
  return {
    name: "photos",
    path: "photos",
    kind: "folder",
    modifiedAt: Date.parse("2026-05-09T10:00:00Z"),
    ...overrides,
  }
}

export interface BackendEntryFixture {
  name: string
  path: string
  type: "file" | "folder"
  size: number | null
  mimeType: string | null
  modifiedAt: string
}

export function backendFile(overrides: Partial<BackendEntryFixture> = {}): BackendEntryFixture {
  return {
    name: "note.md",
    path: "/note.md",
    type: "file",
    size: 42,
    mimeType: "text/markdown",
    modifiedAt: "2026-05-10T12:00:00.000Z",
    ...overrides,
  }
}

export function backendFolder(overrides: Partial<BackendEntryFixture> = {}): BackendEntryFixture {
  return {
    name: "photos",
    path: "/photos",
    type: "folder",
    size: null,
    mimeType: null,
    modifiedAt: "2026-05-09T10:00:00.000Z",
    ...overrides,
  }
}

export function futureIso(hours = 24): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}
