import { useNavigate } from "react-router-dom"
import {
  File as FileIcon,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  Folder,
  Download,
  Trash2,
  MoreVertical,
} from "lucide-react"
import type { FsEntry, FsFile } from "@/api/types"
import { formatBytes, formatDate, getExtension, getPreviewKind } from "@/lib/fileTypes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function getFileIcon(file: FsFile) {
  const kind = getPreviewKind(file.name, file.mimeType)
  const ext = getExtension(file.name)
  if (kind === "image") return <FileImage className="h-4 w-4 text-emerald-500" />
  if (kind === "pdf") return <FileText className="h-4 w-4 text-red-500" />
  if (kind === "code") return <FileCode className="h-4 w-4 text-purple-500" />
  if (kind === "video") return <FileVideo className="h-4 w-4 text-orange-500" />
  if (kind === "audio") return <FileAudio className="h-4 w-4 text-pink-500" />
  if (ext) return <FileText className="h-4 w-4 text-muted-foreground" />
  return <FileIcon className="h-4 w-4 text-muted-foreground" />
}

interface FileListProps {
  entries: FsEntry[]
  onPreview: (file: FsFile) => void
  onDownload: (file: FsFile) => void
  onDelete: (entry: FsEntry) => void
}

export function FileList({ entries, onPreview, onDownload, onDelete }: FileListProps) {
  const navigate = useNavigate()

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
        <Folder className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">This folder is empty</p>
        <p className="text-xs mt-1">Drag files here or use the Upload button</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-[1fr_120px_180px_auto] gap-4 px-4 py-2 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <div>Name</div>
        <div>Size</div>
        <div>Modified</div>
        <div className="w-10"></div>
      </div>
      <div className="divide-y">
        {entries.map((entry) => {
          const isFolder = entry.kind === "folder"
          return (
            <div
              key={entry.path}
              onDoubleClick={() => {
                if (isFolder) navigate(`/files/${entry.path}`)
                else onPreview(entry as FsFile)
              }}
              className="grid grid-cols-[1fr_120px_180px_auto] gap-4 px-4 py-2 items-center hover:bg-accent/50 transition-colors cursor-pointer group"
            >
              <button
                type="button"
                onClick={() => {
                  if (isFolder) navigate(`/files/${entry.path}`)
                  else onPreview(entry as FsFile)
                }}
                className="flex items-center gap-3 min-w-0 text-left"
              >
                {isFolder ? (
                  <Folder className="h-4 w-4 shrink-0 text-blue-500" />
                ) : (
                  getFileIcon(entry as FsFile)
                )}
                <span className="truncate text-sm">{entry.name}</span>
              </button>
              <div className="text-sm text-muted-foreground">
                {isFolder ? "—" : formatBytes((entry as FsFile).size)}
              </div>
              <div className="text-sm text-muted-foreground">
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
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownload(entry as FsFile)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(entry)}
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
