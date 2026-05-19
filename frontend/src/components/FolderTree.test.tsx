import { describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderWithProviders } from "@/test/render"
import { server } from "@/test/server"
import { backendFolder } from "@/test/fixtures"
import { DRAG_MIME } from "./FileList"
import { FolderTree } from "./FolderTree"

describe("<FolderTree />", () => {
  it("renders the Archive root link", () => {
    server.use(
      http.get("/api/list", () =>
        HttpResponse.json({ path: "/", parent: null, entries: [] }),
      ),
    )
    renderWithProviders(<FolderTree currentPath="" refreshKey={0} />)
    expect(screen.getByRole("link", { name: /the archive/i })).toBeInTheDocument()
  })

  it("loads and renders the top-level folders from the backend", async () => {
    server.use(
      http.get("/api/list", () =>
        HttpResponse.json({
          path: "/",
          parent: null,
          entries: [
            backendFolder({ name: "photos", path: "/photos" }),
            backendFolder({ name: "notes", path: "/notes" }),
          ],
        }),
      ),
    )
    renderWithProviders(<FolderTree currentPath="" refreshKey={0} />)
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /photos/i })).toBeInTheDocument()
      expect(screen.getByRole("link", { name: /notes/i })).toBeInTheDocument()
    })
  })

  it("expands a folder when the chevron is clicked", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("/api/list", ({ request }) => {
        const url = new URL(request.url)
        const path = url.searchParams.get("path") ?? "/"
        if (path === "/") {
          return HttpResponse.json({
            path: "/",
            parent: null,
            entries: [backendFolder({ name: "photos", path: "/photos" })],
          })
        }
        return HttpResponse.json({
          path,
          parent: "/",
          entries: [backendFolder({ name: "2024", path: "/photos/2024" })],
        })
      }),
    )
    renderWithProviders(<FolderTree currentPath="" refreshKey={0} />)
    await screen.findByRole("link", { name: /photos/i })
    await user.click(screen.getAllByRole("button", { name: /expand/i })[0])
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /2024/i })).toBeInTheDocument()
    })
  })

  it("calls onMove when a draggable is dropped on a folder node", async () => {
    server.use(
      http.get("/api/list", () =>
        HttpResponse.json({
          path: "/",
          parent: null,
          entries: [backendFolder({ name: "photos", path: "/photos" })],
        }),
      ),
    )
    const onMove = vi.fn()
    renderWithProviders(
      <FolderTree currentPath="" refreshKey={0} onMove={onMove} />,
    )
    const folderLink = await screen.findByRole("link", { name: /photos/i })
    const row = folderLink.parentElement as HTMLElement
    const dataTransfer = {
      types: [DRAG_MIME],
      getData: () => "loose.txt",
      dropEffect: "",
    }
    const dragOver = new Event("dragover", { bubbles: true, cancelable: true })
    Object.defineProperty(dragOver, "dataTransfer", { value: dataTransfer })
    row.dispatchEvent(dragOver)
    const drop = new Event("drop", { bubbles: true, cancelable: true })
    Object.defineProperty(drop, "dataTransfer", { value: dataTransfer })
    row.dispatchEvent(drop)
    expect(onMove).toHaveBeenCalledWith("loose.txt", "photos")
  })
})
