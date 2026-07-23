/**
 * Rspack loader applying the vue-inspector template transform to raw `.vue`
 * sources. Must run with `enforce: 'pre'` so it sees the original SFC before
 * vue-loader splits it. Idempotent - the transform skips elements that
 * already carry data-v-inspector.
 */
import { injectInspectorAttrs } from './dist/index.js'

export default function inspectorLoader(source) {
  if (typeof source !== 'string')
    return source
  if (this.resourceQuery && this.resourceQuery.includes('raw'))
    return source
  try {
    return injectInspectorAttrs(source, this.resourcePath, this.rootContext)
  }
  catch (err) {
    this.emitWarning?.(new Error(`[vue-devtools-rstack] inspector transform failed: ${err}`))
    return source
  }
}
