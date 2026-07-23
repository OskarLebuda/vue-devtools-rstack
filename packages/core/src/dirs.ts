import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'

const _dirname = dirname(fileURLToPath(import.meta.url))

/** Prebundled overlay bootstrap shipped in this package's dist. */
export const BOOTSTRAP_FILE = join(_dirname, 'overlay-bootstrap.js')

export interface DevtoolsDirs {
  /** Prebuilt DevTools client SPA (served at {base}__devtools__). */
  clientDir: string
  /** Prebuilt overlay bundle (devtools-overlay.mjs + .css). */
  overlayDir: string
}

/**
 * The DevTools client SPA and overlay UI are private packages upstream, but
 * their prebuilt bundles ship inside the `vite-plugin-vue-devtools` tarball.
 * We consume them from there - pinned exactly, see package.json.
 */
export function resolveDevtoolsDirs(): DevtoolsDirs {
  let pkgDir: string
  try {
    pkgDir = dirname(fileURLToPath(import.meta.resolve('vite-plugin-vue-devtools/package.json')))
  }
  catch {
    throw new Error(
      '[vue-devtools-rspack] Could not resolve the `vite-plugin-vue-devtools` package. '
      + 'It ships the prebuilt DevTools client and overlay assets and must be installed '
      + '(it is a dependency of @vue-devtools-rspack/core, pinned to 8.1.5).',
    )
  }

  const clientDir = join(pkgDir, 'client')
  const overlayDir = [join(pkgDir, 'overlay'), join(pkgDir, 'src/overlay')].find(dir =>
    fs.existsSync(join(dir, 'devtools-overlay.mjs')),
  )

  if (!fs.existsSync(join(clientDir, 'index.html')) || !overlayDir) {
    throw new Error(
      '[vue-devtools-rspack] The installed `vite-plugin-vue-devtools` package does not contain '
      + 'the expected prebuilt client/overlay assets. This integration is verified against '
      + 'vite-plugin-vue-devtools@8.1.5 - make sure that exact version is installed.',
    )
  }

  return { clientDir, overlayDir }
}
