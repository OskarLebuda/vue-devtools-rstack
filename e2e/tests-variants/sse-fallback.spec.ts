import { expect, test } from '@playwright/test'
import { openDevtoolsPanel } from '../tests/helpers'

const BASE_URL = 'http://localhost:3366/'

test('hub RPC works over the SSE fallback transport', async ({ page, request }) => {
  const meta = await (await request.get(`${BASE_URL}__devtools/__connection.json`)).json()
  expect(meta.backend).toBe('sse')

  const sockets: string[] = []
  page.on('websocket', ws => sockets.push(ws.url()))

  // The dock entry is registered server-side, so the dock rendering it and
  // opening the client proves RPC flows over SSE.
  await page.goto(BASE_URL)
  const frame = await openDevtoolsPanel(page)
  await expect(frame.locator('body')).toContainText('HomePage')

  // No devtools WebSocket was opened.
  expect(sockets.filter(url => url.includes('__devtools/'))).toEqual([])
})
