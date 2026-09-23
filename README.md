<picture>
  <img alt="Vue DevTools for Rspack & Rsbuild" src="https://raw.githubusercontent.com/OskarLebuda/vue-devtools-rstack/refs/heads/main/.github/assets/banner.png">
</picture>

# Vue DevTools for Rspack & Rsbuild

[Vue DevTools](https://devtools.vuejs.org) v9 - the floating dock, component tree with live
state editing, in-page component picker, timeline, router & pinia inspectors and open-in-editor -
for projects built with [Rspack](https://rspack.rs) and [Rsbuild](https://rsbuild.rs).

Upstream ships Vue DevTools as `vite-plugin-vue-devtools`, leaving Rspack users with only the
browser extension. This project closes that gap with **feature parity against
`vite-plugin-vue-devtools@9.0.0-beta.0`** - without rewriting DevTools. Under Vite, v9 lives inside
Vite DevTools; here the same [devframe](https://devfra.me) hub that Vite DevTools is built on is
mounted on your Rspack/Rsbuild dev server. See [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md).

## Requirements

Node 20.19+ or 22.12+. These packages are **ESM only** - no CommonJS build is shipped. A CommonJS
config (`rspack.config.js` with `require()`) still works on those versions thanks to Node's
`require(esm)` support.

## Quick start

### Rsbuild

```bash
pnpm add -D @vue-devtools-rstack/rsbuild
```

```ts
// rsbuild.config.ts
import { defineConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import { pluginVueDevTools } from '@vue-devtools-rstack/rsbuild'

export default defineConfig({
  plugins: [pluginVue(), pluginVueDevTools()],
})
```

Start the dev server - the DevTools dock appears in the corner of your app, and the standalone
viewer is reachable at `http://localhost:<port>/__devtools/`.

### Raw Rspack

```bash
pnpm add -D @vue-devtools-rstack/rspack
```

```js
// rspack.config.mjs
import { VueDevToolsRspackPlugin } from '@vue-devtools-rstack/rspack'
import { createDevtoolsMiddlewares, printDevtoolsBanner } from '@vue-devtools-rstack/rspack/middleware'

const devtoolsServer = createDevtoolsMiddlewares()

export default {
  plugins: [/* VueLoaderPlugin, HtmlRspackPlugin, ... */ new VueDevToolsRspackPlugin()],
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
| `enabled` | `boolean` | `true` | Install Vue DevTools and register its dock entry. |
| `appendTo` | `string \| RegExp \| Array<string \| RegExp>` | - | Import the devtools from matching modules instead of injecting a `<script>` tag (for apps without an HTML entry). |
| `launchEditor` | `string` | `process.env.LAUNCH_EDITOR`, else auto-detected | Editor opened by open-in-editor. |
| `embeddedVisibility` | `'normal' \| 'passive' \| 'hidden'` | `'normal'` | Initial visibility of the floating dock. |
| `dockPreferences` | `object` | - | Dock bar preferences (category order, first-run position). |
| `allowedOrigins` | `string[]` | `[]` | Origins allowed on the DevTools socket besides loopback - for LAN or tunnel access. |

`@vue-devtools-rstack/rspack` additionally accepts `base` (dev-server base path), and its
`createDevtoolsMiddlewares` accepts `root`.

### Migrating from 0.1.x (Vue DevTools v8)

- The v8 overlay is replaced by the devframe dock. `/__devtools__/` still serves the client SPA,
  but it only connects to the app from inside the dock; open `/__devtools/` for a separate window.
- `componentInspector` is removed: the component picker is built into v9 (the crosshair button in
  the components tab). Passing the option logs a warning.
- The assets, module graph and Vite Inspect tabs are gone upstream, and so are the rspack stats
  collector and assets watcher: `VueDevToolsRspackPlugin#collector` and the `publicDir`,
  `distPath` and `collector` options of `createDevtoolsMiddlewares` were removed.

## Development

```bash
pnpm install
pnpm build          # build all packages (rslib) - run this first
pnpm lint           # rslint, lint + type check in one pass
pnpm typecheck      # rslint, types only
pnpm dev            # rsbuild playground on :3333
pnpm --filter playground-rspack-app dev   # raw rspack playground on :3344
pnpm e2e            # full Playwright suite (all four legs)
pnpm check:publish  # publint + attw over the packed tarballs
```

The toolchain is Rstack throughout: packages are built with
[Rslib](https://rslib.rs), linted with [Rslint](https://rslint.rs),
and exercised against both Rsbuild and raw Rspack playgrounds.

Linting is type-aware and covers the packages, the e2e specs and the playgrounds, so it needs the
packages built first - cross-package imports resolve through the declarations in `dist/`.

## Credits & license

MIT. Vue DevTools itself is built by [webfansplz](https://github.com/webfansplz) and the
[vuejs/devtools](https://github.com/vuejs/devtools) contributors - this project consumes its
published packages and prebuilt assets, and ports the thin Vite glue to Rspack. The dock and hub
are [devframe](https://github.com/devframes/devframe) by Anthony Fu (MIT).
