import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { renderWithProviders } from "@/test/render"
import { Breadcrumb } from "./Breadcrumb"

describe("<Breadcrumb />", () => {
  it("renders only the Archive root crumb when path is empty", () => {
    renderWithProviders(<Breadcrumb path="" />)
    expect(screen.getByRole("link", { name: "Archive" })).toHaveAttribute("href", "/files")
    expect(screen.queryByText("photos")).not.toBeInTheDocument()
  })

  it("renders one link per segment with cumulative hrefs", () => {
    renderWithProviders(<Breadcrumb path="photos/2024/raw" />)
    expect(screen.getByRole("link", { name: "Archive" })).toHaveAttribute("href", "/files")
    expect(screen.getByRole("link", { name: "photos" })).toHaveAttribute(
      "href",
      "/files/photos",
    )
    expect(screen.getByRole("link", { name: "2024" })).toHaveAttribute(
      "href",
      "/files/photos/2024",
    )
    // last segment is text, not a link
    expect(screen.queryByRole("link", { name: "raw" })).not.toBeInTheDocument()
    expect(screen.getByText("raw")).toBeInTheDocument()
  })

  it("fires onMove with the dropped path when an entry is dropped on a crumb", () => {
    const onMove = vi.fn()
    renderWithProviders(<Breadcrumb path="photos/2024" onMove={onMove} />)

    const photosLink = screen.getByRole("link", { name: "photos" })
    const dropTarget = photosLink.parentElement as HTMLElement

    const dataTransfer = {
      types: ["application/x-archive-entry"],
      getData: vi.fn(() => "photos/2024/img.jpg"),
      dropEffect: "",
    }

    const dragOverEvent = new Event("dragover", { bubbles: true, cancelable: true })
    Object.defineProperty(dragOverEvent, "dataTransfer", { value: dataTransfer })
    dropTarget.dispatchEvent(dragOverEvent)

    const dropEvent = new Event("drop", { bubbles: true, cancelable: true })
    Object.defineProperty(dropEvent, "dataTransfer", { value: dataTransfer })
    dropTarget.dispatchEvent(dropEvent)

    expect(onMove).toHaveBeenCalledWith("photos/2024/img.jpg", "photos")
  })
})
