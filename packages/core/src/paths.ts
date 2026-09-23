import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'

const _dirname = dirname(fileURLToPath(import.meta.url))

/** Prebundled in-page bootstrap shipped in this package's dist. */
export const BOOTSTRAP_FILE = join(_dirname, 'bootstrap.js')

/**
 * The devframe hub: floating dock, standalone viewer, `__connection.json`
 * and the RPC socket. Same mount as Vite DevTools (`/__devtools/`).
 */
export const getHubBase = (base: string): string => `${base}__devtools/`

/** The Vue DevTools client SPA. Same mount as vite-plugin-vue-devtools. */
export const getClientBase = (base: string): string => `${base}__devtools__/`

/** Our own static assets (the in-page bootstrap). */
export const getAssetsBase = (base: string): string => `${base}__vue-devtools__/`

export function getBootstrapUrl(base: string): string {
  return `${getAssetsBase(base)}bootstrap.js?${new URLSearchParams({ base })}`
}

/**
 * The Vue DevTools client SPA is a private package upstream; its prebuilt
 * bundle ships inside the `vite-plugin-vue-devtools` tarball. We consume it
 * from there - pinned exactly, see package.json.
 */
export function resolveClientDir(): string {
  let pkgDir: string
  try {
    pkgDir = dirname(fileURLToPath(import.meta.resolve('vite-plugin-vue-devtools/package.json')))
  }
  catch {
    throw new Error(
      '[vue-devtools-rstack] Could not resolve the `vite-plugin-vue-devtools` package. '
      + 'It ships the prebuilt DevTools client and must be installed '
      + '(it is a dependency of @vue-devtools-rstack/core, pinned to 9.0.0-beta.0).',
    )
  }

  const clientDir = join(pkgDir, 'client')
  if (!fs.existsSync(join(clientDir, 'index.html')) || !fs.existsSync(join(clientDir, 'dock-client.js'))) {
    throw new Error(
      '[vue-devtools-rstack] The installed `vite-plugin-vue-devtools` package does not contain '
      + 'the expected prebuilt client. This integration is verified against '
      + 'vite-plugin-vue-devtools@9.0.0-beta.0 - make sure that exact version is installed.',
    )
  }
  return clientDir
}
