import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { ImagePreview } from "./ImagePreview"

describe("<ImagePreview />", () => {
  it("renders an <img> with the given url and name", () => {
    render(<ImagePreview url="blob:abc" name="cat.jpg" />)
    const img = screen.getByRole("img", { name: "cat.jpg" }) as HTMLImageElement
    expect(img.src).toContain("blob:abc")
  })
})
