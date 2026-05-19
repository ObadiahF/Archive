import { expect, test } from "@playwright/test"
import { login, resetStorage } from "./_helpers"

test.beforeEach(async ({ page }) => {
  resetStorage()
  await login(page)
})

test("uploads a file via the deposit button and shows it in the list", async ({ page }) => {
  const fileChooserPromise = page.waitForEvent("filechooser")
  await page.getByRole("button", { name: /deposit/i }).click()
  const chooser = await fileChooserPromise
  await chooser.setFiles({
    name: "e2e.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello from e2e"),
  })
  // Scope to the file list row (rendered as a button) so we don't match
  // the upload-progress card or the success toast.
  await expect(
    page.getByRole("button", { name: "e2e.txt", exact: true }),
  ).toBeVisible()
})
