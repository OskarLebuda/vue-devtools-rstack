/**
 * Inspector options — injected at build time via DefinePlugin
 * (`__VUE_INSPECTOR_OPTIONS__`), mirroring vite-plugin-vue-inspector's
 * `virtual:vue-inspector-options` module and its defaults.
 */
const defaults = {
  vue: 3,
  enabled: false,
  toggleComboKey: '',
  toggleButtonVisibility: 'never',
  toggleButtonPos: 'top-right',
  appendTo: '',
  lazyLoad: false,
  reduceMotion: false,
  disableInspectorOnEditorOpen: false,
  base: '/',
}

// eslint-disable-next-line no-undef
const injected = typeof __VUE_INSPECTOR_OPTIONS__ !== 'undefined' ? __VUE_INSPECTOR_OPTIONS__ : {}

export default { ...defaults, ...injected }
