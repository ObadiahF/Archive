export type ErrorCode =
  | "INVALID_PATH"
  | "INVALID_REQUEST"
  | "INVALID_CREDENTIALS"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "FILE_TOO_LARGE"
  | "INTERNAL";

export class ApiError extends Error {
  status: number;
  code: ErrorCode;

  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const Errors = {
  invalidPath: (msg = "Invalid path") => new ApiError(400, "INVALID_PATH", msg),
  invalidRequest: (msg = "Invalid request") => new ApiError(400, "INVALID_REQUEST", msg),
  invalidCredentials: () => new ApiError(401, "INVALID_CREDENTIALS", "Invalid username or password"),
  unauthenticated: (msg = "Authentication required") => new ApiError(401, "UNAUTHENTICATED", msg),
  forbidden: (msg = "Forbidden") => new ApiError(403, "FORBIDDEN", msg),
  notFound: (msg = "Not found") => new ApiError(404, "NOT_FOUND", msg),
  alreadyExists: (msg = "Already exists") => new ApiError(409, "ALREADY_EXISTS", msg),
  fileTooLarge: (msg = "File too large") => new ApiError(413, "FILE_TOO_LARGE", msg),
};
