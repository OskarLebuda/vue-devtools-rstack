/**
 * Overlay bootstrap entry — prebundled (self-contained ESM) and served by the
 * dev server at `${base}__vue-devtools__/overlay-bootstrap.js`. Options arrive
 * as query params on the script src (module scripts expose them via
 * import.meta.url).
 */
import { initVueDevTools } from './init'

const url = new URL(import.meta.url)

initVueDevTools({
  base: url.searchParams.get('base') || '/',
  componentInspector: url.searchParams.get('inspector') === '1',
  origin: url.origin,
})
