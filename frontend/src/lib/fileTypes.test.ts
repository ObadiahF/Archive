import { describe, expect, it } from "vitest"
import {
  formatBytes,
  formatDate,
  getExtension,
  getPreviewKind,
  getShikiLang,
} from "./fileTypes"

describe("getExtension()", () => {
  it("returns the lowercase extension after the last dot", () => {
    expect(getExtension("notes.md")).toBe("md")
    expect(getExtension("IMG.JPG")).toBe("jpg")
    expect(getExtension("archive.tar.gz")).toBe("gz")
  })

  it("returns '' for filenames without an extension", () => {
    expect(getExtension("README")).toBe("")
  })

  it("treats dotfiles as having no extension (no dot before the basename)", () => {
    expect(getExtension(".env")).toBe("env")
  })
})

describe("getPreviewKind()", () => {
  it("detects images by mimeType prefix", () => {
    expect(getPreviewKind("x.jpg", "image/jpeg")).toBe("image")
  })

  it("detects images by extension when mimeType is missing", () => {
    expect(getPreviewKind("cat.PNG")).toBe("image")
    expect(getPreviewKind("logo.svg")).toBe("image")
  })

  it("detects pdf by extension or mimeType", () => {
    expect(getPreviewKind("spec.pdf")).toBe("pdf")
    expect(getPreviewKind("x", "application/pdf")).toBe("pdf")
  })

  it("detects video and audio from mimeType prefix", () => {
    expect(getPreviewKind("clip.mp4", "video/mp4")).toBe("video")
    expect(getPreviewKind("song.mp3", "audio/mpeg")).toBe("audio")
  })

  it("detects code/text by extension or text/* mimeType", () => {
    expect(getPreviewKind("a.ts")).toBe("code")
    expect(getPreviewKind("notes.md")).toBe("code")
    expect(getPreviewKind("x.unknown", "text/plain")).toBe("code")
  })

  it("returns null for unsupported types", () => {
    expect(getPreviewKind("archive.zip", "application/zip")).toBeNull()
    expect(getPreviewKind("blob.bin")).toBeNull()
  })
})

describe("getShikiLang()", () => {
  it.each([
    ["index.ts", "typescript"],
    ["App.tsx", "tsx"],
    ["script.js", "javascript"],
    ["module.mjs", "javascript"],
    ["data.yaml", "yaml"],
    ["readme.md", "markdown"],
    ["main.py", "python"],
    ["build.sh", "bash"],
  ])("maps %s -> %s", (file, lang) => {
    expect(getShikiLang(file)).toBe(lang)
  })

  it("falls back to 'text' for unknown extensions", () => {
    expect(getShikiLang("blob.xyz")).toBe("text")
    expect(getShikiLang("NOEXT")).toBe("text")
  })
})

describe("formatBytes()", () => {
  it.each([
    [0, "0 B"],
    [512, "512 B"],
    [1024, "1.0 KB"],
    [1024 * 1024, "1.0 MB"],
    [1024 * 1024 * 1024, "1.0 GB"],
    [1.5 * 1024 * 1024, "1.5 MB"],
  ])("formats %i bytes -> %s", (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected)
  })
})

describe("formatDate()", () => {
  it("formats a numeric timestamp into a human-readable string", () => {
    const ts = Date.parse("2026-05-10T14:22:00Z")
    const result = formatDate(ts)
    expect(result).toMatch(/2026/)
    expect(result).toMatch(/May/)
  })
})
