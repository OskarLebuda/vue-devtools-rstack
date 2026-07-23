/**
 * Runtime entry for `appendTo` / preEntry mode — compiled by the USER's
 * bundler as part of the app graph (the alternative to HTML injection,
 * mirroring upstream's appendTo). Options are provided via DefinePlugin.
 */
import { initVueDevTools } from '../overlay/init'

declare const __VUE_DEVTOOLS_RSPACK_OPTIONS__: {
  base?: string
  componentInspector?: boolean
} | undefined

const options
  = typeof __VUE_DEVTOOLS_RSPACK_OPTIONS__ !== 'undefined' ? __VUE_DEVTOOLS_RSPACK_OPTIONS__ : {}

initVueDevTools({
  base: options?.base || '/',
  componentInspector: options?.componentInspector ?? true,
})
