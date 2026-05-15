const TOKEN_KEY = "archive.token"
const EXPIRES_KEY = "archive.expiresAt"

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  const exp = localStorage.getItem(EXPIRES_KEY)
  if (exp && Date.parse(exp) <= Date.now()) {
    clearToken()
    return null
  }
  return token
}

export function setToken(token: string, expiresAt: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXPIRES_KEY, expiresAt)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRES_KEY)
}
