import { expect, test } from '@playwright/test'
import { clickInApp, openDevtoolsPanel } from './helpers'

test('editing component state in devtools updates the live app', async ({ page }) => {
  await page.goto('/state')
  await expect(page.getByTestId('amount')).toHaveText('amount: 42')

  const frame = await openDevtoolsPanel(page)

  // Select the StatePage component in the tree.
  await frame.locator('body').getByText('StatePage', { exact: false }).first().click()

  // The state pane lists `amount: 42`; hovering the row reveals quick-edit
  // buttons for numbers (+1 / -1).
  const row = frame.locator('.group\\/state-row').filter({ hasText: 'amount' }).first()
  await expect(row).toBeVisible()
  await row.hover()
  await row.getByRole('button', { name: 'Increment state value' }).click({ force: true })

  // Round-trip: devtools edit → in-page RPC → live app DOM.
  await expect(page.getByTestId('amount')).toHaveText('amount: 43')
})

test('state changed in the app is reflected in the devtools pinia tab', async ({ page }) => {
  await page.goto('/')
  const frame = await openDevtoolsPanel(page)

  // The pinia tab only exists once the store's devtools plugin registered.
  await frame.locator('a[href="/inspectors/pinia"]').click()
  await frame.locator('body').getByText('counter', { exact: true }).first().click()
  await expect(frame.locator('body')).toContainText('playground-counter')

  // Trigger a pinia action from the app itself...
  await clickInApp(page.getByTestId('increment'))
  await expect(page.getByTestId('count')).toContainText('Count: 1')

  // ...and the devtools pinia pane picks it up.
  await expect
    .poll(() => frame.locator('body').innerText(), { timeout: 10_000 })
    .toMatch(/count[\s\S]{0,20}\b1\b/i)
})
