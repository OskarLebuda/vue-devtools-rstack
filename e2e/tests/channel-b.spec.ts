import { expect, test } from '@playwright/test'

test('client SPA establishes the vite RPC over the shim and heartbeat resolves', async ({ page }) => {
  const failedRequests: string[] = []
  page.on('requestfailed', (req) => {
    if (req.url().includes('@vite/client'))
      failedRequests.push(req.url())
  })

  await page.goto('/__devtools__/')

  // vite-hot-client must import our shim successfully...
  expect(failedRequests).toEqual([])

  // ...and the birpc client over our WebSocket must answer a real RPC call.
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

  const root = await page.evaluate(async () =>
    (window as any).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__.getRoot())
  expect(typeof root).toBe('string')
  expect(root.length).toBeGreaterThan(0)
})
