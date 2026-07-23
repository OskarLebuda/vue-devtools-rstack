import { expect, test } from '@playwright/test'
import { openDevtoolsPanel } from '../tests/helpers'

test('overlay is injected via HtmlRspackPlugin and the panel opens', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', err => errors.push(String(err)))

  await page.goto('/')
  const frame = await openDevtoolsPanel(page)

  await expect(frame.locator('#app')).toBeAttached()
  await expect(frame.locator('body')).toContainText('App')
  await expect(frame.locator('body')).toContainText('HomePage')
  expect(errors).toEqual([])
})

test('vite RPC channel works over the shim on @rspack/dev-server', async ({ page }) => {
  await page.goto('/__devtools__/')

  const heartbeat = await page.evaluate(async () => {
    const start = Date.now()
    while (!(window as any).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__) {
      if (Date.now() - start > 10_000)
        throw new Error('vite rpc client never initialized')
      await new Promise(r => setTimeout(r, 100))
    }
    return (window as any).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__.heartbeat()
  })
  expect(heartbeat).toBe(true)

  const assets = await page.evaluate(async () =>
    (window as any).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__.getStaticAssets())
  expect(assets.some((a: any) => a.path === 'logo.svg')).toBe(true)

  const modules = await page.evaluate(async () =>
    (window as any).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__.getGraphModules())
  expect(modules.some((m: any) => m.id.endsWith('/src/App.vue'))).toBe(true)
})

test('component inspector and open-in-editor work under raw rspack', async ({ page }) => {
  const editorRequests: string[] = []
  await page.route('**/__open-in-editor**', async (route) => {
    editorRequests.push(route.request().url())
    await route.fulfill({ status: 204, body: '' })
  })

  await page.goto('/')
  await page.waitForFunction(() => !!(window as any).__VUE_INSPECTOR__)

  const attr = await page
    .locator('[data-v-inspector*="HomePage.vue"]')
    .first()
    .getAttribute('data-v-inspector')
  expect(attr).toMatch(/HomePage\.vue:\d+:\d+$/)

  await page.evaluate(() => (window as any).__VUE_INSPECTOR__.enable())
  const target = page.getByTestId('count')
  await target.hover()
  await page.waitForTimeout(300)
  await target.click()

  await expect.poll(() => editorRequests.length).toBeGreaterThan(0)
  expect(new URL(editorRequests[0]).searchParams.get('file')).toMatch(/HomePage\.vue:\d+:\d+$/)
})

test('live state editing round-trips through channel A', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByTestId('amount')).toHaveText('amount: 42')

  const frame = await openDevtoolsPanel(page)
  await frame.locator('body').getByText('AboutPage', { exact: false }).first().click()

  const row = frame.locator('.font-state-field').filter({ hasText: 'amount' }).first()
  await expect(row).toBeVisible()
  await row.hover()
  await row.locator('.i-carbon-add').first().click({ force: true })

  await expect(page.getByTestId('amount')).toHaveText('amount: 43')
})
