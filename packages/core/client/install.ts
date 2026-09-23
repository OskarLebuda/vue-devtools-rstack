/**
 * In-page Vue DevTools v9 setup, shared by the prebundled bootstrap (HTML
 * injection) and the runtime entry (`appendTo`).
 *
 * Mirrors the two halves vite-plugin-vue-devtools + Vite DevTools inject:
 * the `virtual:vue-devtools-client` module (installs the devtools hook and
 * the in-page RPC host the client SPA iframe talks to) and the devframe
 * hub's floating dock (`embedded.js`).
 */
import { installVueDevTools } from 'vite-plugin-vue-devtools/client'

interface DevtoolsWindow {
  __VUE_DEVTOOLS_RSTACK_INITIALIZED__?: boolean
}

export interface InstallOptions {
  /** Dev-server base path, normalized with leading + trailing slash. */
  base: string
  /** Origin serving the devtools routes. @default location.origin */
  origin?: string
}

export function install(options: InstallOptions): void {
  const win = window as unknown as DevtoolsWindow
  if (win.__VUE_DEVTOOLS_RSTACK_INITIALIZED__)
    return
  win.__VUE_DEVTOOLS_RSTACK_INITIALIZED__ = true

  // Must run before the app calls createApp(), so the hook sees it.
  installVueDevTools({ enabled: true })

  const src = new URL(`${options.base || '/'}__devtools/embedded.js`, options.origin ?? location.origin).href
  const mount = () => {
    const script = document.createElement('script')
    script.type = 'module'
    script.src = src
    document.body.appendChild(script)
  }
  if (document.body)
    mount()
  else
    document.addEventListener('DOMContentLoaded', mount, { once: true })
}
