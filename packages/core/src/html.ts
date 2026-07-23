import type { ResolvedVueDevToolsOptions } from './options'

/** URL of the injected overlay bootstrap module, options passed via query. */
export function getBootstrapUrl(base: string, options: ResolvedVueDevToolsOptions): string {
  const query = new URLSearchParams({
    base,
    inspector: options.componentInspector ? '1' : '0',
  })
  return `${base}__vue-devtools__/overlay-bootstrap.js?${query.toString()}`
}

export interface BootstrapScriptTag {
  tag: 'script'
  attrs: { type: 'module', src: string }
}

export function getBootstrapScriptTag(
  base: string,
  options: ResolvedVueDevToolsOptions,
): BootstrapScriptTag {
  return {
    tag: 'script',
    attrs: { type: 'module', src: getBootstrapUrl(base, options) },
  }
}
