/**
 * Globals the DevTools integration installs in the page, as far as the e2e
 * suite drives them. Declared here so specs can reach them without casting.
 */
export interface AssetInfo {
  path: string
  relativePath: string
  publicPath: string
  filePath: string
  type: string
  size: number
  mtime: number
}

export interface ImageMeta {
  width: number
  height: number
  type?: string
}

export interface ModuleInfo {
  id: string
  deps: string[]
}

/** The birpc client for the dev-server ("vite") RPC channel. */
export interface ViteRpcClient {
  heartbeat: () => Promise<boolean>
  getRoot: () => Promise<string>
  getStaticAssets: () => Promise<AssetInfo[]>
  getImageMeta: (filepath: string) => Promise<ImageMeta | undefined>
  getTextAssetContent: (filepath: string, limit?: number) => Promise<string | undefined>
  getGraphModules: () => Promise<ModuleInfo[]>
}

/** Component-picker overlay, installed by the vendored vue-inspector runtime. */
export interface VueInspector {
  enabled: boolean
  enable: () => void
  disable: () => void
  toggleEnabled: () => void
}

declare global {
  interface Window {
    __VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__?: ViteRpcClient
    __VUE_INSPECTOR__?: VueInspector
  }
}
