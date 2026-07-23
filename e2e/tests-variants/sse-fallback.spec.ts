import { expect, test } from '@playwright/test'
import { viteRpc } from '../tests/helpers'

const BASE_URL = 'http://localhost:3366/'

test('channel B works over the SSE + POST fallback transport', async ({ page }) => {
  const sockets: string[] = []
  page.on('websocket', ws => sockets.push(ws.url()))

  await page.goto(`${BASE_URL}__devtools__/`)

  expect(await viteRpc(page, 'heartbeat')).toBe(true)

  // No devtools WebSocket was opened - the shim went straight to SSE.
  expect(sockets.filter(url => url.includes('__vue-devtools-ws__'))).toEqual([])

  // Real RPC payloads flow both ways over SSE/POST.
  const assets = await viteRpc(page, 'getStaticAssets')
  expect(assets.some(a => a.path === 'logo.svg')).toBe(true)
})
