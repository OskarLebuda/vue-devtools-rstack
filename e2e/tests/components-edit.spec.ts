import { expect, test } from '@playwright/test'
import { openDevtoolsPanel } from './helpers'

test('editing component state in devtools updates the live app', async ({ page }) => {
  await page.goto('/state')
  await expect(page.getByTestId('amount')).toHaveText('amount: 42')

  const frame = await openDevtoolsPanel(page)

  // Select the StatePage component in the tree.
  await frame.locator('body').getByText('StatePage', { exact: false }).first().click()

  // The state pane lists `amount: 42`; hovering the row reveals quick-edit
  // buttons for numbers (+1 / -1).
  const row = frame.locator('.font-state-field').filter({ hasText: 'amount' }).first()
  await expect(row).toBeVisible()
  await row.hover()
  await row.locator('.i-carbon-add').first().click({ force: true })

  // Round-trip: devtools edit → devtools-kit state editor → live app DOM.
  await expect(page.getByTestId('amount')).toHaveText('amount: 43')
})

test('state changed in the app is reflected in the devtools pinia tab', async ({ page }) => {
  await page.goto('/')
  const frame = await openDevtoolsPanel(page)

  // The pinia tab only exists once the store's devtools plugin registered.
  await frame.locator('a[href="/pinia"], a[href$="/pinia"]').first().click()
  await expect(frame.locator('body')).toContainText('counter')

  // Expand the store's reactive state node to reveal its fields.
  await frame.locator('.font-state-field').filter({ hasText: 'Reactive' }).first().click()
  await expect(frame.locator('body')).toContainText('playground-counter')

  // Trigger a pinia action from the app itself...
  await page.getByTestId('increment').click()
  await expect(page.getByTestId('count')).toContainText('Count: 1')

  // ...and the devtools pinia pane picks it up over channel A.
  await expect
    .poll(() => frame.locator('body').innerText(), { timeout: 10_000 })
    .toMatch(/count[\s\S]{0,20}\b1\b/i)
})
