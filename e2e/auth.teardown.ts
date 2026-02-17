import { test as teardown } from "@playwright/test"
import fs from "fs"

teardown("cleanup auth state", async () => {
  const authFile = "e2e/.auth/user.json"
  if (fs.existsSync(authFile)) {
    fs.unlinkSync(authFile)
  }
})
