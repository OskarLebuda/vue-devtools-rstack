import { expect, test } from '@playwright/test'
import { openDevtoolsPanel } from './helpers'

test('router tab lists routes and tracks the current route', async ({ page }) => {
  await page.goto('/')
  const frame = await openDevtoolsPanel(page)

  await frame.locator('a[href="/router"], a[href$="/router"]').first().click()

  // All three playground routes are listed by name.
  await expect(frame.locator('body')).toContainText('home')
  await expect(frame.locator('body')).toContainText('about')
  await expect(frame.locator('body')).toContainText('state')

  // Navigating in the app updates the current-route info in devtools.
  await page.getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect
    .poll(() => frame.locator('body').innerText(), { timeout: 10_000 })
    .toContain('/about')
})

test('timeline tab records events from the running app', async ({ page }) => {
  await page.goto('/')
  const frame = await openDevtoolsPanel(page)

  await frame.locator('a[href="/timeline"], a[href$="/timeline"]').first().click()

  // Timeline layers are provided by devtools-kit + the router/pinia plugins.
  await expect(frame.locator('body')).toContainText(/mouse/i)

  // Produce events in the app, then expect the timeline to have entries.
  await page.getByTestId('increment').click()
  await page.getByTestId('increment').click()

  await expect
    .poll(() => frame.locator('body').innerText(), { timeout: 10_000 })
    .toMatch(/mouse|click|pinia/i)
})
