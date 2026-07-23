/**
 * In-page Vue DevTools initialization.
 * Faithful port of upstream vuejs/devtools packages/vite/src/overlay.js (v8.1.5),
 * with the vite-inspect custom tab removed (no vite-plugin-inspect under rspack)
 * and overlay assets loaded from this plugin's own static mount.
 */
import { functions, setDevToolsClientUrl } from '@vue/devtools-core'
import {
  createRpcServer,
  devtools,
  setDevToolsEnv,
  setOpenInEditorBaseUrl,
  toggleComponentInspectorEnabled,
} from '@vue/devtools-kit'

export interface InitOptions {
  /** Dev-server base path, normalized with leading + trailing slash. */
  base: string
  componentInspector: boolean
  origin?: string
}

export function initVueDevTools(options: InitOptions): void {
  const win = window as any
  if (win.__VUE_DEVTOOLS_RSPACK_INITIALIZED__)
    return
  win.__VUE_DEVTOOLS_RSPACK_INITIALIZED__ = true

  const origin = options.origin ?? location.origin
  const base = options.base || '/'
  const normalizeUrl = (path: string) => new URL(`${base}${path}`, origin).toString()

  const overlayDir = normalizeUrl('__vue-devtools__')
  const body = document.getElementsByTagName('body')[0]
  const head = document.getElementsByTagName('head')[0]

  // Lights up the vite-gated tabs (assets, graph) in the client SPA — our
  // dev server implements the same RPC surface, so they are fully functional.
  setDevToolsEnv({
    vitePluginDetected: true,
  })

  const devtoolsClientUrl = normalizeUrl('__devtools__/')
  setDevToolsClientUrl(devtoolsClientUrl)
  setOpenInEditorBaseUrl(normalizeUrl('').slice(0, -1))

  toggleComponentInspectorEnabled(options.componentInspector)

  devtools.init()

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `${overlayDir}/devtools-overlay.css`

  const script = document.createElement('script')
  const scriptUrl = `${overlayDir}/devtools-overlay.mjs`
  // Under a `require-trusted-types-for 'script'` CSP, assigning a string to
  // `script.src` is blocked. Wrap the URL in a TrustedScriptURL via a named
  // policy so apps can opt-in by allowing `vue-devtools` in their CSP's
  // `trusted-types` directive.
  if (typeof window !== 'undefined' && win.trustedTypes && typeof win.trustedTypes.createPolicy === 'function') {
    const policy = win.trustedTypes.createPolicy('vue-devtools', {
      createScriptURL: (input: string) => input,
    })
    script.src = policy.createScriptURL(scriptUrl)
  }
  else {
    script.src = scriptUrl
  }
  script.type = 'module'

  head!.appendChild(link)
  body!.appendChild(script)

  // Used by the browser extension to discover the embedded client.
  win.__VUE_DEVTOOLS_VITE_PLUGIN_CLIENT_URL__ = devtoolsClientUrl

  createRpcServer(functions, {
    preset: 'iframe',
  })

  createRpcServer(functions, {
    preset: 'broadcast',
  })
}
