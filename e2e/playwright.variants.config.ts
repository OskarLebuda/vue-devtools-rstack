import process from 'node:process'
import { defineConfig } from '@playwright/test'

const BASE_PORT = 3355
const SSE_PORT = 3366

/**
 * Edge-case legs: the plugin under a non-root `server.base`, and with the
 * WebSocket transport forced off so the SSE + POST fallback carries channel B.
 */
export default defineConfig({
  testDir: './tests-variants',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 2 : 0,
  use: { trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'pnpm --filter playground-rsbuild-app run dev',
      cwd: '..',
      url: `http://localhost:${BASE_PORT}/app/`,
      reuseExistingServer: true,
      stdout: 'ignore',
      timeout: 90_000,
      env: { PLAYGROUND_PORT: String(BASE_PORT), PLAYGROUND_BASE: '/app/' },
    },
    {
      command: 'pnpm --filter playground-rsbuild-app run dev',
      cwd: '..',
      url: `http://localhost:${SSE_PORT}/`,
      reuseExistingServer: true,
      stdout: 'ignore',
      timeout: 90_000,
      env: { PLAYGROUND_PORT: String(SSE_PORT), VUE_DEVTOOLS_RSPACK_FORCE_SSE: '1' },
    },
  ],
})
