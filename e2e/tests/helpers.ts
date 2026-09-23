import type { FrameLocator, Locator, Page } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from '@playwright/test'

/** The Vue DevTools button in the devframe hub's floating dock. */
export function dockButton(page: Page) {
  return page.locator('devframes-dock-embedded button[aria-label="Vue DevTools"]')
}

/** The Vue DevTools client SPA iframe, rendered inside the dock. */
export function devtoolsFrame(page: Page): FrameLocator {
  return page.frameLocator('iframe[src*="__devtools__/"]')
}

/** Opens the Vue DevTools dock entry and returns the client SPA iframe. */
export async function openDevtoolsPanel(page: Page): Promise<FrameLocator> {
  await expect(dockButton(page)).toBeAttached()
  // The dock may still be hydrating right after load, so retry the click
  // until the iframe shows up.
  await expect(async () => {
    await dockButton(page).click({ force: true, timeout: 2000 })
    await expect(page.locator('iframe[src*="__devtools__/"]')).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 15_000 })
  const frame = devtoolsFrame(page)
  // Connected once the components tab renders the live app tree.
  await expect(frame.locator('body')).toContainText('App')
  return frame
}

/**
 * Clicks an app element while the dock panel is open. The panel floats over
 * the page, so a real pointer click would land on the dock instead.
 */
export async function clickInApp(target: Locator): Promise<void> {
  await target.dispatchEvent('click')
}

/**
 * Log written by `fixtures/fake-editor.mjs`, which the playground dev servers
 * use as LAUNCH_EDITOR. One JSON line of editor arguments per launch.
 */
export const FAKE_EDITOR = fileURLToPath(new URL('../fixtures/fake-editor.mjs', import.meta.url))

export function fakeEditorLog(name: string): string {
  return path.join(os.tmpdir(), `vue-devtools-rstack-editor-${name}.log`)
}

export function readEditorLaunches(log: string): string[][] {
  if (!fs.existsSync(log))
    return []
  return fs.readFileSync(log, 'utf-8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line) as string[])
}
