import { expect, test } from "@playwright/test"
import { login, resetStorage } from "./_helpers"

test.beforeEach(async ({ page }) => {
  resetStorage()
  await login(page)
})

test("creates a folder via the dialog", async ({ page }) => {
  await page.getByRole("button", { name: /new folder/i }).click()
  await page.getByPlaceholder(/title this folder/i).fill("photos")
  await page.getByRole("button", { name: /file it/i }).click()
  await expect(page.getByRole("button", { name: /photos/i })).toBeVisible()
})

test("creates a text file and edits it in the preview dialog", async ({ page }) => {
  await page.getByRole("button", { name: /new file/i }).click()
  await page.getByPlaceholder(/e\.g\. todo\.md/i).fill("notes.md")
  await page.getByRole("button", { name: /draft it/i }).click()
  // Creating a text file pops open the preview dialog in edit mode.
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("dialog").getByText("notes.md")).toBeVisible()
})

test("deletes a folder from the context menu", async ({ page }) => {
  await page.getByRole("button", { name: /new folder/i }).click()
  await page.getByPlaceholder(/title this folder/i).fill("toremove")
  await page.getByRole("button", { name: /file it/i }).click()
  // Scope to the file list row (a <button>) — sidebar uses a link, and
  // toast notifications also contain the name.
  const fileRow = page.getByRole("button", { name: "toremove", exact: true })
  await expect(fileRow).toBeVisible()

  page.on("dialog", (d) => d.accept())
  await fileRow.click({ button: "right" })
  await page.getByRole("menuitem", { name: /incinerate/i }).click()
  await expect(fileRow).toHaveCount(0)
})
