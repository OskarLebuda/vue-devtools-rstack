import { defineConfig } from '@rslib/core'

export default defineConfig({
  lib: [
    // Node library: server-side logic consumed by the rsbuild/rspack plugins.
    {
      format: 'esm',
      syntax: 'es2022',
      dts: { bundle: true },
      source: { entry: { index: './src/index.ts' } },
      output: { target: 'node' },
    },
    // Runtime module for appendTo/preEntry mode: compiled by the USER's bundler,
    // so dependencies stay external (resolved from this package's node_modules).
    {
      format: 'esm',
      syntax: 'es2022',
      dts: { bundle: true },
      source: { entry: { runtime: './runtime/entry.ts' } },
      output: { target: 'web' },
    },
    // In-page bootstrap: self-contained ESM served statically by the dev server.
    // Everything (devtools-kit, devframe's in-page channel...) must be inlined -
    // the browser cannot resolve bare imports from a plain <script type=module>.
    {
      format: 'esm',
      syntax: 'es2022',
      dts: false,
      autoExternal: false,
      source: { entry: { bootstrap: './client/bootstrap.ts' } },
      output: { target: 'web' },
    },
  ],
})
