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

The overlay appears in your app during `rsbuild dev`; the panel is also served standalone at
`/__devtools__/`. Production builds are untouched.

## Options

```ts
pluginVueDevTools({
  // Click-to-source component picker. Pass an options object to configure the
  // vendored vue-inspector overlay.
  componentInspector: true,

  // Editor launched by open-in-editor requests.
  launchEditor: process.env.LAUNCH_EDITOR ?? 'code',

  // Import the overlay from a matching module instead of injecting a <script>
  // tag - for apps without an HTML entry.
  appendTo: '',
})
```

Everything is scoped to `rsbuild dev`. The dev-server base path (`server.base`) is honoured by all
mounted endpoints.

See the [project README](https://github.com/olebuda/rspack-vue-devtools#readme) for how it works
and the feature-parity matrix.

MIT. Consumes the prebuilt Vue DevTools client from `vite-plugin-vue-devtools` (MIT, © webfansplz
and the vuejs/devtools contributors).
