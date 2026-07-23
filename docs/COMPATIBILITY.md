# Compatibility & upgrade procedure

## Version matrix

| This project | Vue DevTools upstream | Notes |
| --- | --- | --- |
| 0.1.x | `vite-plugin-vue-devtools@8.1.5`, `@vue/devtools-{core,kit,shared}@8.1.5` | Verified against Rsbuild 2.1.x, Rspack 2.1.x, `@rspack/dev-server` 2.1.x, Vue 3.5, vue-router 5, pinia 4. |

`vite-plugin-vue-devtools` is pinned **exactly**. It is not used as a plugin - it is the donor of
the prebuilt client SPA (`client/`) and overlay bundle (`overlay/devtools-overlay.mjs` + `.css`),
which must stay in lockstep with the `@vue/devtools-kit` protocol version we bundle into the
overlay bootstrap.

## Module format

All packages are **ESM only**; no CommonJS build is produced. Node 20.19+ / 22.12+ is required,
which is where `require(esm)` is available - so consumers with a CommonJS `rspack.config.js` can
still `require()` these packages.

This extends to the Rspack loaders (`loader.mjs`, `append-loader.mjs`), which are plain ESM
modules with a default export - Rspack accepts them, covered by the `tests-rspack` leg. Package
paths are resolved with `import.meta.resolve` rather than `createRequire`.

## Verified environment findings

- **Rsbuild exposes the Node HTTP server.** `onBeforeStartDevServer({ server })` gives
  `server.httpServer` (`http.Server | Http2SecureServer | null`, null only in `middlewareMode`).
  The WebSocket transport attaches to its `'upgrade'` event, scoped to the
  `${base}__vue-devtools-ws__` pathname so Rsbuild's own HMR socket is untouched.
- **`@rspack/dev-server` exposes it as `devServer.server`** inside `setupMiddlewares`.
- **SSE fallback** (`${base}__vue-devtools-sse__` + `${base}__vue-devtools-send__`) is used
  automatically when no HTTP server is reachable, and can be forced with
  `VUE_DEVTOOLS_RSPACK_FORCE_SSE=1`. Covered by `e2e/tests-variants/sse-fallback.spec.ts`.
- **`vite-hot-client` contract** (bundled inside the pinned client SPA): it fetches
  `${base}@vite/client`, rejects the response unless the content type contains `javascript` and the
  body does not start with `<`, then imports it and calls the exported `createHotContext(path)`,
  which must **synchronously** return `{ on(event, cb), send(event, data) }`.
- **`@vue/devtools-kit` server contract**: `setViteServerContext(ctx)` only ever reads
  `ctx.hot ?? ctx.ws` and calls `.send(event, payload)` / `.on(event, cb)`. Payloads are SuperJSON
  **strings** and must reach `on` handlers verbatim. Event key:
  `__devtools-kit-vite-messaging-event-key__`.

## Deviations from upstream

- **Vite Inspect tab is absent.** Upstream adds it via `addCustomTab` as an iframe onto
  `vite-plugin-inspect`'s UI. There is no Rspack equivalent; the module graph tab covers the same
  need.
- **Component picker is vendored, not delegated.** `unplugin-vue-inspector@3.0.0` turned out to be
  a thin `createUnplugin` wrapper that only populates the `vite` hook - it has no working
  webpack/rspack path. We therefore vendor the template transform from
  `vite-plugin-vue-inspector@6.0.0` (`packages/core/src/inspector/transform.ts`) as an
  `enforce: 'pre'` Rspack loader, and its `Overlay.vue` runtime
  (`packages/core/inspector-runtime/`). Two vendoring changes are marked in the source:
  the Vue 2 mounting branch is dropped (Rspack's strict ESM linking rejects `Vue.default` against
  Vue 3), and `openInEditor` resolves its URL against `window.location.href` instead of
  `import.meta.url`. JSX/TSX source locations are not yet ported (templates only).
- **`/__open-in-editor` is always ours.** Upstream gets it from `vite-plugin-vue-inspector`'s
  dev-server middleware; we mount `launch-editor-middleware` directly.
- **Graph data comes from Rspack stats**, not `vite-plugin-inspect`. Node ids are absolute resource
  paths (`module.nameForCondition`, falling back to the segment of `identifier` after the last
  `!`), `.vue?vue&type=…` sub-requests collapse into the parent SFC, and forward `deps` are built
  by inverting `reasons[]`. See `packages/core/src/graph/collector.ts`.
- **Assets watcher is our own chokidar instance** rather than `server.watcher`.

## Known behavioral notes

- The assets tab initializes its extension filter once (upstream `watchOnce`). A file added later
  with an extension that was not present at load time stays hidden until the tab is remounted -
  identical behavior under Vite.

## Upgrade procedure

When bumping the pinned upstream version:

1. Bump `vite-plugin-vue-devtools` and `@vue/devtools-{core,kit,shared}` together in
   `packages/core/package.json`.
2. Re-diff these upstream files and mirror any changes:
   - `packages/vite/src/overlay.js` → `packages/core/overlay/init.ts`
   - `packages/vite/src/vite.ts` (`configureServer`, `transformIndexHtml`) → `packages/core/src/server.ts`, `html.ts`
   - `packages/vite/src/rpc/{index,assets,graph,get-config}.ts` → `packages/core/src/rpc/*`
   - `packages/devtools-kit/src/messaging/presets/vite/*` → `packages/core/src/transport/*`
   - `packages/client/src/main.ts` (hot-context acquisition) → `packages/core/src/middlewares/vite-client-shim.ts`
3. Run the full e2e suite: `pnpm e2e` (rsbuild, raw rspack, and variant legs).
4. Update the version matrix above.

A canary CI leg installs `vite-plugin-vue-devtools@latest` and runs the suite as
allowed-to-fail, so breakage surfaces before a user hits it.
