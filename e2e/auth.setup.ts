import { test as setup, expect } from "@playwright/test"

const authFile = "e2e/.auth/user.json"

setup("authenticate", async ({ page }) => {
  const email = process.env.PLAYWRIGHT_USER_EMAIL
  const password = process.env.PLAYWRIGHT_USER_PASSWORD

  if (!email || !password) {
    throw new Error(
      "Missing PLAYWRIGHT_USER_EMAIL or PLAYWRIGHT_USER_PASSWORD in .env.local"
    )
  }

  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Contrasena").fill(password)
  await page.getByRole("button", { name: "Ingresar" }).click()

  // Wait until redirected to /orders (auth success)
  await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 })

  // Save signed-in state
  await page.context().storageState({ path: authFile })
})
