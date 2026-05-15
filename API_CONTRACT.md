# API Contract

Self-hosted Dropbox-style file manager. Single-user. JWT auth. Path-based addressing rooted at a configured storage directory.

## Conventions

- **Base URL:** `http://localhost:3000/api`
- **Operational endpoint:** `GET /health` (outside `/api`, no auth) returns `{ "status": "ok", "uptime": <seconds> }`. Use for liveness probes.
- **Content-Type:** `application/json` for JSON bodies; `multipart/form-data` for uploads.
- **Auth:** All `/api/*` routes except `POST /api/auth/login` require auth. Token may be passed via `Authorization: Bearer <token>` header OR `?t=<token>` query param (the latter is for media tags that can't set headers).
- **Path format:** POSIX-style, always absolute relative to the storage root, leading slash required (`/`, `/photos`, `/photos/2024/img.jpg`).
  - The backend resolves these against a configured root directory.
  - Path traversal (`..`) is rejected with `400`.
  - Paths are URL-encoded when sent as query params.
- **Errors:** `{ "error": string, "code"?: string }` with a non-2xx status.
- **Timestamps:** ISO 8601 strings (e.g. `"2026-05-14T10:30:00.000Z"`).

### Standard error codes

| HTTP | `code`             | When |
|------|--------------------|------|
| 400  | `INVALID_PATH`     | Path is malformed or attempts traversal |
| 400  | `INVALID_REQUEST`  | Missing/malformed body or query |
| 401  | `INVALID_CREDENTIALS` | Login failed (wrong username or password) |
| 401  | `UNAUTHENTICATED`  | Missing/invalid/expired token |
| 403  | `FORBIDDEN`        | Auth valid but action not allowed |
| 404  | `NOT_FOUND`        | Path does not exist |
| 409  | `ALREADY_EXISTS`   | Target path already exists (for move/create) |
| 413  | `FILE_TOO_LARGE`   | Upload exceeds size limit |
| 500  | `INTERNAL`         | Unhandled server error |

---

## Auth

### `POST /api/auth/login`

Exchange credentials for a JWT.

**Request**
```json
{ "username": "obadiah", "password": "hunter2" }
```

**Response 200**
```json
{
  "token": "eyJhbGciOi...",
  "expiresAt": "2026-05-15T10:30:00.000Z",
  "user": { "username": "obadiah" }
}
```

**Errors:** `401 INVALID_CREDENTIALS`

### `GET /api/auth/me`

Returns the authenticated user. Useful for the frontend to verify a stored token on app load.

**Response 200**
```json
{ "user": { "username": "obadiah" } }
```

---

## Browse

### `GET /api/list?path=/some/folder`

List the contents of a folder.

**Query**
- `path` (optional, defaults to `/`) — folder to list.

**Response 200**
```json
{
  "path": "/photos/2024",
  "parent": "/photos",
  "entries": [
    {
      "name": "vacation.jpg",
      "path": "/photos/2024/vacation.jpg",
      "type": "file",
      "size": 1048576,
      "mimeType": "image/jpeg",
      "modifiedAt": "2026-05-10T14:22:01.000Z"
    },
    {
      "name": "raw",
      "path": "/photos/2024/raw",
      "type": "folder",
      "size": null,
      "mimeType": null,
      "modifiedAt": "2026-05-09T09:00:00.000Z"
    }
  ]
}
```

**Notes**
- `parent` is `null` when `path === "/"`.
- Frontend handles sorting; backend returns natural directory order.
- `mimeType` is best-effort from extension.

**Errors:** `404 NOT_FOUND`, `400 INVALID_PATH`

---

## Read files

### `GET /api/file?path=/x.jpg`

Stream a file inline for preview. Browser-friendly headers.

- **Response:** binary stream
- `Content-Type: <detected mime>` (best-effort from extension; `application/octet-stream` fallback)
- `Content-Disposition: inline; filename="x.jpg"; filename*=UTF-8''<encoded>`
- `Content-Length` and `Last-Modified` set
- `Accept-Ranges: bytes`; `Range` requests return `206` with `Content-Range` (essential for `<video>` / `<audio>` scrubbing)

**Frontend usage:**
```html
<img src="/api/file?path=/photos/cat.jpg" />
<video src="/api/file?path=/videos/clip.mp4" controls />
<iframe src="/api/file?path=/docs/spec.pdf" />
```

**Auth on media tags:** `<img>`/`<video>` cannot send `Authorization` headers. The backend therefore accepts the JWT via **either**:
- `Authorization: Bearer <token>` header (preferred for fetch/XHR), or
- `?t=<token>` query param (use for `<img>`, `<video>`, `<iframe>` `src`).

Example:
```html
<img src="/api/file?path=/photos/cat.jpg&t=eyJhbGciOi..." />
```

The token in the query param is the same JWT — no separate "signed URL" issuance step. The frontend just appends `&t=` + the stored token.

### `GET /api/file/download?path=/x.jpg`

Same stream but with `Content-Disposition: attachment; filename="x.jpg"` to force a download.

**Errors (both):** `404 NOT_FOUND`, `400 INVALID_PATH`, `400 INVALID_REQUEST` if path resolves to a folder, `416` for an unsatisfiable `Range`.

---

## Write

### `POST /api/upload`

Upload one or more files into a folder.

**Request:** `multipart/form-data`
- Form field `path` (required) — destination folder, e.g. `/photos/2024`. Folder must exist.
- Form field `files` (required, repeatable) — file blobs.
- Optional form field `overwrite` (`"true"` | `"false"`, default `"false"`).

**Response 201**
```json
{
  "files": [
    {
      "name": "vacation.jpg",
      "path": "/photos/2024/vacation.jpg",
      "size": 1048576,
      "mimeType": "image/jpeg"
    }
  ]
}
```

**Errors:** `404 NOT_FOUND` (folder missing), `409 ALREADY_EXISTS` (and `overwrite=false`), `413 FILE_TOO_LARGE`, `400 INVALID_REQUEST`.

**Limits:** 100 MB per file, 20 files per request (configurable via env).

### `POST /api/folder`

Create a new folder.

**Request**
```json
{ "path": "/photos/2025" }
```

**Response 201**
```json
{ "path": "/photos/2025", "createdAt": "2026-05-14T10:30:00.000Z" }
```

**Notes:** Parent folder must exist. Set `recursive: true` in the body to create intermediates (`mkdir -p`).

**Errors:** `409 ALREADY_EXISTS`, `404 NOT_FOUND` (parent missing, when not recursive).

### `POST /api/move`

Rename **or** move a file or folder. Same endpoint covers both — a rename is just a move within the same parent.

**Request**
```json
{ "from": "/photos/img1.jpg", "to": "/photos/2024/vacation.jpg" }
```

**Response 200**
```json
{ "from": "/photos/img1.jpg", "to": "/photos/2024/vacation.jpg" }
```

**Errors:** `404 NOT_FOUND` (source missing OR destination's parent folder missing), `409 ALREADY_EXISTS`, `400 INVALID_PATH`, `400 INVALID_REQUEST` (missing `from`/`to`).

### `DELETE /api/entry?path=/x`

Delete a file or folder. Folders are deleted recursively.

**Response 204** (no body)

**Errors:** `404 NOT_FOUND`, `400 INVALID_PATH`, `400 INVALID_REQUEST` (cannot delete the storage root, i.e. `path=/`).

---

## Suggested frontend flow

1. **App load:** Check for stored token. If present, `GET /auth/me`. On `401`, show login.
2. **Login:** `POST /auth/login`, store `token` + `expiresAt` (localStorage is fine for a self-hosted single-user app; sessionStorage if you want logout-on-close).
3. **Browser:** Track current `path` in app state. On change, `GET /list?path=...`.
4. **Preview pane:** Build an `<img>`/`<video>`/`<iframe>` `src` from `/file?path=...&t=<token>`.
5. **Upload:** Drag-drop or file input → `POST /upload` with `FormData`. Use `XMLHttpRequest` (not `fetch`) to surface upload progress via the `xhr.upload.onprogress` event.
6. **Folder switching:** Just update local `path` state and re-list. Backend has no notion of "current folder."
7. **Token refresh:** On any `401`, kick to login. (No refresh token — JWT TTL is 24h by default, configurable.)

---

## Out of scope for v1

- **Search.** No `GET /api/search` yet. Add later if needed.
- **Refresh tokens.** JWT TTL is 24h (configurable). On any 401, frontend kicks to login.
- **Chunked / resumable uploads.** Single-shot multipart only.

---

## Configuration (backend env vars)

| Var                     | Default      | Purpose |
|-------------------------|--------------|---------|
| `PORT`                  | `3000`       | HTTP port |
| `STORAGE_ROOT`          | `./storage`  | Filesystem root for all user files |
| `AUTH_USERNAME`         | (required)   | Single-user username |
| `AUTH_PASSWORD`         | (required)   | Single-user password (compared in constant time) |
| `JWT_SECRET`            | (required)   | HMAC secret for signing |
| `JWT_TTL_HOURS`         | `24`         | Token lifetime |
| `MAX_FILE_BYTES`        | `104857600`  | 100 MB per file |
| `MAX_FILES_PER_REQUEST` | `20`         | Upload count cap |
