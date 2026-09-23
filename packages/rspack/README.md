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

The integration has two halves: a **compiler plugin** (injects the in-page bootstrap) and
**dev-server middlewares** (the devframe hub with its dock and RPC, the DevTools client,
open-in-editor). Both must be registered.

```js
// rspack.config.mjs
import { rspack } from '@rspack/core'
import { VueDevToolsRspackPlugin } from '@vue-devtools-rstack/rspack'
import { createDevtoolsMiddlewares, printDevtoolsBanner } from '@vue-devtools-rstack/rspack/middleware'
import { VueLoaderPlugin } from 'vue-loader'

const PORT = 3000

const devtoolsServer = createDevtoolsMiddlewares()

export default {
  mode: 'development',
  plugins: [
    new VueLoaderPlugin(),
    new rspack.HtmlRspackPlugin({ template: './index.html' }),
    new VueDevToolsRspackPlugin(),
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
| `enabled` | `boolean` | `true` | Install Vue DevTools. |
| `appendTo` | `string \| RegExp \| Array<string \| RegExp>` | - | Import the devtools from matching modules instead of injecting a script tag. |

`createDevtoolsMiddlewares(options)` takes `base`, `enabled`, `root` (default `process.cwd()`;
open-in-editor refuses files outside the workspace), `launchEditor`, `embeddedVisibility`,
`dockPreferences` and `allowedOrigins` - see the
[project README](https://github.com/OskarLebuda/vue-devtools-rstack#options).

MIT. Consumes the prebuilt Vue DevTools client from `vite-plugin-vue-devtools` (MIT, © webfansplz
and the vuejs/devtools contributors).
