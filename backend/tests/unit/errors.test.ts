import { ApiError, Errors } from "../../src/errors";

describe("Errors factory", () => {
  it.each([
    ["invalidPath", 400, "INVALID_PATH"],
    ["invalidRequest", 400, "INVALID_REQUEST"],
    ["invalidCredentials", 401, "INVALID_CREDENTIALS"],
    ["unauthenticated", 401, "UNAUTHENTICATED"],
    ["forbidden", 403, "FORBIDDEN"],
    ["notFound", 404, "NOT_FOUND"],
    ["alreadyExists", 409, "ALREADY_EXISTS"],
    ["fileTooLarge", 413, "FILE_TOO_LARGE"],
  ] as const)("%s -> %i / %s", (factory, status, code) => {
    const err = (Errors as Record<string, () => ApiError>)[factory]();
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(status);
    expect(err.code).toBe(code);
    expect(typeof err.message).toBe("string");
    expect(err.message.length).toBeGreaterThan(0);
  });

  it("ApiError carries a custom message when provided", () => {
    const err = Errors.notFound("File not found");
    expect(err.message).toBe("File not found");
  });
});
