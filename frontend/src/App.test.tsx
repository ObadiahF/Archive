import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import App from "./App"

vi.mock("@/components/FileBrowser", () => ({
  FileBrowser: () => <div data-testid="file-browser">browser</div>,
}))

vi.mock("@/components/Login", () => ({
  Login: () => <div data-testid="login">login</div>,
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe("<App />", () => {
  it("redirects '/' to /files (file browser)", async () => {
    renderAt("/")
    await waitFor(() => {
      expect(screen.getByTestId("file-browser")).toBeInTheDocument()
    })
  })

  it("renders the login page at /login", () => {
    renderAt("/login")
    expect(screen.getByTestId("login")).toBeInTheDocument()
  })

  it("renders the file browser at /files", () => {
    renderAt("/files")
    expect(screen.getByTestId("file-browser")).toBeInTheDocument()
  })

  it("falls back to /files for unknown routes", async () => {
    renderAt("/totally-unknown")
    await waitFor(() => {
      expect(screen.getByTestId("file-browser")).toBeInTheDocument()
    })
  })
})
