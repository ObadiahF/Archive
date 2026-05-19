import path from "path";
import { mimeFor, resolveSafe, toApiPath } from "../../src/storage";

const ROOT = process.env.STORAGE_ROOT!;

describe("resolveSafe()", () => {
  it("rejects paths without a leading slash", () => {
    expect(() => resolveSafe("foo/bar")).toThrow(/Path must start with/);
  });

  it("rejects null bytes", () => {
    expect(() => resolveSafe("/foo\0bar")).toThrow(/Null byte/);
  });

  it("rejects traversal segments", () => {
    expect(() => resolveSafe("/../etc/passwd")).toThrow(/traversal/);
    expect(() => resolveSafe("/a/../../b")).toThrow(/traversal/);
  });

  it("returns the storage root for '/'", () => {
    expect(resolveSafe("/")).toBe(ROOT);
  });

  it("resolves nested paths under the storage root", () => {
    expect(resolveSafe("/a/b/c")).toBe(path.join(ROOT, "a", "b", "c"));
  });

  it("normalises duplicate slashes", () => {
    expect(resolveSafe("/a//b///c")).toBe(path.join(ROOT, "a", "b", "c"));
  });

  it("non-string input throws INVALID_PATH", () => {
    expect(() => resolveSafe(123 as unknown as string)).toThrow(/Path must start with/);
  });
});

describe("toApiPath()", () => {
  it("returns '/' for the storage root itself", () => {
    expect(toApiPath(ROOT)).toBe("/");
  });

  it("round-trips back to a leading-slash path", () => {
    const abs = path.join(ROOT, "x", "y.txt");
    expect(toApiPath(abs)).toBe("/x/y.txt");
  });
});

describe("mimeFor()", () => {
  it.each([
    ["a.png", "image/png"],
    ["b.JPG", "image/jpeg"],
    ["c.md", "text/markdown"],
    ["d.mp4", "video/mp4"],
    ["e.pdf", "application/pdf"],
    ["f.unknownext", "application/octet-stream"],
    ["NOEXT", "application/octet-stream"],
  ])("maps %s -> %s", (name, mime) => {
    expect(mimeFor(name)).toBe(mime);
  });
});
