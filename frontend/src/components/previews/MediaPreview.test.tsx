import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { MediaPreview } from "./MediaPreview"

describe("<MediaPreview />", () => {
  it("renders a <video> when kind is 'video'", () => {
    const { container } = render(
      <MediaPreview url="blob:v" kind="video" mimeType="video/mp4" />,
    )
    const video = container.querySelector("video")
    expect(video).not.toBeNull()
    expect(video!.getAttribute("src")).toBe("blob:v")
    expect(video!.querySelector("source")?.getAttribute("type")).toBe("video/mp4")
  })

  it("renders an <audio> when kind is 'audio'", () => {
    const { container } = render(
      <MediaPreview url="blob:a" kind="audio" mimeType="audio/mpeg" />,
    )
    const audio = container.querySelector("audio")
    expect(audio).not.toBeNull()
    expect(audio!.getAttribute("src")).toBe("blob:a")
    expect(audio!.querySelector("source")?.getAttribute("type")).toBe("audio/mpeg")
  })
})
