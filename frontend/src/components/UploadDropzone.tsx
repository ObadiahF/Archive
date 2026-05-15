import { Upload } from "lucide-react"

interface UploadDropzoneProps {
  visible: boolean
}

export function UploadDropzone({ visible }: UploadDropzoneProps) {
  if (!visible) return null
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary px-12 py-8 bg-background shadow-lg">
        <Upload className="h-10 w-10 text-primary" />
        <p className="text-lg font-medium">Drop files to upload</p>
        <p className="text-sm text-muted-foreground">
          Files will be uploaded to the current folder
        </p>
      </div>
    </div>
  )
}
