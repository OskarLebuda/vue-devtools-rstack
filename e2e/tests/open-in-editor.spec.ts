import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { fakeEditorLog, openDevtoolsPanel, readEditorLaunches } from './helpers'

const log = fakeEditorLog('rsbuild')

test('open-in-editor launches the editor with the component source', async ({ page }) => {
  fs.rmSync(log, { force: true })

  await page.goto('/')
  const frame = await openDevtoolsPanel(page)

  await frame.locator('body').getByText('HomePage', { exact: false }).first().click()
  await frame.getByRole('button', { name: 'Open component source in editor' }).click()

  // Client SPA → devframe RPC (`vite:core:open-in-editor`) → LAUNCH_EDITOR.
  await expect.poll(() => readEditorLaunches(log).flat()).toContainEqual(
    expect.stringMatching(/playground\/rsbuild-app\/src\/pages\/HomePage\.vue$/),
  )
})
