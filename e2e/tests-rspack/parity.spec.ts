import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { fakeEditorLog, openDevtoolsPanel, readEditorLaunches } from '../tests/helpers'

const log = fakeEditorLog('rspack')

test('bootstrap is injected via HtmlRspackPlugin and the dock opens the client', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', err => errors.push(String(err)))

  await page.goto('/')
  const frame = await openDevtoolsPanel(page)

  await expect(frame.locator('#app')).toBeAttached()
  await expect(frame.locator('body')).toContainText('HomePage')
  expect(errors).toEqual([])
})

test('hub RPC runs over the WebSocket on @rspack/dev-server', async ({ page }) => {
  const sockets: string[] = []
  page.on('websocket', ws => sockets.push(ws.url()))

  await page.goto('/')
  await openDevtoolsPanel(page)

  expect(sockets.some(url => url.endsWith('/__devtools/__ws'))).toBe(true)
})

test('open-in-editor works under raw rspack', async ({ page }) => {
  fs.rmSync(log, { force: true })

  await page.goto('/')
  const frame = await openDevtoolsPanel(page)

  await frame.locator('body').getByText('HomePage', { exact: false }).first().click()
  await frame.getByRole('button', { name: 'Open component source in editor' }).click()

  await expect.poll(() => readEditorLaunches(log).flat()).toContainEqual(
    expect.stringMatching(/playground\/rspack-app\/src\/pages\/HomePage\.vue$/),
  )
})

test('live state editing round-trips to the app', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByTestId('amount')).toHaveText('amount: 42')

  const frame = await openDevtoolsPanel(page)
  await frame.locator('body').getByText('AboutPage', { exact: false }).first().click()

  const row = frame.locator('.group\\/state-row').filter({ hasText: 'amount' }).first()
  await expect(row).toBeVisible()
  await row.hover()
  await row.getByRole('button', { name: 'Increment state value' }).click({ force: true })

  await expect(page.getByTestId('amount')).toHaveText('amount: 43')
})
