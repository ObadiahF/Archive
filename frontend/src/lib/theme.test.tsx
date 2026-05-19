import { describe, expect, it, vi } from "vitest"
import { act } from "react"
import { render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider, useTheme } from "./theme"

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe("ThemeProvider / useTheme()", () => {
  it("defaults to 'system' when nothing is stored", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("system")
    expect(["light", "dark"]).toContain(result.current.resolved)
  })

  it("reads the stored theme on initial mount", () => {
    localStorage.setItem("theme", "dark")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("dark")
    expect(result.current.resolved).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("setTheme(light) writes to localStorage and updates resolved", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setTheme("light"))
    expect(result.current.theme).toBe("light")
    expect(result.current.resolved).toBe("light")
    expect(localStorage.getItem("theme")).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("setTheme('system') removes the stored value", () => {
    localStorage.setItem("theme", "dark")
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setTheme("system"))
    expect(localStorage.getItem("theme")).toBeNull()
  })

  it("useTheme outside provider throws a descriptive error", () => {
    const original = console.error
    console.error = vi.fn()
    try {
      expect(() => renderHook(() => useTheme())).toThrow(
        /useTheme must be used inside ThemeProvider/,
      )
    } finally {
      console.error = original
    }
  })

  it("renders children inside the provider", async () => {
    const user = userEvent.setup()
    function Probe() {
      const { resolved, setTheme } = useTheme()
      return (
        <button onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}>
          {resolved}
        </button>
      )
    }
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    const btn = screen.getByRole("button")
    const initial = btn.textContent
    await user.click(btn)
    expect(btn.textContent).not.toBe(initial)
  })
})
