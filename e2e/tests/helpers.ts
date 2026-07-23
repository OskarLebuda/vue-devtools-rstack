import type { FrameLocator, Page } from '@playwright/test'
import type { ViteRpcClient } from '../globals'
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

/** Waits for the client SPA to establish the dev-server ("vite") RPC channel. */
export async function waitForViteRpc(page: Page): Promise<void> {
  await page.waitForFunction(() => !!window.__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__, undefined, {
    timeout: 15_000,
  })
}

/**
 * Calls a server RPC function from the page, the same way the DevTools client
 * does. Must be run on a page that hosts the client SPA (`/__devtools__/`).
 */
export async function viteRpc<M extends keyof ViteRpcClient>(
  page: Page,
  method: M,
  ...args: Parameters<ViteRpcClient[M]>
): Promise<Awaited<ReturnType<ViteRpcClient[M]>>> {
  await waitForViteRpc(page)
  return page.evaluate(
    ([name, callArgs]) => {
      const rpc = window.__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__!
      const fn = rpc[name as keyof ViteRpcClient] as (...xs: unknown[]) => Promise<unknown>
      return fn(...callArgs)
    },
    [method, args] as [string, unknown[]],
  ) as Promise<Awaited<ReturnType<ViteRpcClient[M]>>>
}

/** Waits for the component-picker runtime to install its global. */
export async function waitForInspector(page: Page): Promise<void> {
  await page.waitForFunction(() => !!window.__VUE_INSPECTOR__, undefined, { timeout: 15_000 })
}

export async function enableInspector(page: Page): Promise<void> {
  await waitForInspector(page)
  await page.evaluate(() => window.__VUE_INSPECTOR__!.enable())
}
