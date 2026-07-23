<picture>
  <img alt="Vue DevTools for Rspack & Rsbuild" src="https://raw.githubusercontent.com/OskarLebuda/vue-devtools-rstack/refs/heads/main/.github/assets/banner.png">
</picture>

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

Start the dev server - the DevTools overlay appears in the corner of your app, and the panel is
also reachable at `http://localhost:<port>/__devtools__/`.

### Raw Rspack

```bash
pnpm add -D @vue-devtools-rstack/rspack
```

```js
// rspack.config.mjs
import { VueDevToolsRspackPlugin } from '@vue-devtools-rstack/rspack'
import { createDevtoolsMiddlewares, printDevtoolsBanner } from '@vue-devtools-rstack/rspack/middleware'

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

`@vue-devtools-rstack/rspack` additionally accepts `base` (dev-server base path), and its
`createDevtoolsMiddlewares` accepts `root`, `publicDir`, `distPath` and `collector`.


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

## Releasing

Every package shares one version. Bump locally, and CI does the rest:

```bash
pnpm release        # bumpp: picks the version, updates all package.json, commits, tags, pushes
```

Pushing the `v*` tag triggers `.github/workflows/release.yml`, which builds, publishes to npm via
trusted publishing (OIDC - no token secret) and drafts the GitHub release notes.

## Credits & license

MIT. Vue DevTools itself is built by [webfansplz](https://github.com/webfansplz) and the
[vuejs/devtools](https://github.com/vuejs/devtools) contributors - this project consumes its
published packages and prebuilt assets, and ports the thin Vite glue to Rspack. Portions of
`vite-plugin-vue-inspector` (also MIT) are vendored for the component picker.
