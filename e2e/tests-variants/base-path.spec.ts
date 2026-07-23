import { expect, test } from '@playwright/test'
import { openDevtoolsPanel } from '../tests/helpers'

const BASE_URL = 'http://localhost:3355/app/'

test('everything is mounted under a non-root server.base', async ({ page }) => {
  await page.goto(BASE_URL)

  // Overlay injected with the base-aware bootstrap URL.
  const src = await page.locator('script[src*="overlay-bootstrap"]').first().getAttribute('src')
  expect(src).toContain('/app/__vue-devtools__/overlay-bootstrap.js')

  const frame = await openDevtoolsPanel(page)
  await expect(frame.locator('body')).toContainText('HomePage')

  // The client iframe is served from the based path...
  const iframeSrc = await page.locator('#vue-devtools-iframe').getAttribute('src')
  expect(iframeSrc).toContain('/app/__devtools__/')
})

test('channel B and open-in-editor honour the base path', async ({ page }) => {
  await page.goto(`${BASE_URL}__devtools__/`)

  const heartbeat = await page.evaluate(async () => {
    const start = Date.now()
    while (!(window as any).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__) {
      if (Date.now() - start > 15_000)
        throw new Error('vite rpc client never initialized')
      await new Promise(r => setTimeout(r, 100))
    }
    return (window as any).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__.heartbeat()
  })
  expect(heartbeat).toBe(true)

  const editorRequests: string[] = []
  await page.route('**/__open-in-editor**', async (route) => {
    editorRequests.push(route.request().url())
    await route.fulfill({ status: 204, body: '' })
  })

  await page.goto(BASE_URL)
  await page.waitForFunction(() => !!(window as any).__VUE_INSPECTOR__)
  await page.evaluate(() => (window as any).__VUE_INSPECTOR__.enable())
  const target = page.getByTestId('count')
  await target.hover()
  await page.waitForTimeout(300)
  await target.click()

  await expect.poll(() => editorRequests.length).toBeGreaterThan(0)
  expect(editorRequests[0]).toContain('/app/__open-in-editor')
})
