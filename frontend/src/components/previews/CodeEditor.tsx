import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import CodeMirror, { type Extension } from "@uiw/react-codemirror"
import type { EditorView } from "@codemirror/view"
import { languages } from "@codemirror/language-data"
import { oneDark } from "@codemirror/theme-one-dark"
import { useTheme } from "@/lib/theme"

interface CodeEditorProps {
  text: string
  name: string
  onChange: (next: string) => void
  readOnly?: boolean
  height?: string
}

export interface CodeEditorHandle {
  getValue: () => string
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor({ text, name, onChange, readOnly, height = "78vh" }, ref) {
    const { resolved } = useTheme()
    const [langExt, setLangExt] = useState<Extension | null>(null)
    const viewRef = useRef<EditorView | null>(null)

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => viewRef.current?.state.doc.toString() ?? text,
      }),
      [text],
    )

    useEffect(() => {
      let cancelled = false
      const desc =
        languages.find((d) => d.filename?.test(name)) ??
        languages.find((d) =>
          d.extensions.some((e) => name.toLowerCase().endsWith(`.${e}`)),
        )
      if (!desc) {
        setLangExt(null)
        return
      }
      desc.load().then((support) => {
        if (!cancelled) setLangExt(support)
      })
      return () => {
        cancelled = true
      }
    }, [name])

    const extensions = useMemo<Extension[]>(
      () => (langExt ? [langExt] : []),
      [langExt],
    )

    return (
      <div className="overflow-hidden rounded-md border border-[color:var(--rule)]/40">
        <CodeMirror
          value={text}
          height={height}
          theme={resolved === "dark" ? oneDark : "light"}
          extensions={extensions}
          readOnly={readOnly}
          onChange={onChange}
          onCreateEditor={(view) => {
            viewRef.current = view
          }}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: false,
          }}
        />
      </div>
    )
  },
)
