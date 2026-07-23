import { expect, test } from '@playwright/test'
import { waitForInspector } from './helpers'

test('devtools panel shows the component-inspector button and it toggles the picker', async ({ page }) => {
  await page.goto('/')
  await waitForInspector(page)

  const container = page.locator('#__vue-devtools-container__')
  await expect(container).toBeAttached()

  // devtools-kit detects __VUE_INSPECTOR__ → the crosshair button renders
  // next to the Vue logo in the floating panel.
  const inspectorButton = container.locator('.vue-devtools__inspector-button')
  await expect(inspectorButton).toBeAttached()

  await inspectorButton.click({ force: true })
  await expect
    .poll(() => page.evaluate(() => window.__VUE_INSPECTOR__!.enabled))
    .toBe(true)

  await page.keyboard.press('Escape')
  await expect
    .poll(() => page.evaluate(() => window.__VUE_INSPECTOR__!.enabled))
    .toBe(false)
})
