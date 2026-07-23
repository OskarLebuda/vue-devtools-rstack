import process from 'node:process'
import { defineConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import { pluginVueDevTools } from 'rsbuild-plugin-vue-devtools'

// Escape hatches used by the e2e suite to exercise plugin variants.
const disabled = process.env.VUE_DEVTOOLS_DISABLE === '1'
const distPath = process.env.RSBUILD_DIST_PATH

const base = process.env.PLAYGROUND_BASE || '/'

export default defineConfig({
  plugins: [pluginVue(), ...(disabled ? [] : [pluginVueDevTools()])],
  html: {
    title: 'Vue DevTools Rspack Playground',
  },
  source: {
    define: { __APP_BASE__: JSON.stringify(base) },
  },
  server: {
    port: Number(process.env.PLAYGROUND_PORT) || 3333,
    base: process.env.PLAYGROUND_BASE || undefined,
  },
  ...(distPath ? { output: { distPath: { root: distPath } } } : {}),
})
