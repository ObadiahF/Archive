import { expect, test } from "@playwright/test"
import { TEST_PASSWORD, TEST_USERNAME, login, resetStorage } from "./_helpers"

test.beforeEach(() => {
  resetStorage()
})

test("rejects bad credentials with a toast", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel(/operator/i).fill(TEST_USERNAME)
  await page.getByLabel(/cipher/i).fill("wrong")
  await page.getByRole("button", { name: /open the cabinet/i }).click()
  await expect(page.getByText(/invalid/i)).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test("logs in successfully and lands on the file browser", async ({ page }) => {
  await login(page)
  await expect(page.getByText("Archive", { exact: false })).toBeVisible()
})

test("persists session across reload", async ({ page }) => {
  await login(page)
  await page.reload()
  await expect(page).toHaveURL(/\/files/)
})

test("logout clears the token and redirects to /login", async ({ page }) => {
  await login(page)
  await page.getByRole("button", { name: /sign out/i }).click()
  await expect(page).toHaveURL(/\/login/)
  const token = await page.evaluate(() => localStorage.getItem("archive.token"))
  expect(token).toBeNull()
})
