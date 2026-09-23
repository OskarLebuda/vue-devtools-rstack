/**
 * Bootstrap entry - prebundled (self-contained ESM) and served by the dev
 * server at `${base}__vue-devtools__/bootstrap.js`. Options arrive as query
 * params on the script src (module scripts expose them via import.meta.url).
 */
import { install } from './install'

const url = new URL(import.meta.url)

install({
  base: url.searchParams.get('base') || '/',
  origin: url.origin,
})
