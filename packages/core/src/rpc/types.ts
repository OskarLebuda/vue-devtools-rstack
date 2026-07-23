import type { GraphCollector } from '../graph/collector'

export interface RpcFunctionCtx {
  /** Project root (absolute). */
  root: string
  /** Dev-server base path, normalized with leading + trailing slash. */
  base: string
  /** Absolute public dir, or '' when disabled. */
  publicDir: string
  /** Module graph collected from rspack stats (graph tab, asset importers). */
  collector?: GraphCollector
}
