import { expect, type Page } from "@playwright/test"
import path from "node:path"
import fs from "node:fs"

export const TEST_USERNAME = "e2euser"
export const TEST_PASSWORD = "e2epass"

export async function login(page: Page): Promise<void> {
  await page.goto("/login")
  await page.getByLabel(/operator/i).fill(TEST_USERNAME)
  await page.getByLabel(/cipher/i).fill(TEST_PASSWORD)
  await page.getByRole("button", { name: /open the cabinet/i }).click()
  await expect(page).toHaveURL(/\/files/)
}

/**
 * Reset the storage directory between specs.
 * The path matches the STORAGE_ROOT env var set in playwright.config.ts.
 */
export function resetStorage(): void {
  const dir = path.resolve(__dirname, "..", ".e2e-storage")
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}
