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
    // Overlay bootstrap: self-contained ESM served statically by the dev server.
    // Everything (devtools-kit/core/shared, superjson, birpc...) must be inlined -
    // the browser cannot resolve bare imports from a plain <script type=module>.
    {
      format: 'esm',
      syntax: 'es2022',
      dts: false,
      autoExternal: false,
      source: { entry: { 'overlay-bootstrap': './overlay/bootstrap.ts' } },
      output: { target: 'web' },
      tools: {
        rspack: (config, { rspack }) => {
          // The bundled deps (@vue/shared, devtools-kit, ...) read
          // `process.env.NODE_ENV` at module scope. rslib deliberately leaves
          // that replacement to the consumer's bundler, and its DefinePlugin
          // does not reach these node_modules - but this bundle is served
          // straight to the browser, where `process` does not exist at all.
          //
          // The banner declares `process` at the emitted module's top level, so
          // every bundled module reaches it through the scope chain, without
          // anything being added to globalThis.
          config.plugins ??= []
          config.plugins.push(
            new rspack.BannerPlugin({
              raw: true,
              banner: 'var process = { env: { NODE_ENV: "development" } };',
            }),
          )
        },
      },
    },
  ],
})
