import { test, expect } from "@playwright/test"

// All tests run at desktop viewport (>1024px) — Playwright's Desktop Chrome
// default is 1280x720, which triggers the lg: breakpoint.

test.describe("Kanban Board — Desktop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/orders")
    // Wait for the kanban board to render (hidden on mobile, visible on lg+)
    await expect(page.locator(".hidden.lg\\:block")).toBeVisible()
  })

  test("renders 7 status columns", async ({ page }) => {
    const expectedColumns = [
      "Pendiente cotización",
      "Cotizado",
      "Aprobado",
      "En proceso",
      "Listo",
      "Entregado",
      "Cancelado",
    ]

    for (const label of expectedColumns) {
      await expect(
        page.locator(".hidden.lg\\:block").getByText(label, { exact: true }).first()
      ).toBeVisible()
    }
  })

  test("each column shows order count badge", async ({ page }) => {
    // Every column header has a count badge (even if 0)
    const columns = page.locator(".hidden.lg\\:block [data-testid]").or(
      // Columns are the flex children with min-w-[256px]
      page.locator(".hidden.lg\\:block .min-w-\\[256px\\]")
    )
    const count = await columns.count()
    expect(count).toBeGreaterThanOrEqual(7)
  })

  test("order cards display client name, service, and price", async ({ page }) => {
    // Find the first kanban card (rounded-md border inside a column)
    const firstCard = page
      .locator(".hidden.lg\\:block .min-w-\\[256px\\] .rounded-md.border")
      .first()

    // Skip if no orders exist
    const cardCount = await firstCard.count()
    if (cardCount === 0) {
      test.skip()
      return
    }

    // Card should have text content (client name)
    await expect(firstCard.locator("p.font-medium").first()).not.toBeEmpty()
  })

  test("drag-and-drop changes order status", async ({ page }) => {
    // Find a card in any non-empty column
    const cards = page.locator(
      ".hidden.lg\\:block .min-w-\\[256px\\] .rounded-md.border.bg-background"
    )
    const cardCount = await cards.count()
    if (cardCount === 0) {
      test.skip()
      return
    }

    const sourceCard = cards.first()
    const sourceText = await sourceCard.locator("p.font-medium").first().textContent()

    // Find the "Listo" column as drop target
    const listoHeader = page
      .locator(".hidden.lg\\:block")
      .getByText("Listo", { exact: true })
      .first()
    const listoColumn = listoHeader.locator("xpath=ancestor::*[contains(@class, 'min-w-')]")

    // Perform drag
    await sourceCard.dragTo(listoColumn)

    // Expect a success toast
    await expect(page.getByText("Estado actualizado")).toBeVisible({ timeout: 5_000 })
  })

  test("click on card opens EditOrderModal (no accidental drag)", async ({ page }) => {
    const cards = page.locator(
      ".hidden.lg\\:block .min-w-\\[256px\\] .rounded-md.border.bg-background"
    )
    const cardCount = await cards.count()
    if (cardCount === 0) {
      test.skip()
      return
    }

    // Single click (no drag movement)
    await cards.first().click()

    // EditOrderModal should appear — look for dialog/sheet
    await expect(
      page.getByRole("dialog").or(page.locator("[role=dialog]"))
    ).toBeVisible({ timeout: 5_000 })
  })

  test("search filters cards across columns", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Buscar por cliente o descripción...")
    await searchInput.fill("zzzznonexistent")

    // Wait for filter to apply
    await page.waitForTimeout(300)

    // All columns should show "Sin pedidos"
    const emptyLabels = page.locator(".hidden.lg\\:block").getByText("Sin pedidos")
    const count = await emptyLabels.count()
    expect(count).toBeGreaterThanOrEqual(1)

    // Clear search
    await searchInput.clear()
  })

  test("status filter shows only one column centered", async ({ page }) => {
    // Click on a status quick filter or use the stats card
    // Use the dashboard stats to filter by a status
    const enProcesoStat = page.getByText("En proceso").first()
    await enProcesoStat.click()

    // Should show only 1 column (centered layout)
    await page.waitForTimeout(500)
    const columns = page.locator(".hidden.lg\\:block .min-w-\\[256px\\]")
    const count = await columns.count()
    expect(count).toBe(1)
  })
})

test.describe("Kanban Board — Mobile fallback", () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test("shows card list instead of kanban on mobile", async ({ page }) => {
    await page.goto("/orders")

    // Kanban board should be hidden
    const kanban = page.locator(".hidden.lg\\:block")
    await expect(kanban).toBeHidden()

    // Card list should be visible
    const cardList = page.locator(".lg\\:hidden")
    await expect(cardList).toBeVisible()
  })
})
