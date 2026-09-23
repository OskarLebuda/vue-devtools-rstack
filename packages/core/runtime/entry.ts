/**
 * Runtime entry for `appendTo` mode - compiled by the USER's bundler as part
 * of the app graph (the alternative to HTML injection, mirroring upstream's
 * appendTo). Options come from the import query, or from DefinePlugin when
 * the bundler strips the query.
 */
import { install } from '../client/install'

declare const __VUE_DEVTOOLS_RSPACK_OPTIONS__: { base?: string } | undefined

function readBase(): string {
  const defined
    = typeof __VUE_DEVTOOLS_RSPACK_OPTIONS__ !== 'undefined' ? __VUE_DEVTOOLS_RSPACK_OPTIONS__ : undefined

  let fromQuery: string | null
  try {
    fromQuery = new URL(import.meta.url).searchParams.get('base')
  }
  catch {
    fromQuery = null
  }

  return fromQuery ?? defined?.base ?? '/'
}

install({ base: readBase() })
