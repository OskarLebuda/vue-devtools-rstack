import { expect, test } from '@playwright/test'
import { enableInspector, waitForInspector } from './helpers'

test('inspector runtime loads and SFC templates carry source locations', async ({ page }) => {
  await page.goto('/')

  // The vendored runtime mounts and registers the global inspector API.
  await waitForInspector(page)

  // The pre-loader added data-v-inspector="file:line:col" to template elements.
  const attr = await page
    .locator('[data-v-inspector*="HomePage.vue"]')
    .first()
    .getAttribute('data-v-inspector')
  expect(attr).toMatch(/HomePage\.vue:\d+:\d+$/)
})

test('picking an element requests open-in-editor with file, line and column', async ({ page }) => {
  const editorRequests: string[] = []
  await page.route('**/__open-in-editor**', async (route) => {
    editorRequests.push(route.request().url())
    await route.fulfill({ status: 204, body: '' })
  })

  await page.goto('/')
  await enableInspector(page)

  // Hover an app element so the overlay picks up its source location, then click.
  const target = page.getByTestId('count')
  await target.hover()
  await page.waitForTimeout(300)
  await target.click()

  await expect.poll(() => editorRequests.length).toBeGreaterThan(0)
  const url = new URL(editorRequests[0]!)
  expect(url.searchParams.get('file')).toMatch(/HomePage\.vue:\d+:\d+$/)
})

test('open-in-editor endpoint is served by the dev server', async ({ request }) => {
  // Missing `file` param: launch-editor-middleware answers with an error
  // instead of 404 - proves the middleware is mounted without launching an
  // actual editor during the test run.
  const res = await request.get('/__open-in-editor')
  expect(res.status()).not.toBe(404)
  expect(res.status()).toBeGreaterThanOrEqual(400)
})
