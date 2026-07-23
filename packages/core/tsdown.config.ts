import { defineConfig } from 'tsdown'

export default defineConfig([
  // Node library: server-side logic consumed by the rsbuild/rspack plugins.
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    platform: 'node',
    dts: true,
    clean: true,
  },
  // Runtime module for appendTo/preEntry mode: compiled by the USER's bundler,
  // so dependencies stay external (resolved from this package's node_modules).
  {
    entry: { runtime: 'runtime/entry.ts' },
    format: ['esm'],
    platform: 'browser',
    dts: true,
    clean: false,
  },
  // Overlay bootstrap: self-contained ESM served statically by the dev server.
  // Everything (devtools-kit/core/shared, superjson, birpc...) must be inlined —
  // the browser cannot resolve bare imports from a plain <script type=module>.
  {
    entry: { 'overlay-bootstrap': 'overlay/bootstrap.ts' },
    format: ['esm'],
    platform: 'browser',
    dts: false,
    clean: false,
    noExternal: /(.*)/,
  },
])
