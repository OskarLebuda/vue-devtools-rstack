import { defineConfig } from '@playwright/test'

const PORT = Number(process.env.PLAYGROUND_PORT) || 3333

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm --filter playground-rsbuild-app run dev',
    cwd: '..',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    stdout: 'ignore',
    timeout: 60_000,
  },
})
