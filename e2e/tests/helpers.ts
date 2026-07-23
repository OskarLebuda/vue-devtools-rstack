import type { FrameLocator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** Opens the floating DevTools panel and returns the client SPA iframe. */
export async function openDevtoolsPanel(page: Page): Promise<FrameLocator> {
  const container = page.locator('#__vue-devtools-container__')
  await expect(container).toBeAttached()
  // The Vue-logo button inside the floating anchor toggles the panel. The
  // overlay app may still be hydrating right after load, so retry the click
  // until the iframe shows up.
  await expect(async () => {
    await container.locator('.panel-entry-btn').click({ force: true, timeout: 2000 })
    await expect(page.locator('#vue-devtools-iframe')).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 15_000 })
  return page.frameLocator('#vue-devtools-iframe')
}

export function devtoolsFrame(page: Page): FrameLocator {
  return page.frameLocator('#vue-devtools-iframe')
}
