import { describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { server } from "@/test/server"
import { makeFile } from "@/test/fixtures"
import { PreviewDialog } from "./PreviewDialog"

// Stub the heavy code editor / shiki-based previews so this file does not
// have to load codemirror / shiki. They are covered by E2E.
vi.mock("@/components/previews/CodePreview", () => ({
  CodePreview: ({ text }: { text: string }) => (
    <pre data-testid="code-preview">{text}</pre>
  ),
}))
vi.mock("@/components/previews/CodeEditor", () => ({
  CodeEditor: ({ text }: { text: string }) => (
    <textarea data-testid="code-editor" defaultValue={text} />
  ),
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}))

describe("<PreviewDialog />", () => {
  it("renders nothing visible when file is null", () => {
    render(
      <PreviewDialog
        file={null}
        onOpenChange={() => {}}
        onDownload={() => {}}
      />,
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders an unknown-type message for unsupported files", async () => {
    const file = makeFile({
      name: "blob.bin",
      path: "blob.bin",
      mimeType: "application/octet-stream",
    })
    server.use(
      http.get("/api/file", () =>
        HttpResponse.text("ignored", { status: 200 }),
      ),
    )
    render(<PreviewDialog file={file} onOpenChange={() => {}} onDownload={() => {}} />)
    await waitFor(() => {
      expect(screen.getByText(/no preview available/i)).toBeInTheDocument()
    })
  })

  it("renders the code preview for text files", async () => {
    const file = makeFile({ name: "note.md", path: "note.md", mimeType: "text/markdown" })
    server.use(
      http.get("/api/file", () =>
        HttpResponse.text("# hello", { status: 200 }),
      ),
    )
    render(<PreviewDialog file={file} onOpenChange={() => {}} onDownload={() => {}} />)
    await waitFor(() => {
      expect(screen.getByTestId("code-preview")).toBeInTheDocument()
    })
    expect(screen.getByTestId("code-preview")).toHaveTextContent("# hello")
  })

  it("enters edit mode when startInEdit + a code file", async () => {
    const file = makeFile({ name: "note.md", path: "note.md", mimeType: "text/markdown" })
    server.use(
      http.get("/api/file", () => HttpResponse.text("body", { status: 200 })),
    )
    render(
      <PreviewDialog
        file={file}
        onOpenChange={() => {}}
        onDownload={() => {}}
        startInEdit
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId("code-editor")).toBeInTheDocument()
    })
  })

  it("renders ImagePreview for an image file", async () => {
    const file = makeFile({ name: "x.png", path: "x.png", mimeType: "image/png" })
    server.use(
      http.get("/api/file", () => HttpResponse.text("png-bytes", { status: 200 })),
    )
    render(<PreviewDialog file={file} onOpenChange={() => {}} onDownload={() => {}} />)
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "x.png" })).toBeInTheDocument()
    })
  })

  it("Download button calls onDownload with the file", async () => {
    const file = makeFile({ name: "x.png", path: "x.png", mimeType: "image/png" })
    server.use(
      http.get("/api/file", () => HttpResponse.text("png", { status: 200 })),
    )
    const onDownload = vi.fn()
    render(<PreviewDialog file={file} onOpenChange={() => {}} onDownload={onDownload} />)
    await waitFor(() => screen.getByRole("img", { name: "x.png" }))
    await userEvent.setup().click(screen.getByRole("button", { name: /download/i }))
    expect(onDownload).toHaveBeenCalledWith(file)
  })

  it("shows an error message when the file fails to load", async () => {
    const file = makeFile({ name: "x.png", path: "x.png", mimeType: "image/png" })
    server.use(
      http.get("/api/file", () =>
        HttpResponse.json({ error: "boom", code: "INTERNAL" }, { status: 500 }),
      ),
    )
    render(<PreviewDialog file={file} onOpenChange={() => {}} onDownload={() => {}} />)
    await waitFor(() => {
      expect(screen.getByText("boom")).toBeInTheDocument()
    })
  })
})
