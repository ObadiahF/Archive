import { describe, expect, it } from "vitest"

describe("smoke", () => {
  it("vitest is configured", () => {
    expect(1 + 1).toBe(2)
  })

  it("jsdom environment is active", () => {
    document.body.innerHTML = `<div id="x">hi</div>`
    expect(document.getElementById("x")?.textContent).toBe("hi")
  })
})
