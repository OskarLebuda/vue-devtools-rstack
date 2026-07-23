/**
 * Server-side RPC functions consumed by the DevTools client over the "vite"
 * channel. Mirrors upstream vuejs/devtools packages/vite/src/rpc/index.ts —
 * the function names and shapes are the client's API contract.
 */
export interface RpcFunctionCtx {
  /** Project root (absolute). */
  root: string
  /** Dev-server base path, normalized. */
  base: string
  /** Absolute public dir, or '' when disabled. */
  publicDir: string
}

export function getRpcFunctions(ctx: RpcFunctionCtx): Record<string, (...args: any[]) => any> {
  return {
    heartbeat() {
      return true
    },
    getRoot() {
      return ctx.root
    },
  }
}
