<picture>
  <img alt="Vue DevTools for Rspack & Rsbuild" src="https://raw.githubusercontent.com/OskarLebuda/vue-devtools-rstack/refs/heads/main/.github/assets/banner.png">
</picture>

# @vue-devtools-rstack/rsbuild

[Vue DevTools](https://devtools.vuejs.org) for [Rsbuild](https://rsbuild.rs) - feature parity with
`vite-plugin-vue-devtools`.

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

The DevTools dock appears in your app during `rsbuild dev`; the standalone viewer is served at
`/__devtools/`. Production builds are untouched.

## Options

```ts
pluginVueDevTools({
  // Install Vue DevTools and register its dock entry.
  enabled: true,

  // Import the devtools from matching modules instead of injecting a <script>
  // tag - for apps without an HTML entry.
  appendTo: undefined,

  // Editor launched by open-in-editor requests.
  launchEditor: process.env.LAUNCH_EDITOR,

  // Floating dock: initial visibility and dock-bar preferences.
  embeddedVisibility: 'normal',
  dockPreferences: undefined,

  // Origins allowed on the DevTools socket besides loopback (LAN, tunnels).
  allowedOrigins: [],
})
```

Everything is scoped to `rsbuild dev`. The dev-server base path (`server.base`) is honoured by all
mounted endpoints.

See the [project README](https://github.com/OskarLebuda/vue-devtools-rstack#readme) for how it works
and the feature-parity matrix.

MIT. Consumes the prebuilt Vue DevTools client from `vite-plugin-vue-devtools` (MIT, © webfansplz
and the vuejs/devtools contributors).
