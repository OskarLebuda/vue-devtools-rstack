# @vue-devtools-rspack/core

Shared server-side logic behind [`rsbuild-plugin-vue-devtools`](https://www.npmjs.com/package/rsbuild-plugin-vue-devtools)
and [`rspack-plugin-vue-devtools`](https://www.npmjs.com/package/rspack-plugin-vue-devtools).

You normally don't depend on this directly — install one of the plugins above.

It provides:

- `createDevtoolsServer()` — mounts every dev-server endpoint (DevTools client SPA, overlay assets,
  `@vite/client` shim, WebSocket/SSE transports, open-in-editor) and brings the RPC channel up.
- `GraphCollector` — turns Rspack compilation stats into the module list the graph tab renders.
- The prebundled overlay bootstrap (`dist/overlay-bootstrap.js`) served into the host page.
- The vendored component-inspector loader (`./inspector-loader`) and runtime (`./inspector-runtime`).

MIT. See the [project README](https://github.com/olebuda/rspack-vue-devtools#readme).
