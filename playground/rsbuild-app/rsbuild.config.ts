import { defineConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import { pluginVueDevTools } from 'rsbuild-plugin-vue-devtools'

export default defineConfig({
  plugins: [pluginVue(), pluginVueDevTools()],
  html: {
    title: 'Vue DevTools Rspack Playground',
  },
  server: {
    port: Number(process.env.PLAYGROUND_PORT) || 3333,
  },
})
