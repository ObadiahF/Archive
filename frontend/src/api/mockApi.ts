import type { FsEntry, FsFile, FsFolder, UploadProgressEvent } from "./types"

interface MockNode {
  name: string
  kind: "file" | "folder"
  modifiedAt: number
  children?: Map<string, MockNode>
  blob?: Blob
  mimeType?: string
}

function makeFolder(name: string): MockNode {
  return {
    name,
    kind: "folder",
    modifiedAt: Date.now(),
    children: new Map(),
  }
}

function makeFile(name: string, content: string, mimeType: string): MockNode {
  const blob = new Blob([content], { type: mimeType })
  return {
    name,
    kind: "file",
    modifiedAt: Date.now(),
    blob,
    mimeType,
  }
}

const root: MockNode = makeFolder("")

function seed() {
  const documents = makeFolder("Documents")
  const photos = makeFolder("Photos")
  const code = makeFolder("Code")
  const media = makeFolder("Media")

  root.children!.set("Documents", documents)
  root.children!.set("Photos", photos)
  root.children!.set("Code", code)
  root.children!.set("Media", media)

  documents.children!.set(
    "readme.txt",
    makeFile(
      "readme.txt",
      "Welcome to your self-hosted file manager!\n\nThis is a sample text file.",
      "text/plain",
    ),
  )

  const reports = makeFolder("Reports")
  documents.children!.set("Reports", reports)
  reports.children!.set(
    "q1-summary.txt",
    makeFile(
      "q1-summary.txt",
      "Q1 SUMMARY\n==========\n\nRevenue: up 12%\nUsers: 4,532 active",
      "text/plain",
    ),
  )

  code.children!.set(
    "example.ts",
    makeFile(
      "example.ts",
      `// Sample TypeScript file
export function greet(name: string): string {
  return \`Hello, \${name}!\`
}

const numbers = [1, 2, 3, 4, 5]
const doubled = numbers.map((n) => n * 2)
console.log(doubled)
`,
      "text/typescript",
    ),
  )

  code.children!.set(
    "config.json",
    makeFile(
      "config.json",
      JSON.stringify(
        { name: "demo", version: "1.0.0", features: ["upload", "preview"] },
        null,
        2,
      ),
      "application/json",
    ),
  )

  // Tiny 1x1 transparent PNG so the image preview shows something real
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0))
  photos.children!.set("pixel.png", {
    name: "pixel.png",
    kind: "file",
    modifiedAt: Date.now(),
    blob: new Blob([pngBytes], { type: "image/png" }),
    mimeType: "image/png",
  })
}

seed()

function splitPath(path: string): string[] {
  return path.split("/").filter(Boolean)
}

function findNode(path: string): MockNode | null {
  const parts = splitPath(path)
  let cur: MockNode = root
  for (const part of parts) {
    if (cur.kind !== "folder" || !cur.children) return null
    const next = cur.children.get(part)
    if (!next) return null
    cur = next
  }
  return cur
}

function toFsEntry(node: MockNode, parentPath: string): FsEntry {
  const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name
  if (node.kind === "folder") {
    return {
      name: node.name,
      path: fullPath,
      kind: "folder",
      modifiedAt: node.modifiedAt,
    } satisfies FsFolder
  }
  return {
    name: node.name,
    path: fullPath,
    kind: "file",
    modifiedAt: node.modifiedAt,
    size: node.blob?.size ?? 0,
    mimeType: node.mimeType ?? "application/octet-stream",
  } satisfies FsFile
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listFolder(path: string): Promise<FsEntry[]> {
  await delay(120)
  const node = findNode(path)
  if (!node || node.kind !== "folder" || !node.children) {
    throw new Error(`Folder not found: ${path}`)
  }
  const entries: FsEntry[] = []
  for (const child of node.children.values()) {
    entries.push(toFsEntry(child, path))
  }
  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return entries
}

export async function getFolderTree(path: string = ""): Promise<FsFolder[]> {
  await delay(80)
  const node = findNode(path)
  if (!node || node.kind !== "folder" || !node.children) return []
  const folders: FsFolder[] = []
  for (const child of node.children.values()) {
    if (child.kind === "folder") {
      folders.push(toFsEntry(child, path) as FsFolder)
    }
  }
  folders.sort((a, b) => a.name.localeCompare(b.name))
  return folders
}

export async function downloadFile(path: string): Promise<Blob> {
  await delay(60)
  const node = findNode(path)
  if (!node || node.kind !== "file" || !node.blob) {
    throw new Error(`File not found: ${path}`)
  }
  return node.blob
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
  const node = findNode(folderPath)
  if (!node || node.kind !== "folder" || !node.children) {
    throw new Error(`Folder not found: ${folderPath}`)
  }
  const total = file.size
  const steps = 10
  for (let i = 1; i <= steps; i++) {
    await delay(40)
    onProgress?.({ loaded: Math.round((total * i) / steps), total })
  }
  const blob = new Blob([await file.arrayBuffer()], { type: file.type })
  const fileNode: MockNode = {
    name: file.name,
    kind: "file",
    modifiedAt: Date.now(),
    blob,
    mimeType: file.type || "application/octet-stream",
  }
  node.children.set(file.name, fileNode)
  return toFsEntry(fileNode, folderPath) as FsFile
}

export async function createFolder(
  parentPath: string,
  name: string,
): Promise<FsFolder> {
  await delay(80)
  const node = findNode(parentPath)
  if (!node || node.kind !== "folder" || !node.children) {
    throw new Error(`Folder not found: ${parentPath}`)
  }
  if (node.children.has(name)) {
    throw new Error(`A folder named "${name}" already exists`)
  }
  const newFolder = makeFolder(name)
  node.children.set(name, newFolder)
  return toFsEntry(newFolder, parentPath) as FsFolder
}

export async function deleteEntry(path: string): Promise<void> {
  await delay(60)
  const parts = splitPath(path)
  if (parts.length === 0) throw new Error("Cannot delete the root")
  const name = parts.pop()!
  const parent = findNode(parts.join("/"))
  if (!parent || parent.kind !== "folder" || !parent.children) {
    throw new Error(`Parent folder not found`)
  }
  if (!parent.children.delete(name)) {
    throw new Error(`Entry not found: ${path}`)
  }
}
