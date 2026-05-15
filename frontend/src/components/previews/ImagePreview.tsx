interface ImagePreviewProps {
  url: string
  name: string
}

export function ImagePreview({ url, name }: ImagePreviewProps) {
  return (
    <div className="flex items-center justify-center w-full h-full overflow-auto bg-muted/30 rounded-md p-4">
      <img
        src={url}
        alt={name}
        className="max-w-full max-h-[70vh] object-contain"
      />
    </div>
  )
}
