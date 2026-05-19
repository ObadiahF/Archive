import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider } from "@/lib/theme"
import { ThemeToggle } from "./ThemeToggle"

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

describe("<ThemeToggle />", () => {
  it("renders with an aria-label that reflects the current theme", () => {
    localStorage.setItem("theme", "light")
    renderToggle()
    expect(
      screen.getByRole("button", { name: /switch to dark mode/i }),
    ).toBeInTheDocument()
  })

  it("toggles the theme on click", async () => {
    const user = userEvent.setup()
    localStorage.setItem("theme", "light")
    renderToggle()
    await user.click(screen.getByRole("button"))
    expect(
      screen.getByRole("button", { name: /switch to light mode/i }),
    ).toBeInTheDocument()
    expect(localStorage.getItem("theme")).toBe("dark")
  })
})
