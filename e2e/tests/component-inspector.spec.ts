import { expect, test } from '@playwright/test'
import { openDevtoolsPanel } from './helpers'

test('picking an element in the page selects its component', async ({ page }) => {
  await page.goto('/state')
  const frame = await openDevtoolsPanel(page)

  // <App> is selected initially, so its state pane has no `amount` row.
  const amountRow = frame.locator('.group\\/state-row').filter({ hasText: 'amount' })
  await expect(amountRow).toHaveCount(0)

  // Built into Vue DevTools v9: the dock steps aside while picking.
  await frame.getByRole('button', { name: 'Select component in the page' }).click()
  const target = page.getByTestId('amount')
  await target.hover()
  await target.click()

  await expect(amountRow.first()).toBeVisible()
})
