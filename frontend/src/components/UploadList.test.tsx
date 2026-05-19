import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { UploadList, type UploadTask } from "./UploadList"

function task(overrides: Partial<UploadTask> = {}): UploadTask {
  return {
    id: "t1",
    name: "doc.txt",
    progress: 0,
    status: "uploading",
    ...overrides,
  }
}

describe("<UploadList />", () => {
  it("renders nothing when there are no tasks", () => {
    const { container } = render(<UploadList tasks={[]} onDismiss={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it("shows in-transit count for uploading tasks", () => {
    render(
      <UploadList
        tasks={[task({ id: "a", progress: 30 }), task({ id: "b", progress: 90 })]}
        onDismiss={() => {}}
      />,
    )
    expect(screen.getByText(/02 in transit/i)).toBeInTheDocument()
  })

  it("renders 'ledger' when no tasks are still uploading", () => {
    render(
      <UploadList
        tasks={[task({ status: "done", progress: 100 })]}
        onDismiss={() => {}}
      />,
    )
    expect(screen.getByText(/ledger/i)).toBeInTheDocument()
  })

  it("renders progress percentage rounded to two digits", () => {
    render(<UploadList tasks={[task({ progress: 47.6 })]} onDismiss={() => {}} />)
    expect(screen.getByText("48%")).toBeInTheDocument()
  })

  it("renders the error message for failed tasks", () => {
    render(
      <UploadList
        tasks={[task({ status: "error", error: "disk full" })]}
        onDismiss={() => {}}
      />,
    )
    expect(screen.getByText("disk full")).toBeInTheDocument()
  })

  it("invokes onDismiss when the dismiss button is clicked", async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<UploadList tasks={[task({ id: "x" })]} onDismiss={onDismiss} />)
    await user.click(screen.getByRole("button", { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledWith("x")
  })
})
