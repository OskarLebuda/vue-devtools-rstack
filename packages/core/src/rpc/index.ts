/**
 * Server-side RPC functions consumed by the DevTools client over the "vite"
 * channel. Mirrors upstream vuejs/devtools packages/vite/src/rpc/index.ts —
 * the function names and shapes are the client's API contract.
 */
import type { RpcFunctionCtx } from './types'
import { getAssetsFunctions } from './assets'
import { getGraphFunctions } from './graph'

export type { RpcFunctionCtx } from './types'

export function getRpcFunctions(ctx: RpcFunctionCtx): Record<string, (...args: any[]) => any> {
  return {
    heartbeat() {
      return true
    },
    getRoot() {
      return ctx.root
    },
    ...getAssetsFunctions(ctx),
    ...getGraphFunctions(ctx),
  }
}
