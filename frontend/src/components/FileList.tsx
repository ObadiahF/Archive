import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  File as FileIcon,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  Download,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react"
import type { FsEntry, FsFile } from "@/api/types"
import { formatBytes, formatDate, getExtension, getPreviewKind } from "@/lib/fileTypes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const DRAG_MIME = "application/x-archive-entry"

function getFileIcon(file: FsFile) {
  const kind = getPreviewKind(file.name, file.mimeType)
  const ext = getExtension(file.name)
  if (kind === "image")
    return <FileImage className="h-4 w-4 text-[color:var(--teal-faded)]" />
  if (kind === "pdf")
    return <FileText className="h-4 w-4 text-[color:var(--oxblood)]" />
  if (kind === "code")
    return <FileCode className="h-4 w-4 text-[color:var(--aubergine)]" />
  if (kind === "video")
    return <FileVideo className="h-4 w-4 text-[color:var(--rust)]" />
  if (kind === "audio")
    return <FileAudio className="h-4 w-4 text-[color:var(--rose-dust)]" />
  if (ext) return <FileText className="h-4 w-4 text-muted-foreground" />
  return <FileIcon className="h-4 w-4 text-muted-foreground" />
}

interface FileListProps {
  entries: FsEntry[]
  onPreview: (file: FsFile) => void
  onDownload: (file: FsFile) => void
  onDelete: (entry: FsEntry) => void
  onRename: (entry: FsEntry) => void
  onMove?: (fromPath: string, toFolderPath: string) => void
}

export function FileList({ entries, onPreview, onDownload, onDelete, onRename, onMove }: FileListProps) {
  const navigate = useNavigate()
  const [dragOverPath, setDragOverPath] = useState<string | null>(null)

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="font-serif italic text-2xl text-muted-foreground mb-2"
          style={{ fontVariationSettings: '"opsz" 96, "SOFT" 100' }}
        >
          An empty folio.
        </div>
        <p className="font-mono text-xs text-muted-foreground/70 tracking-wider">
          ⁂ ⁂ ⁂
        </p>
        <p className="mt-6 font-serif text-sm text-muted-foreground">
          Drag papers in, or <span className="smallcaps text-foreground/80">deposit</span> them from above.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-[1fr_120px_180px_44px] gap-6 px-6 py-2.5 border-b border-[color:var(--rule)]/40 smallcaps text-[0.62rem] text-muted-foreground tracking-[0.18em]">
        <div>Title</div>
        <div className="text-right">Bytes</div>
        <div>Filed</div>
        <div className="text-right"></div>
      </div>
      <div>
        {entries.map((entry, idx) => {
          const isFolder = entry.kind === "folder"
          const isDragTarget = isFolder && dragOverPath === entry.path
          return (
            <ContextMenu key={entry.path}>
              <ContextMenuTrigger asChild>
                <div
                  draggable={!!onMove}
                  onDragStart={(e) => {
                    if (!onMove) return
                    e.dataTransfer.setData(DRAG_MIME, entry.path)
                    e.dataTransfer.setData("text/plain", entry.name)
                    e.dataTransfer.effectAllowed = "move"
                  }}
                  onDragOver={(e) => {
                    if (!isFolder || !onMove) return
                    if (!e.dataTransfer.types.includes(DRAG_MIME)) return
                    e.preventDefault()
                    e.stopPropagation()
                    e.dataTransfer.dropEffect = "move"
                  }}
                  onDragEnter={(e) => {
                    if (!isFolder || !onMove) return
                    if (!e.dataTransfer.types.includes(DRAG_MIME)) return
                    setDragOverPath(entry.path)
                  }}
                  onDragLeave={() => {
                    if (isFolder) setDragOverPath((p) => (p === entry.path ? null : p))
                  }}
                  onDrop={(e) => {
                    if (!isFolder || !onMove) return
                    const from = e.dataTransfer.getData(DRAG_MIME)
                    if (!from) return
                    e.preventDefault()
                    e.stopPropagation()
                    setDragOverPath(null)
                    onMove(from, entry.path)
                  }}
                  onDoubleClick={() => {
                    if (isFolder) navigate(`/files/${entry.path}`)
                    else onPreview(entry as FsFile)
                  }}
                  className={cn(
                    "ink-rise group grid grid-cols-[1fr_120px_180px_44px] gap-6 px-6 py-2.5 items-center cursor-pointer border-b border-dashed border-[color:var(--border)]/60 hover:bg-[color:var(--accent)]/55 transition-colors",
                    isDragTarget &&
                      "bg-[color:var(--accent)] outline outline-2 outline-[color:var(--ochre)] outline-offset-[-2px]",
                  )}
                  style={{ animationDelay: `${Math.min(idx, 12) * 22}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isFolder) navigate(`/files/${entry.path}`)
                      else onPreview(entry as FsFile)
                    }}
                    className="flex items-baseline gap-3 min-w-0 text-left"
                  >
                    <span className="self-center inline-flex h-4 w-4 items-center justify-center shrink-0">
                      {isFolder ? (
                        <span className="folder-tab" aria-hidden />
                      ) : (
                        getFileIcon(entry as FsFile)
                      )}
                    </span>
                    <span
                      className={
                        isFolder
                          ? "truncate font-serif text-[15px] tracking-tight group-hover:text-[color:var(--ochre)] transition-colors"
                          : "truncate font-serif text-[15px] tracking-tight"
                      }
                      style={{ fontVariationSettings: '"opsz" 36, "SOFT" 100' }}
                    >
                      {entry.name}
                    </span>
                    <span className="leader" aria-hidden />
                  </button>
                  <div className="text-right tabular font-mono text-xs text-muted-foreground">
                    {isFolder ? "—" : formatBytes((entry as FsFile).size)}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground tabular">
                    {formatDate(entry.modifiedAt)}
                  </div>
                  <div className="flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!isFolder && (
                          <>
                            <DropdownMenuItem onClick={() => onPreview(entry as FsFile)}>
                              Examine
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDownload(entry as FsFile)}>
                              <Download className="h-4 w-4 mr-2" />
                              Withdraw
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => onRename(entry)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(entry)}
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Incinerate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                {!isFolder && (
                  <>
                    <ContextMenuItem onClick={() => onPreview(entry as FsFile)}>
                      Examine
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onDownload(entry as FsFile)}>
                      <Download className="h-4 w-4 mr-2" />
                      Withdraw
                    </ContextMenuItem>
                  </>
                )}
                <ContextMenuItem onClick={() => onRename(entry)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => onDelete(entry)}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Incinerate
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </div>
    </div>
  )
}
