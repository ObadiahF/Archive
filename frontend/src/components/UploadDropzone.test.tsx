import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { UploadDropzone } from "./UploadDropzone"

describe("<UploadDropzone />", () => {
  it("renders nothing when hidden", () => {
    const { container } = render(<UploadDropzone visible={false} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders the drop-to-file overlay when visible", () => {
    render(<UploadDropzone visible={true} />)
    expect(screen.getByText(/drop\s*to\s*file/i)).toBeInTheDocument()
  })
})
