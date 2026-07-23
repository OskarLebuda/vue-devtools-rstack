<picture>
  <img alt="Vue DevTools for Rspack & Rsbuild" src="https://raw.githubusercontent.com/OskarLebuda/vue-devtools-rstack/refs/heads/main/.github/assets/banner.png">
</picture>

# @vue-devtools-rstack/rspack

[Vue DevTools](https://devtools.vuejs.org) for raw [Rspack](https://rspack.rs) setups - feature
parity with `vite-plugin-vue-devtools`.

> Using Rsbuild? Prefer [`@vue-devtools-rstack/rsbuild`](https://www.npmjs.com/package/@vue-devtools-rstack/rsbuild),
> which wires everything up in one line.

```bash
pnpm add -D @vue-devtools-rstack/rspack
```

The integration has two halves: a **compiler plugin** (overlay injection, component-inspector
transform, module-graph collection) and **dev-server middlewares** (DevTools client, RPC channel,
open-in-editor). Both must be registered.

```js
// rspack.config.mjs
import { rspack } from '@rspack/core'
import { VueDevToolsRspackPlugin } from '@vue-devtools-rstack/rspack'
import { createDevtoolsMiddlewares, printDevtoolsBanner } from '@vue-devtools-rstack/rspack/middleware'
import { VueLoaderPlugin } from 'vue-loader'

const PORT = 3000

const devtools = new VueDevToolsRspackPlugin()
const devtoolsServer = createDevtoolsMiddlewares({
  collector: devtools.collector, // shares module-graph data with the graph tab
})

export default {
  mode: 'development',
  plugins: [
    new VueLoaderPlugin(),
    new rspack.HtmlRspackPlugin({ template: './index.html' }),
    devtools,
  ],
  devServer: {
    port: PORT,
    historyApiFallback: true,
    onListening: () => printDevtoolsBanner(PORT),
    setupMiddlewares: (middlewares, devServer) => {
      // attach() must run before the middlewares are read, so the WebSocket
      // transport is chosen over the SSE fallback.
      devtoolsServer.attach(devServer.server)
      middlewares.unshift(...devtoolsServer.middlewares)
      return middlewares
    },
  },
}
```

Requires `@rspack/dev-server`. HTML injection uses `HtmlRspackPlugin`'s tag hooks; if you have no
HTML entry, use the `appendTo` option instead.

## Options

`new VueDevToolsRspackPlugin(options)`:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `base` | `string` | `'/'` | Dev-server base path; must match `createDevtoolsMiddlewares({ base })`. |
| `componentInspector` | `boolean \| object` | `true` | Click-to-source picker. |
| `launchEditor` | `string` | `LAUNCH_EDITOR ?? 'code'` | Editor for open-in-editor. |
| `appendTo` | `string \| RegExp` | `''` | Import the overlay from a matching module instead of injecting a script tag. |

`createDevtoolsMiddlewares(options)` takes the same options plus `root` (default `process.cwd()`),
`publicDir` (default `<root>/public`), `distPath`, and `collector`.

MIT. Consumes the prebuilt Vue DevTools client from `vite-plugin-vue-devtools` (MIT, © webfansplz
and the vuejs/devtools contributors).
