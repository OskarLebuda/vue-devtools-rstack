# Vue DevTools for Rspack & Rsbuild

[Vue DevTools](https://devtools.vuejs.org) v8 - the floating overlay, component tree with live
state editing, timeline, router & pinia tabs, assets browser, module graph, click-to-source
component picker and open-in-editor - for projects built with
[Rspack](https://rspack.rs) and [Rsbuild](https://rsbuild.rs).

Upstream ships Vue DevTools as `vite-plugin-vue-devtools`, leaving Rspack users with only the
browser extension. This project closes that gap with **feature parity against
`vite-plugin-vue-devtools@8.1.5`** - without rewriting DevTools.

## Requirements

Node 20.19+ or 22.12+. These packages are **ESM only** - no CommonJS build is shipped. A CommonJS
config (`rspack.config.js` with `require()`) still works on those versions thanks to Node's
`require(esm)` support.

## Quick start

### Rsbuild

```bash
pnpm add -D rsbuild-plugin-vue-devtools
```

```ts
// rsbuild.config.ts
import { defineConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import { pluginVueDevTools } from 'rsbuild-plugin-vue-devtools'

export default defineConfig({
  plugins: [pluginVue(), pluginVueDevTools()],
})
```

Start the dev server - the DevTools overlay appears in the corner of your app, and the panel is
also reachable at `http://localhost:<port>/__devtools__/`.

### Raw Rspack

```bash
pnpm add -D rspack-plugin-vue-devtools
```

```js
// rspack.config.mjs
import { VueDevToolsRspackPlugin } from 'rspack-plugin-vue-devtools'
import { createDevtoolsMiddlewares, printDevtoolsBanner } from 'rspack-plugin-vue-devtools/middleware'

const devtools = new VueDevToolsRspackPlugin()
const devtoolsServer = createDevtoolsMiddlewares({ collector: devtools.collector })

export default {
  plugins: [/* VueLoaderPlugin, HtmlRspackPlugin, ... */ devtools],
  devServer: {
    onListening: () => printDevtoolsBanner(3000),
    setupMiddlewares: (middlewares, devServer) => {
      devtoolsServer.attach(devServer.server)
      middlewares.unshift(...devtoolsServer.middlewares)
      return middlewares
    },
  },
}
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `componentInspector` | `boolean \| object` | `true` | Click-to-source component picker overlay. |
| `launchEditor` | `string` | `process.env.LAUNCH_EDITOR ?? 'code'` | Editor opened by open-in-editor. |
| `appendTo` | `string \| RegExp` | `''` | Import the overlay from a matching module instead of injecting a `<script>` tag (for apps without an HTML entry). |

`rspack-plugin-vue-devtools` additionally accepts `base` (dev-server base path), and its
`createDevtoolsMiddlewares` accepts `root`, `publicDir`, `distPath` and `collector`.

## Feature parity

| Feature | Status | Covered by |
| --- | --- | --- |
| Overlay injection + panel | ✅ | `overlay.spec.ts` |
| Component tree | ✅ | `overlay.spec.ts` |
| Live component state editing | ✅ | `components-edit.spec.ts` |
| Pinia tab (read + live updates) | ✅ | `components-edit.spec.ts` |
| Router tab | ✅ | `router-timeline.spec.ts` |
| Timeline | ✅ | `router-timeline.spec.ts` |
| Assets tab + live refresh | ✅ | `assets-ui.spec.ts`, `assets-graph.spec.ts` |
| Module graph tab | ✅ | `assets-graph.spec.ts` |
| Component picker (click-to-source) | ✅ | `inspector.spec.ts` |
| Open in editor | ✅ | `inspector.spec.ts` |
| Separate-window client (`/__devtools__/`) | ✅ | `channel-b.spec.ts` |
| Custom base path | ✅ | `tests-variants/base-path.spec.ts` |
| Raw Rspack + `@rspack/dev-server` | ✅ | `tests-rspack/parity.spec.ts` |
| Production build unaffected | ✅ | `prod-safety.spec.ts` |
| Vite Inspect tab | ➖ | Vite-only (`vite-plugin-inspect`); the module graph tab covers the same ground. |

## How it works

Vue DevTools is barely Vite-specific. Its architecture splits into two channels:

- **Channel A** (`postMessage` / `BroadcastChannel`) carries everything that runs in the page:
  component tree, state editing, timeline, router, pinia, custom tabs. It needs no dev-server
  cooperation, so it works under any bundler once the overlay is on the page.
- **Channel B** talks to the dev server and is used only by the assets and graph tabs. Upstream it
  rides Vite's HMR WebSocket; the client acquires it by importing `${base}@vite/client` and calling
  the module's `createHotContext()`.

So this project:

1. Serves the **prebuilt DevTools client SPA and overlay** shipped inside the
   `vite-plugin-vue-devtools` npm package (pinned exactly - MIT, see `LICENSE`).
2. Prebundles a self-contained **overlay bootstrap** (a port of upstream's `overlay.js`) and injects
   it into the HTML - Rspack cannot transform served files on demand, so the bootstrap must carry
   its own copy of `@vue/devtools-kit`/`-core`.
3. Serves a small **`@vite/client` shim** backed by our own WebSocket (with an SSE + POST fallback),
   which is what lets the *unmodified* client SPA talk to an Rspack dev server.
4. Reimplements the server-side RPC functions - assets (fast-glob + chokidar + image-meta) and the
   module graph (derived from Rspack compilation stats instead of `vite-plugin-inspect`).
5. Vendors the `data-v-inspector` template transform as an Rspack pre-loader plus its overlay
   runtime, and mounts an `/__open-in-editor` endpoint.

See [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) for version pinning and the upgrade procedure.

## Development

```bash
pnpm install
pnpm build          # build all packages
pnpm dev            # rsbuild playground on :3333
pnpm --filter playground-rspack-app dev   # raw rspack playground on :3344
pnpm e2e            # full Playwright suite (all three legs)
pnpm smoke:pack     # pack + install into a throwaway npm app and verify
```

## Credits & license

MIT. Vue DevTools itself is built by [webfansplz](https://github.com/webfansplz) and the
[vuejs/devtools](https://github.com/vuejs/devtools) contributors - this project consumes its
published packages and prebuilt assets, and ports the thin Vite glue to Rspack. Portions of
`vite-plugin-vue-inspector` (also MIT) are vendored for the component picker.
