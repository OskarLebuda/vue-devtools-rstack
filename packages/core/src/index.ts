export { BOOTSTRAP_FILE, type DevtoolsDirs, resolveDevtoolsDirs } from './dirs'
export { type BootstrapScriptTag, getBootstrapScriptTag, getBootstrapUrl } from './html'
export { type ConnectMiddleware, createClientMiddleware } from './middlewares/client'
export { createOpenInEditorMiddleware } from './middlewares/open-in-editor'
export { createOverlayAssetsMiddleware } from './middlewares/overlay-assets'
export {
  normalizeBase,
  type ResolvedVueDevToolsOptions,
  resolveVueDevToolsOptions,
  type VueDevToolsOptions,
} from './options'
