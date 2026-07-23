import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { openDevtoolsPanel } from './helpers'

const publicDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../playground/rsbuild-app/public',
)

test('assets tab lists files and live-updates on file creation', async ({ page }) => {
  await page.goto('/')
  const frame = await openDevtoolsPanel(page)

  // Navigate the client SPA to the assets tab via its sidebar router link.
  await frame.locator('a[href="/assets"], a[href$="/assets"]').first().click()

  // Known playground assets show up.
  await expect(frame.locator('body')).toContainText('logo.svg')
  await expect(frame.locator('body')).toContainText('sample.json')

  // assetsUpdated broadcast: create a new file and expect a live refresh.
  // NOTE: the extension must already exist in the initial asset list - the
  // client's extension filter is initialized once (upstream watchOnce) and
  // hides later-added unknown extensions (same behavior under Vite).
  const newFile = path.join(publicDir, 'live-added.json')
  try {
    fs.writeFileSync(newFile, '{"added":"during e2e"}')
    await expect(frame.locator('body')).toContainText('live-added.json', { timeout: 10_000 })
  }
  finally {
    fs.rmSync(newFile, { force: true })
  }

  // ...and disappear again after deletion.
  await expect(frame.locator('body')).not.toContainText('live-added.json', { timeout: 10_000 })
})
