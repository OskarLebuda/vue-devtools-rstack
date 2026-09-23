<picture>
  <img alt="Vue DevTools for Rspack & Rsbuild" src="https://raw.githubusercontent.com/OskarLebuda/vue-devtools-rstack/refs/heads/main/.github/assets/banner.png">
</picture>

# @vue-devtools-rstack/core

Shared server-side logic behind [`@vue-devtools-rstack/rsbuild`](https://www.npmjs.com/package/@vue-devtools-rstack/rsbuild)
and [`@vue-devtools-rstack/rspack`](https://www.npmjs.com/package/@vue-devtools-rstack/rspack).

You normally don't depend on this directly - install one of the plugins above.

It provides:

- `createDevtoolsServer()` - a single connect middleware for the dev server: a
  [devframe](https://devfra.me) hub (floating dock, standalone viewer, RPC over WebSocket or SSE,
  open-in-editor) with the Vue DevTools client SPA registered as a dock entry.
- The prebundled in-page bootstrap (`dist/bootstrap.js`), and the runtime + loader
  (`./runtime`, `./append-loader`) for `appendTo` mode.

MIT. See the [project README](https://github.com/OskarLebuda/vue-devtools-rstack#readme).
