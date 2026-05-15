import { useEffect, useState } from "react"
import { codeToHtml } from "shiki"
import { getShikiLang } from "@/lib/fileTypes"
import { useTheme } from "@/lib/theme"

interface CodePreviewProps {
  text: string
  name: string
}

export function CodePreview({ text, name }: CodePreviewProps) {
  const { resolved } = useTheme()
  const [html, setHtml] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const lang = getShikiLang(name)
    codeToHtml(text, {
      lang,
      theme: resolved === "dark" ? "github-dark" : "github-light",
    })
      .then((result) => {
        if (!cancelled) setHtml(result)
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })
    return () => {
      cancelled = true
    }
  }, [text, name, resolved])

  if (error) {
    return (
      <pre className="text-sm p-4 overflow-auto max-h-[70vh] bg-muted/30 rounded-md">
        {text}
      </pre>
    )
  }

  return (
    <div
      className="text-sm overflow-auto max-h-[70vh] rounded-md border [&_pre]:p-4 [&_pre]:m-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
