import type { CreateUiOptions } from '@devframes/hub-ui'

export type AppendTo = string | RegExp | Array<string | RegExp>

export interface VueDevToolsOptions {
  /**
   * Install Vue DevTools and register its dock entry.
   * Mirrors vite-plugin-vue-devtools `enabled`.
   * @default true
   */
  enabled?: boolean

  /**
   * Prepend the devtools runtime import to the modules whose id matches,
   * instead of injecting a <script> tag into the HTML.
   * Mirrors vite-plugin-vue-devtools `appendTo`.
   */
  appendTo?: AppendTo

  /**
   * Editor launched by open-in-editor requests.
   * @default process.env.LAUNCH_EDITOR, or the editor detected by devframe
   */
  launchEditor?: string

  /**
   * Initial visibility of the floating dock. Mirrors Vite DevTools
   * `devtools.embeddedVisibility`.
   * @default 'normal'
   */
  embeddedVisibility?: CreateUiOptions['embeddedVisibility']

  /**
   * Dock bar preferences (category order, first-run position...). Mirrors
   * Vite DevTools `devtools.dockPreferences`.
   */
  dockPreferences?: CreateUiOptions['dockPreferences']

  /**
   * Extra origins allowed to open the DevTools RPC socket, beyond loopback.
   * Needed when the app is reached through a LAN address or a tunnel.
   */
  allowedOrigins?: string[]
}

export interface ResolvedVueDevToolsOptions {
  enabled: boolean
  appendTo: Array<string | RegExp>
  launchEditor: string | undefined
  embeddedVisibility: CreateUiOptions['embeddedVisibility']
  dockPreferences: CreateUiOptions['dockPreferences']
  allowedOrigins: string[]
}

/** Options that existed for Vue DevTools v8 and were dropped with v9. */
const REMOVED_OPTIONS: Record<string, string> = {
  componentInspector: 'component inspection is built into Vue DevTools v9',
}

export function resolveVueDevToolsOptions(
  options: VueDevToolsOptions = {},
): ResolvedVueDevToolsOptions {
  for (const [key, reason] of Object.entries(REMOVED_OPTIONS)) {
    if (key in options)
      console.warn(`[vue-devtools-rstack] The \`${key}\` option was removed: ${reason}.`)
  }

  const appendTo = options.appendTo
  return {
    enabled: options.enabled ?? true,
    appendTo: !appendTo ? [] : Array.isArray(appendTo) ? appendTo : [appendTo],
    launchEditor: options.launchEditor ?? process.env.LAUNCH_EDITOR,
    embeddedVisibility: options.embeddedVisibility,
    dockPreferences: options.dockPreferences,
    allowedOrigins: options.allowedOrigins ?? [],
  }
}

/** Whether a module id matches one of the `appendTo` matchers. */
export function matchesAppendTo(id: string, matchers: Array<string | RegExp>): boolean {
  const [filename = ''] = id.split('?', 1)
  return matchers.some((matcher) => {
    if (typeof matcher === 'string')
      return filename.endsWith(matcher)
    matcher.lastIndex = 0
    return matcher.test(filename)
  })
}

/** Ensure a leading and trailing slash: '' → '/', 'app' → '/app/'. */
export function normalizeBase(base: string | undefined): string {
  let b = base || '/'
  if (!b.startsWith('/'))
    b = `/${b}`
  if (!b.endsWith('/'))
    b = `${b}/`
  return b
}
