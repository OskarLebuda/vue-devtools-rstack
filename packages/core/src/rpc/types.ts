import type { GraphCollector } from '../graph/collector'

/**
 * A function exposed over the birpc channel. Arguments and results are
 * SuperJSON-serialized, so the surface is dynamic by nature.
 */
export type RpcFunction = (...args: never[]) => unknown

export type RpcFunctions = Record<string, RpcFunction>

/**
 * `broadcast` on the kit's birpc group return is typed as the (empty) remote
 * function set; the server-push events we emit live outside that contract.
 */
export interface BroadcastEmitter {
  emit: (event: string, ...args: unknown[]) => void
}

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
