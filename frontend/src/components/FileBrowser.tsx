import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { FolderPlus, LogOut, Upload } from "lucide-react"
import { toast } from "sonner"
import {
  createFolder,
  deleteEntry,
  downloadFile,
  listFolder,
  logout,
  moveEntry,
  uploadFile,
} from "@/api/api"
import { getToken } from "@/api/auth"
import type { FsEntry, FsFile } from "@/api/types"
import { Breadcrumb } from "@/components/Breadcrumb"
import { FolderTree } from "@/components/FolderTree"
import { FileList } from "@/components/FileList"
import { PreviewDialog } from "@/components/PreviewDialog"
import { ThemeToggle } from "@/components/ThemeToggle"
import { UploadDropzone } from "@/components/UploadDropzone"
import { UploadList, type UploadTask } from "@/components/UploadList"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

function pathFromLocation(pathname: string): string {
  const prefix = "/files"
  if (!pathname.startsWith(prefix)) return ""
  return pathname.slice(prefix.length).replace(/^\/+/, "").replace(/\/+$/, "")
}

export function FileBrowser() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = pathFromLocation(location.pathname)

  useEffect(() => {
    if (!getToken()) navigate("/login", { replace: true })
  }, [navigate])

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  const [entries, setEntries] = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [previewFile, setPreviewFile] = useState<FsFile | null>(null)
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [renameTarget, setRenameTarget] = useState<FsEntry | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [treeRefreshKey, setTreeRefreshKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dragCounter = useRef(0)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listFolder(currentPath)
      setEntries(list)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load folder")
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [currentPath])

  useEffect(() => {
    refresh()
  }, [refresh])

  const refreshTree = () => setTreeRefreshKey((k) => k + 1)

  const handleDownload = useCallback(async (file: FsFile) => {
    try {
      const blob = await downloadFile(file.path)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed")
    }
  }, [])

  const handleMove = useCallback(
    async (fromPath: string, toFolderPath: string) => {
      const name = fromPath.split("/").filter(Boolean).pop()
      if (!name) return
      const srcParent = fromPath.split("/").slice(0, -1).join("/")
      const dest = toFolderPath ? `${toFolderPath}/${name}` : name
      if (srcParent === toFolderPath) return
      if (dest === fromPath) return
      if (toFolderPath === fromPath || toFolderPath.startsWith(fromPath + "/")) {
        toast.error("Can't move a folder into itself")
        return
      }
      try {
        await moveEntry(fromPath, dest)
        toast.success(`Moved ${name}`)
        refresh()
        refreshTree()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Move failed")
      }
    },
    [refresh],
  )

  const handleDelete = useCallback(
    async (entry: FsEntry) => {
      if (!confirm(`Delete "${entry.name}"? This can't be undone.`)) return
      try {
        await deleteEntry(entry.path)
        toast.success(`Deleted ${entry.name}`)
        refresh()
        refreshTree()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed")
      }
    },
    [refresh],
  )

  const openRename = useCallback((entry: FsEntry) => {
    setRenameTarget(entry)
    setRenameValue(entry.name)
  }, [])

  const handleRename = useCallback(async () => {
    if (!renameTarget) return
    const next = renameValue.trim()
    if (!next || next === renameTarget.name) {
      setRenameTarget(null)
      return
    }
    if (next.includes("/") || next.includes("\\")) {
      toast.error("Name can't contain slashes")
      return
    }
    const parent = renameTarget.path.split("/").slice(0, -1).join("/")
    const dest = parent ? `${parent}/${next}` : next
    try {
      await moveEntry(renameTarget.path, dest)
      toast.success(`Renamed to ${next}`)
      setRenameTarget(null)
      refresh()
      refreshTree()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rename failed")
    }
  }, [refresh, renameTarget, renameValue])

  const startUpload = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files)
      for (const file of arr) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        setUploadTasks((prev) => [
          ...prev,
          { id, name: file.name, progress: 0, status: "uploading" },
        ])
        try {
          await uploadFile(currentPath, file, ({ loaded, total }) => {
            const pct = total > 0 ? (loaded / total) * 100 : 0
            setUploadTasks((prev) =>
              prev.map((t) => (t.id === id ? { ...t, progress: pct } : t)),
            )
          })
          setUploadTasks((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, progress: 100, status: "done" } : t,
            ),
          )
          toast.success(`Uploaded ${file.name}`)
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed"
          setUploadTasks((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, status: "error", error: msg } : t,
            ),
          )
          toast.error(`Upload failed: ${file.name}`)
        }
      }
      refresh()
    },
    [currentPath, refresh],
  )

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) startUpload(files)
    e.target.value = ""
  }

  const onDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return
    e.preventDefault()
    dragCounter.current += 1
    setDragOver(true)
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDragOver(false)
    }
  }
  const onDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) e.preventDefault()
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) startUpload(e.dataTransfer.files)
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    try {
      await createFolder(currentPath, name)
      setNewFolderOpen(false)
      setNewFolderName("")
      toast.success(`Created folder ${name}`)
      refresh()
      refreshTree()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create folder")
    }
  }

  const dismissUpload = (id: string) =>
    setUploadTasks((prev) => prev.filter((t) => t.id !== id))

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="double-rule flex items-center justify-between px-6 py-4 shrink-0 relative">
        <div className="flex items-end gap-4">
          <div className="flex items-baseline gap-3">
            <span className="wordmark text-3xl text-foreground select-none">
              Archive<span className="text-[color:var(--ochre)]">.</span>
            </span>
            <span className="smallcaps text-[0.68rem] text-muted-foreground hidden sm:inline">
              the file cabinet
            </span>
          </div>
          <span className="stamp text-[color:var(--ochre)] hidden md:inline-flex -translate-y-1 -rotate-2">
            Vol. I · Folio {(currentPath.split("/").filter(Boolean).length + 1).toString().padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewFolderOpen(true)}
            className="smallcaps font-medium border-[color:var(--rule)]/40"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New folder
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="smallcaps font-medium"
          >
            <Upload className="h-4 w-4 mr-2" />
            Deposit
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilePick}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="smallcaps font-medium border-[color:var(--rule)]/40"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-72 shrink-0 border-r border-[color:var(--rule)]/30 overflow-y-auto px-3 py-4 bg-[color:var(--sidebar)]">
          <div className="smallcaps text-[0.65rem] text-muted-foreground mb-2 px-1 flex items-center justify-between">
            <span>Index</span>
            <span className="font-mono not-[.smallcaps]:normal-case opacity-60">⁂</span>
          </div>
          <FolderTree
            currentPath={currentPath}
            refreshKey={treeRefreshKey}
            onMove={handleMove}
          />
        </aside>

        <main
          className="flex-1 min-w-0 relative"
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div className="px-6 py-3 border-b border-[color:var(--rule)]/40 flex items-center justify-between">
            <Breadcrumb path={currentPath} onMove={handleMove} />
            <span className="smallcaps text-[0.65rem] text-muted-foreground tabular hidden md:inline">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <div className="overflow-y-auto h-[calc(100%-49px)]">
            {loading ? (
              <div className="flex items-center justify-center py-24 font-serif italic text-muted-foreground">
                <span className="animate-pulse">filing…</span>
              </div>
            ) : (
              <FileList
                entries={entries}
                onPreview={setPreviewFile}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onRename={openRename}
                onMove={handleMove}
              />
            )}
          </div>
          <UploadDropzone visible={dragOver} />
          <UploadList tasks={uploadTasks} onDismiss={dismissUpload} />
        </main>
      </div>

      <PreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        onDownload={handleDownload}
      />

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
              Re-letter the {renameTarget?.kind === "folder" ? "folio" : "paper"}
            </DialogTitle>
            <DialogDescription className="font-serif italic">
              Currently filed as{" "}
              <span className="font-mono not-italic text-foreground/80">
                {renameTarget?.name}
              </span>
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="New title…"
            autoFocus
            className="font-mono"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename()
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)} className="smallcaps">
              Dismiss
            </Button>
            <Button onClick={handleRename} className="smallcaps">
              Re-file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
              Open a new folio
            </DialogTitle>
            <DialogDescription className="font-serif italic">
              Filed inside{" "}
              <span className="font-mono not-italic text-foreground/80">
                {currentPath ? `/${currentPath}` : "/"}
              </span>
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Title this folder…"
            autoFocus
            className="font-mono"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder()
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)} className="smallcaps">
              Dismiss
            </Button>
            <Button onClick={handleCreateFolder} className="smallcaps">
              File it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
