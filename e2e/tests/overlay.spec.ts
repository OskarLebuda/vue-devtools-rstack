import { expect, test } from '@playwright/test'
import { openDevtoolsPanel } from './helpers'

test('overlay anchor mounts and no uncaught errors on load', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', err => errors.push(String(err)))

  await page.goto('/')
  await expect(page.locator('#__vue-devtools-container__')).toBeAttached()

  expect(errors).toEqual([])
})

test('devtools panel opens and shows the client SPA', async ({ page }) => {
  await page.goto('/')
  const frame = await openDevtoolsPanel(page)

  // The client SPA mounts its root once loaded.
  await expect(frame.locator('#app')).toBeAttached()
  // Channel A works when the components tab renders the live app tree.
  await expect(frame.locator('body')).toContainText('App')
  await expect(frame.locator('body')).toContainText('HomePage')
})
