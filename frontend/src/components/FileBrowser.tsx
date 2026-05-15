import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { FolderPlus, Upload } from "lucide-react"
import { toast } from "sonner"
import {
  createFolder,
  deleteEntry,
  downloadFile,
  listFolder,
  uploadFile,
} from "@/api/mockApi"
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
  const currentPath = pathFromLocation(location.pathname)

  const [entries, setEntries] = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [previewFile, setPreviewFile] = useState<FsFile | null>(null)
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
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
      <header className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold tracking-tight">File Manager</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewFolderOpen(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilePick}
          />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-64 shrink-0 border-r overflow-y-auto p-2">
          <FolderTree currentPath={currentPath} refreshKey={treeRefreshKey} />
        </aside>

        <main
          className="flex-1 min-w-0 relative"
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div className="px-4 py-3 border-b">
            <Breadcrumb path={currentPath} />
          </div>
          <div className="overflow-y-auto h-[calc(100%-49px)]">
            {loading ? (
              <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
                Loading…
              </div>
            ) : (
              <FileList
                entries={entries}
                onPreview={setPreviewFile}
                onDownload={handleDownload}
                onDelete={handleDelete}
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

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Create a new folder in {currentPath ? `/${currentPath}` : "the root folder"}.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder()
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
