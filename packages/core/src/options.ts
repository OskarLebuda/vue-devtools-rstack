export interface VueDevToolsOptions {
  /**
   * Append the devtools runtime import to a module whose id matches,
   * instead of injecting a <script> tag into the HTML.
   * Mirrors vite-plugin-vue-devtools `appendTo`.
   */
  appendTo?: string | RegExp

  /**
   * Enable the click-to-component inspector overlay.
   * @default true
   */
  componentInspector?: boolean | Record<string, unknown>

  /**
   * Editor launched by open-in-editor requests.
   * @default process.env.LAUNCH_EDITOR ?? 'code'
   */
  launchEditor?: string
}

export interface ResolvedVueDevToolsOptions {
  appendTo: string | RegExp | ''
  componentInspector: boolean | Record<string, unknown>
  launchEditor: string
}

export function resolveVueDevToolsOptions(
  options: VueDevToolsOptions = {},
): ResolvedVueDevToolsOptions {
  return {
    appendTo: options.appendTo ?? '',
    componentInspector: options.componentInspector ?? true,
    launchEditor: options.launchEditor ?? process.env.LAUNCH_EDITOR ?? 'code',
  }
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
