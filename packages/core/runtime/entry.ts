/**
 * Runtime entry for `appendTo` / preEntry mode - compiled by the USER's
 * bundler as part of the app graph (the alternative to HTML injection,
 * mirroring upstream's appendTo). Options come from the import query, or
 * from DefinePlugin when the bundler strips the query.
 */
import { initVueDevTools } from '../overlay/init'

declare const __VUE_DEVTOOLS_RSPACK_OPTIONS__: {
  base?: string
  componentInspector?: boolean
} | undefined

function readOptions(): { base: string, componentInspector: boolean } {
  const defined
    = typeof __VUE_DEVTOOLS_RSPACK_OPTIONS__ !== 'undefined' ? __VUE_DEVTOOLS_RSPACK_OPTIONS__ : undefined

  let fromQuery: URLSearchParams | undefined
  try {
    fromQuery = new URL(import.meta.url).searchParams
  }
  catch {
    fromQuery = undefined
  }

  return {
    base: fromQuery?.get('base') ?? defined?.base ?? '/',
    componentInspector: fromQuery?.has('inspector')
      ? fromQuery.get('inspector') === '1'
      : defined?.componentInspector ?? true,
  }
}

initVueDevTools(readOptions())
