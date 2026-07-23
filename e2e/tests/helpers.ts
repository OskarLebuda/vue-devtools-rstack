import type { FrameLocator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** Opens the floating DevTools panel and returns the client SPA iframe. */
export async function openDevtoolsPanel(page: Page): Promise<FrameLocator> {
  const container = page.locator('#__vue-devtools-container__')
  await expect(container).toBeAttached()
  // The Vue-logo button inside the floating anchor toggles the panel.
  await container.locator('.panel-entry-btn').click({ force: true })
  await expect(page.locator('#vue-devtools-iframe')).toBeVisible()
  return page.frameLocator('#vue-devtools-iframe')
}

export function devtoolsFrame(page: Page): FrameLocator {
  return page.frameLocator('#vue-devtools-iframe')
}
