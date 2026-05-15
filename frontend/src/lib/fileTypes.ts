export type PreviewKind = "image" | "pdf" | "code" | "video" | "audio" | null

const codeExtensions = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs",
  "json", "yaml", "yml", "toml", "xml", "html", "css", "scss",
  "md", "markdown", "txt", "log", "sh", "bash", "zsh", "ps1",
  "py", "rb", "go", "rs", "java", "c", "h", "cpp", "hpp", "cs",
  "sql", "env",
])

const imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp"])

export function getExtension(name: string): string {
  const i = name.lastIndexOf(".")
  if (i < 0) return ""
  return name.slice(i + 1).toLowerCase()
}

export function getPreviewKind(name: string, mimeType?: string): PreviewKind {
  const ext = getExtension(name)
  if (mimeType?.startsWith("image/") || imageExtensions.has(ext)) return "image"
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf"
  if (mimeType?.startsWith("video/")) return "video"
  if (mimeType?.startsWith("audio/")) return "audio"
  if (mimeType?.startsWith("text/") || codeExtensions.has(ext)) return "code"
  return null
}

export function getShikiLang(name: string): string {
  const ext = getExtension(name)
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    mjs: "javascript",
    cjs: "javascript",
    json: "json",
    md: "markdown",
    markdown: "markdown",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    ps1: "powershell",
    yml: "yaml",
    yaml: "yaml",
    html: "html",
    css: "css",
    scss: "scss",
    sql: "sql",
    xml: "xml",
    toml: "toml",
  }
  return map[ext] ?? "text"
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
