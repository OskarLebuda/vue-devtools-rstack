import { defineConfig } from '@playwright/test'
import { FAKE_EDITOR, fakeEditorLog } from './tests/helpers'

const PORT = Number(process.env.PLAYGROUND_RSPACK_PORT) || 3344

export default defineConfig({
  testDir: './tests-rspack',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm --filter playground-rspack-app run dev',
    cwd: '..',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    stdout: 'ignore',
    timeout: 90_000,
    env: { LAUNCH_EDITOR: FAKE_EDITOR, FAKE_EDITOR_LOG: fakeEditorLog('rspack') },
  },
})
