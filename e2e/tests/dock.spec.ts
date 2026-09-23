import { expect, test } from '@playwright/test'
import { dockButton, openDevtoolsPanel } from './helpers'

test('dock mounts with the Vue DevTools entry and no uncaught errors on load', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', err => errors.push(String(err)))

  await page.goto('/')
  await expect(page.locator('devframes-dock-embedded')).toBeAttached()
  // The entry is registered server-side, so it proves the hub RPC is up.
  await expect(dockButton(page)).toBeAttached()

  expect(errors).toEqual([])
})

test('dock entry opens the client SPA connected to the live app', async ({ page }) => {
  await page.goto('/')
  const frame = await openDevtoolsPanel(page)

  await expect(frame.locator('#app')).toBeAttached()
  await expect(frame.locator('body')).toContainText('HomePage')
})

test('standalone viewer is served at __devtools/', async ({ page }) => {
  const res = await page.goto('/__devtools/')
  expect(res?.status()).toBe(200)

  const meta = await (await page.request.get('/__devtools/__connection.json')).json()
  expect(meta.backend).toBe('websocket')
  expect(meta.websocket.path).toBe('/__devtools/__ws')
})
