import process from 'node:process'
import { defineConfig } from '@playwright/test'

/**
 * Build-level checks: no browser and no dev server. Kept in a separate run
 * because these drive full production builds of the playground.
 */
export default defineConfig({
  testDir: './tests-build',
  timeout: 180_000,
  retries: process.env.CI ? 1 : 0,
})
