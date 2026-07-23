<picture>
  <img alt="Vue DevTools for Rspack & Rsbuild" src="https://raw.githubusercontent.com/OskarLebuda/vue-devtools-rstack/refs/heads/main/.github/assets/banner.png">
</picture>

# @vue-devtools-rstack/core

Shared server-side logic behind [`@vue-devtools-rstack/rsbuild`](https://www.npmjs.com/package/@vue-devtools-rstack/rsbuild)
and [`@vue-devtools-rstack/rspack`](https://www.npmjs.com/package/@vue-devtools-rstack/rspack).

You normally don't depend on this directly - install one of the plugins above.

It provides:

- `createDevtoolsServer()` - mounts every dev-server endpoint (DevTools client SPA, overlay assets,
  `@vite/client` shim, WebSocket/SSE transports, open-in-editor) and brings the RPC channel up.
- `GraphCollector` - turns Rspack compilation stats into the module list the graph tab renders.
- The prebundled overlay bootstrap (`dist/overlay-bootstrap.js`) served into the host page.
- The vendored component-inspector loader (`./inspector-loader`) and runtime (`./inspector-runtime`).

MIT. See the [project README](https://github.com/OskarLebuda/vue-devtools-rstack#readme).
