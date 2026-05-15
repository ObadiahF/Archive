interface MediaPreviewProps {
  url: string
  kind: "video" | "audio"
  mimeType: string
}

export function MediaPreview({ url, kind, mimeType }: MediaPreviewProps) {
  if (kind === "video") {
    return (
      <div className="flex items-center justify-center w-full bg-black rounded-md overflow-hidden">
        <video
          src={url}
          controls
          className="max-w-full max-h-[70vh]"
        >
          <source src={url} type={mimeType} />
        </video>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center w-full p-8 bg-muted/30 rounded-md">
      <audio src={url} controls className="w-full max-w-md">
        <source src={url} type={mimeType} />
      </audio>
    </div>
  )
}
