import { describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { screen, waitFor } from "@testing-library/react"
import { renderWithProviders, userEvent } from "@/test/render"
import { server } from "@/test/server"
import { TEST_PASSWORD, TEST_USERNAME } from "@/test/fixtures"
import { Login } from "./Login"

const navigateSpy = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  )
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

const toastError = vi.fn()
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: vi.fn(),
  },
  Toaster: () => null,
}))

describe("<Login />", () => {
  it("submits credentials and navigates to /files on success", async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText(/operator/i), TEST_USERNAME)
    await user.type(screen.getByLabelText(/cipher/i), TEST_PASSWORD)
    await user.click(screen.getByRole("button", { name: /open the cabinet/i }))

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith("/files")
    })
    expect(localStorage.getItem("archive.token")).toBe("test.jwt.token")
  })

  it("shows an error toast on bad credentials", async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />)

    await user.type(screen.getByLabelText(/operator/i), "nope")
    await user.type(screen.getByLabelText(/cipher/i), "wrong")
    await user.click(screen.getByRole("button", { name: /open the cabinet/i }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled()
    })
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it("does not submit when fields are empty", async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />)
    await user.click(screen.getByRole("button", { name: /open the cabinet/i }))
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it("surfaces a server error message in the toast", async () => {
    const user = userEvent.setup()
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json(
          { error: "Account locked", code: "FORBIDDEN" },
          { status: 403 },
        ),
      ),
    )
    renderWithProviders(<Login />)
    await user.type(screen.getByLabelText(/operator/i), "x")
    await user.type(screen.getByLabelText(/cipher/i), "y")
    await user.click(screen.getByRole("button", { name: /open the cabinet/i }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Account locked")
    })
  })
})
