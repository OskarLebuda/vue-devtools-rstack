/**
 * Vendored from vite-plugin-vue-inspector@6.0.0 src/load.js (MIT, © webfansplz).
 * Compiled by the USER's bundler (imports 'vue' and an SFC), added via
 * rsbuild `source.preEntry`. Options are injected through DefinePlugin
 * (`__VUE_INSPECTOR_OPTIONS__`) instead of the vite virtual module.
 */
import { createApp, h } from 'vue'
import App from './Overlay.vue'
import inspectorOptions from './options.js'

const CONTAINER_ID = 'vue-inspector-container'

function createInspectorContainer() {
  if (document.getElementById(CONTAINER_ID) != null)
    throw new Error('vueInspectorContainer element already exists')

  const el = document.createElement('div')
  el.setAttribute('id', CONTAINER_ID)
  document.getElementsByTagName('body')[0].appendChild(el)
  return el
}

function load() {
  const isClient = typeof window !== 'undefined'
  if (!isClient)
    return
  if (window.__VUE_INSPECTOR__)
    return
  createInspectorContainer()
  // Vue 3 only - the upstream vue 2 branch (`new Vue.default(...)`) is
  // dropped: rspack's strict ESM linking rejects `Vue.default` on vue 3.
  createApp({
    render: () => h(App),
    devtools: {
      hide: true,
    },
  }).mount(`#${CONTAINER_ID}`)
}

if (inspectorOptions.lazyLoad)
  setTimeout(load, inspectorOptions.lazyLoad)
else
  load()
