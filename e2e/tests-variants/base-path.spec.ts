import { expect, test } from '@playwright/test'
import { openDevtoolsPanel } from '../tests/helpers'

const BASE_URL = 'http://localhost:3355/app/'

test('everything is mounted under a non-root server.base', async ({ page }) => {
  const sockets: string[] = []
  page.on('websocket', ws => sockets.push(ws.url()))

  await page.goto(BASE_URL)

  // Bootstrap injected with the base-aware URL.
  const src = await page.locator('script[src*="bootstrap.js"]').first().getAttribute('src')
  expect(src).toContain('/app/__vue-devtools__/bootstrap.js')

  const frame = await openDevtoolsPanel(page)
  await expect(frame.locator('body')).toContainText('HomePage')

  // The client iframe and the hub socket are served from the based paths.
  const iframeSrc = await page.locator('iframe[src*="__devtools__/"]').getAttribute('src')
  expect(iframeSrc).toContain('/app/__devtools__/')
  expect(sockets.some(url => url.endsWith('/app/__devtools/__ws'))).toBe(true)
})

test('connection metadata honours the base path', async ({ request }) => {
  const meta = await (await request.get(`${BASE_URL}__devtools/__connection.json`)).json()
  expect(meta.websocket.path).toBe('/app/__devtools/__ws')
  expect(meta.sse.path).toBe('/app/__devtools/__sse')

  // Also served next to the client SPA, for when it runs as its own window.
  const clientMeta = await (await request.get(`${BASE_URL}__devtools__/__connection.json`)).json()
  expect(clientMeta).toEqual(meta)
})
