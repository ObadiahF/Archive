import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { PdfPreview } from "./PdfPreview"

describe("<PdfPreview />", () => {
  it("renders an iframe pointed at the given url with the file name as title", () => {
    const { container } = render(<PdfPreview url="blob:p" name="spec.pdf" />)
    const iframe = container.querySelector("iframe")
    expect(iframe).not.toBeNull()
    expect(iframe!.getAttribute("src")).toBe("blob:p")
    expect(iframe!.getAttribute("title")).toBe("spec.pdf")
  })
})
