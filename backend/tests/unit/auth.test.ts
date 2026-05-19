import jwt from "jsonwebtoken";
import { signToken, verifyCredentials } from "../../src/auth";

describe("verifyCredentials()", () => {
  it("accepts the configured username + password", () => {
    expect(verifyCredentials("testuser", "testpass")).toBe(true);
  });

  it("rejects wrong password", () => {
    expect(verifyCredentials("testuser", "wrong")).toBe(false);
  });

  it("rejects wrong username", () => {
    expect(verifyCredentials("nope", "testpass")).toBe(false);
  });

  it("rejects when password length differs (constant-time guard)", () => {
    expect(verifyCredentials("testuser", "x")).toBe(false);
  });

  it("rejects non-string inputs without throwing", () => {
    expect(verifyCredentials(undefined as unknown as string, "x")).toBe(false);
    expect(verifyCredentials("u", null as unknown as string)).toBe(false);
  });
});

describe("signToken()", () => {
  it("issues a JWT with the configured sub", () => {
    const { token, expiresAt } = signToken("testuser");
    expect(typeof token).toBe("string");
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());
    const decoded = jwt.verify(token, "test-secret-do-not-use-in-prod") as {
      sub: string;
      exp: number;
    };
    expect(decoded.sub).toBe("testuser");
  });

  it("sets expiresAt approximately TTL hours in the future", () => {
    const { expiresAt } = signToken("testuser");
    const deltaSec = (new Date(expiresAt).getTime() - Date.now()) / 1000;
    // TTL is 1 hour in setup.ts
    expect(deltaSec).toBeGreaterThan(60 * 55);
    expect(deltaSec).toBeLessThan(60 * 65);
  });
});
