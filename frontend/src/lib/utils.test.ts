import { describe, expect, it } from "vitest"
import { cn } from "./utils"

describe("cn()", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("filters out falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b")
  })

  it("merges conflicting Tailwind utilities, keeping the last", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("text-sm text-red-500", "text-blue-500")).toBe("text-sm text-blue-500")
  })

  it("supports object syntax via clsx", () => {
    expect(cn({ a: true, b: false, c: true })).toBe("a c")
  })

  it("supports nested arrays", () => {
    expect(cn(["a", ["b", { c: true }]])).toBe("a b c")
  })
})
