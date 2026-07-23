import { expect, test } from '@playwright/test'

const BASE_URL = 'http://localhost:3366/'

test('channel B works over the SSE + POST fallback transport', async ({ page }) => {
  const sockets: string[] = []
  page.on('websocket', ws => sockets.push(ws.url()))

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

  // No devtools WebSocket was opened - the shim went straight to SSE.
  expect(sockets.filter(url => url.includes('__vue-devtools-ws__'))).toEqual([])

  // Real RPC payloads flow both ways over SSE/POST.
  const assets = await page.evaluate(async () =>
    (window as any).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__.getStaticAssets())
  expect(assets.some((a: any) => a.path === 'logo.svg')).toBe(true)
})
