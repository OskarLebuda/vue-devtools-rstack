import { expect, test } from '@playwright/test'
import { viteRpc } from './helpers'

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
  expect(await viteRpc(page, 'heartbeat')).toBe(true)

  const root = await viteRpc(page, 'getRoot')
  expect(typeof root).toBe('string')
  expect(root.length).toBeGreaterThan(0)
})
