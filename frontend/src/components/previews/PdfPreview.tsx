interface PdfPreviewProps {
  url: string
  name: string
}

export function PdfPreview({ url, name }: PdfPreviewProps) {
  return (
    <iframe
      src={url}
      title={name}
      className="w-full h-[70vh] rounded-md border bg-background"
    />
  )
}
