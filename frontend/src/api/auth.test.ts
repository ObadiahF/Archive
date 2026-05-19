import { describe, expect, it } from "vitest"
import { clearToken, getToken, setToken } from "./auth"

describe("auth token storage", () => {
  it("returns null when no token is stored", () => {
    expect(getToken()).toBeNull()
  })

  it("stores and reads back a token", () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    setToken("abc.def.ghi", future)
    expect(getToken()).toBe("abc.def.ghi")
  })

  it("clears the token", () => {
    setToken("abc", new Date(Date.now() + 60_000).toISOString())
    clearToken()
    expect(getToken()).toBeNull()
    expect(localStorage.getItem("archive.token")).toBeNull()
    expect(localStorage.getItem("archive.expiresAt")).toBeNull()
  })

  it("treats an expired token as missing and clears storage", () => {
    const past = new Date(Date.now() - 1000).toISOString()
    setToken("expired", past)
    expect(getToken()).toBeNull()
    expect(localStorage.getItem("archive.token")).toBeNull()
  })

  it("returns the token if expiresAt is absent (no expiry guard)", () => {
    localStorage.setItem("archive.token", "no-exp")
    expect(getToken()).toBe("no-exp")
  })
})
