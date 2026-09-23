# Compatibility & upgrade procedure

## Version matrix

| This project | Vue DevTools upstream | Notes |
| --- | --- | --- |
| 0.1.x | `vite-plugin-vue-devtools@8.1.5`, `@vue/devtools-{core,kit,shared}@8.1.5` | Verified against Rsbuild 2.1.x, Rspack 2.1.x, `@rspack/dev-server` 2.1.x, Vue 3.5, vue-router 5, pinia 4, TypeScript 7. |
| next | `vite-plugin-vue-devtools@9.0.0-beta.0`, `devframe@1.0.0`, `@devframes/hub@1.0.0`, `@devframes/hub-ui@1.0.0` | Same toolchain as above. |

`vite-plugin-vue-devtools` is pinned **exactly**. It is not used as a plugin - it is the donor of
the prebuilt client SPA (`client/`, including `dock-client.js`) and of the in-page installer
(`vite-plugin-vue-devtools/client`) we bundle into the bootstrap. The two must speak the same
`@vue/devtools-kit` protocol, which upstream pins exactly. The devframe packages are pinned exactly
too: the embedded dock, the hub server and the client SPA's devframe RPC client have to agree.

`vite-plugin-vue-devtools@9` declares `vite@^8.3` and `@vitejs/devtools` as peers. Package managers
that auto-install peers will pull them in; nothing here imports them at runtime.

## Architecture (v9)

Vue DevTools v9 no longer ships its own overlay or server RPC. Under Vite, the page runs the
`virtual:vue-devtools-client` module (devtools hook + an in-page RPC host), the client SPA talks to
it over `postMessage` from inside an iframe, and Vite DevTools supplies the dock around that iframe
plus a devframe RPC server (used by the SPA only for `vite:core:open-in-editor`).

Vite DevTools is itself a branded [devframe](https://devfra.me) hub, and the hub is
framework-agnostic, so we host one directly:

| Route | Served by | Vite equivalent |
| --- | --- | --- |
| `${base}__vue-devtools__/bootstrap.js` | `packages/core/client/` (prebundled) | `virtual:vue-devtools-client` + Vite DevTools' `embedded.js` injection |
| `${base}__devtools/` | `initHub()` from `@devframes/hub` with `createUi()` from `@devframes/hub-ui`: dock (`embedded.js`), standalone viewer, `__connection.json`, WebSocket (`__ws`) / SSE (`__sse`) RPC | `@vitejs/devtools` |
| `${base}__devtools__/` | `sirv` over the client SPA | `ctx.views.hostStatic` in vite-plugin-vue-devtools |

The dock entry registration in `packages/core/src/server.ts` is a copy of vite-plugin-vue-devtools's
`devtools.setup(ctx)`, and the open-in-editor RPC mirrors `@vitejs/devtools`'s built-in one. The
client SPA is served outside the hub because the hub only routes requests under its own base.

## Toolchain

Packages are built with [Rslib](https://rslib.rs) (`rslib.config.ts` per package) and linted with
[Rslint](https://github.com/web-infra-dev/rslint) (`rslint.config.mjs` at the root). Declarations
are bundled via `dts: { bundle: true }`, which needs `@microsoft/api-extractor`.

`pnpm lint` runs Rslint with `--type-check`, so linting and type checking are a single pass -
there is no separate `tsc` step. `parserOptions.project` lists every tsconfig in the workspace,
which means the e2e specs and the playgrounds are type-checked too; the previous per-package
`tsc` script only covered `packages/*`. Type errors are reported with their usual TypeScript
codes (verified against `tsc` on a seeded `TS2322`). `pnpm build` remains a second line of
defence: emitting declarations runs the TypeScript compiler over the package sources, so a type
error there fails the build as well.

Dependencies are kept at their latest releases, with one deliberate exception: the Vue DevTools
packages are pinned exactly (see above). TypeScript 7 (the native `tsgo` compiler) requires an
explicit `rootDir` in each package's `tsconfig.json` when emitting declarations, otherwise dts
generation fails with `TS5011`. `@microsoft/api-extractor` still peers on TypeScript 5, so a 5.x
copy appears transitively in the lockfile - that is its own compiler-API dependency and does not
affect what our packages are checked or built with.

One Rslib quirk is worth knowing about: it deliberately leaves `process.env.NODE_ENV` for the
consumer's bundler, and neither `source.define` nor `optimization.nodeEnv` reaches the bundled
`node_modules` in a library build. The v8 bootstrap needed a `BannerPlugin` shim for that; the v9
bootstrap has no `process` references, so the shim is gone. If a future upstream bump brings
`process.env` back into the bundled code, the bootstrap will throw `ReferenceError: process is
not defined` on load - check `dist/bootstrap.js`.

## Module format

All packages are **ESM only**; no CommonJS build is produced. Node 20.19+ / 22.12+ is required,
which is where `require(esm)` is available - so consumers with a CommonJS `rspack.config.js` can
still `require()` these packages.

This extends to the `appendTo` Rspack loader (`append-loader.mjs`), a plain ESM
module with a default export, which Rspack accepts (no e2e leg covers `appendTo` yet). Package
paths are resolved with `import.meta.resolve` rather than `createRequire`.

## Verified environment findings

- **Rsbuild exposes the Node HTTP server.** `onBeforeStartDevServer({ server })` gives
  `server.httpServer` (`http.Server | Http2SecureServer | null`, null only in `middlewareMode`).
  It is handed to `initHub({ server })`, which attaches to its `'upgrade'` event scoped to
  `${base}__devtools/__ws`, so Rsbuild's own HMR socket is untouched.
- **`@rspack/dev-server` exposes it as `devServer.server`** inside `setupMiddlewares`.
- **SSE fallback** (`${base}__devtools/__sse`) is used automatically when no HTTP server is
  reachable, and can be forced with `VUE_DEVTOOLS_RSPACK_FORCE_SSE=1`. `__connection.json` then
  advertises `backend: 'sse'`. Covered by `e2e/tests-variants/sse-fallback.spec.ts`.
- **The client SPA finds its connection** through the `__DEVFRAME_CONNECTION__` global that the
  dock sets on the parent window, falling back to `./__connection.json`. We serve the hub's
  metadata at `${base}__devtools__/__connection.json` too, for the SPA opened as its own window.
- **Auth is off** (`auth: false`). Vite DevTools gates clients behind a one-time code by default;
  the hub here only accepts loopback origins on its socket (plus `allowedOrigins`), and the only
  server capability, open-in-editor, refuses paths outside the workspace root.
- **`__file` is project-relative under vue-loader** (absolute under Vite), so open-in-editor
  resolves relative paths against the project root, not devframe's workspace root.

## Deviations from upstream

- **The dock is devframe's reference UI, unbranded**, rather than the Vite DevTools-branded one,
  and it has no other entries (Vite, Rolldown, terminals...) - only Vue DevTools and settings.
- **Removed in v9 upstream, removed here:** the `componentInspector` option (component picking is
  built into the client SPA and passing the option now logs a warning), and the assets, module graph
  and Vite Inspect tabs, together with the Rspack stats collector and assets watcher that fed them.
- **`launchEditor` is kept.** Upstream dropped it because Vite DevTools owns open-in-editor now;
  here we own it, so the option still picks the editor.
- **`embeddedVisibility`, `dockPreferences` and `allowedOrigins`** are top-level plugin options.
  Under Vite they are Vite DevTools settings (`devtools: { ... }`).

## Upgrade procedure

When bumping the pinned upstream version:

1. Bump `vite-plugin-vue-devtools` together with `devframe`, `@devframes/hub` and
   `@devframes/hub-ui` in `packages/core/package.json` (use the versions `@vitejs/devtools`
   depends on).
2. Re-diff these upstream sources and mirror any changes:
   - `packages/vite/src/utils/dock/registration.ts` (dock entry) → `packages/core/src/server.ts`
   - `packages/vite/src/client-injection.ts` (client module, `appendTo`) → `packages/core/client/install.ts`, `append-loader.mjs`
   - `@vitejs/devtools` `src/node/rpc/index.ts` (`vite:core:open-in-editor`) → `packages/core/src/server.ts`
   - `@vitejs/devtools` `src/node/plugins/injection.ts` (dock injection) → `packages/core/client/install.ts`
3. Check that the client SPA still only calls `vite:core:open-in-editor` on the server:
   `grep -ohE 'vite:[a-z:-]+' packages/core/node_modules/vite-plugin-vue-devtools/client/assets/*.js | sort -u`
   should list only `vite:core:open-in-editor` (plus `vite:preload`, from Vite's own `vite:preloadError` event).
4. Run the full e2e suite: `pnpm e2e` (rsbuild, raw rspack, variant and build legs).
5. Update the version matrix above.

A canary CI leg installs `vite-plugin-vue-devtools@beta` (switch to `@latest` once v9 is stable)
and runs the suite as allowed-to-fail, so breakage surfaces before a user hits it.
