import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { downloadFile, getFileText } from "@/api/api"
import type { FsFile } from "@/api/types"
import { formatBytes, getPreviewKind } from "@/lib/fileTypes"
import { ImagePreview } from "@/components/previews/ImagePreview"
import { PdfPreview } from "@/components/previews/PdfPreview"
import { CodePreview } from "@/components/previews/CodePreview"
import { MediaPreview } from "@/components/previews/MediaPreview"

interface PreviewDialogProps {
  file: FsFile | null
  onOpenChange: (open: boolean) => void
  onDownload: (file: FsFile) => void
}

export function PreviewDialog({ file, onOpenChange, onDownload }: PreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const kind = file ? getPreviewKind(file.name, file.mimeType) : null

  useEffect(() => {
    if (!file) {
      setUrl(null)
      setText(null)
      setError(null)
      return
    }
    let cancelled = false
    let createdUrl: string | null = null
    setLoading(true)
    setError(null)
    setText(null)
    setUrl(null)

    const load = async () => {
      try {
        if (kind === "code") {
          const t = await getFileText(file.path)
          if (!cancelled) setText(t)
        } else if (kind) {
          const blob = await downloadFile(file.path)
          createdUrl = URL.createObjectURL(blob)
          if (!cancelled) setUrl(createdUrl)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [file, kind])

  const renderContent = () => {
    if (!file) return null
    if (loading) {
      return (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Loading preview…
        </div>
      )
    }
    if (error) {
      return (
        <div className="flex items-center justify-center py-24 text-sm text-destructive">
          {error}
        </div>
      )
    }
    if (!kind) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <p className="text-sm">No preview available for this file type.</p>
          <p className="text-xs mt-1">{file.mimeType || "unknown type"}</p>
        </div>
      )
    }
    if (kind === "code" && text !== null) {
      return <CodePreview text={text} name={file.name} />
    }
    if (kind === "image" && url) {
      return <ImagePreview url={url} name={file.name} />
    }
    if (kind === "pdf" && url) {
      return <PdfPreview url={url} name={file.name} />
    }
    if ((kind === "video" || kind === "audio") && url) {
      return <MediaPreview url={url} kind={kind} mimeType={file.mimeType} />
    }
    return null
  }

  return (
    <Dialog open={!!file} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl gap-4">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <DialogTitle className="truncate">{file?.name}</DialogTitle>
              <DialogDescription className="text-xs">
                {file && `${formatBytes(file.size)} · ${file.mimeType || "unknown"}`}
              </DialogDescription>
            </div>
            {file && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload(file)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="min-h-[200px]">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}
