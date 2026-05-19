import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { renderWithProviders, userEvent } from "@/test/render"
import { makeFile, makeFolder } from "@/test/fixtures"
import { DRAG_MIME, FileList } from "./FileList"
import type { FsEntry } from "@/api/types"

function defaultProps(entries: FsEntry[]) {
  return {
    entries,
    onPreview: vi.fn(),
    onDownload: vi.fn(),
    onDelete: vi.fn(),
    onRename: vi.fn(),
    onMove: vi.fn(),
    onNewFile: vi.fn(),
    onNewFolder: vi.fn(),
    onUpload: vi.fn(),
  }
}

describe("<FileList />", () => {
  it("renders the empty state when there are no entries", () => {
    renderWithProviders(<FileList {...defaultProps([])} />)
    expect(screen.getByText(/empty folio/i)).toBeInTheDocument()
  })

  it("renders one row per entry with name + bytes", () => {
    const entries = [
      makeFolder({ name: "photos", path: "photos" }),
      makeFile({ name: "readme.md", path: "readme.md", size: 1024 }),
    ]
    renderWithProviders(<FileList {...defaultProps(entries)} />)
    expect(screen.getByText("photos")).toBeInTheDocument()
    expect(screen.getByText("readme.md")).toBeInTheDocument()
    expect(screen.getByText("1.0 KB")).toBeInTheDocument()
  })

  it("clicking a file's name invokes onPreview", async () => {
    const user = userEvent.setup()
    const props = defaultProps([makeFile({ name: "note.md", path: "note.md" })])
    renderWithProviders(<FileList {...props} />)
    await user.click(screen.getByText("note.md"))
    expect(props.onPreview).toHaveBeenCalledTimes(1)
    expect(props.onPreview).toHaveBeenCalledWith(
      expect.objectContaining({ name: "note.md", kind: "file" }),
    )
  })

  it("sets the drag MIME type when dragging an entry", () => {
    const props = defaultProps([makeFile({ name: "x.txt", path: "x.txt" })])
    renderWithProviders(<FileList {...props} />)
    const row = screen.getByText("x.txt").closest("[draggable='true']") as HTMLElement
    expect(row).not.toBeNull()

    const setData = vi.fn()
    const dataTransfer = { setData, effectAllowed: "" }
    const evt = new Event("dragstart", { bubbles: true, cancelable: true })
    Object.defineProperty(evt, "dataTransfer", { value: dataTransfer })
    row.dispatchEvent(evt)
    expect(setData).toHaveBeenCalledWith(DRAG_MIME, "x.txt")
  })

  it("calls onMove when a draggable is dropped on a folder row", () => {
    const props = defaultProps([
      makeFolder({ name: "dest", path: "dest" }),
      makeFile({ name: "x.txt", path: "x.txt" }),
    ])
    renderWithProviders(<FileList {...props} />)
    const folderRow = screen.getByText("dest").closest("[draggable='true']") as HTMLElement
    expect(folderRow).not.toBeNull()

    const dataTransfer = {
      types: [DRAG_MIME],
      getData: () => "x.txt",
      dropEffect: "",
    }

    const dragOver = new Event("dragover", { bubbles: true, cancelable: true })
    Object.defineProperty(dragOver, "dataTransfer", { value: dataTransfer })
    folderRow.dispatchEvent(dragOver)

    const drop = new Event("drop", { bubbles: true, cancelable: true })
    Object.defineProperty(drop, "dataTransfer", { value: dataTransfer })
    folderRow.dispatchEvent(drop)

    expect(props.onMove).toHaveBeenCalledWith("x.txt", "dest")
  })
})
