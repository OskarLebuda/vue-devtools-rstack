/**
 * Server-side RPC functions consumed by the DevTools client over the "vite"
 * channel. Mirrors upstream vuejs/devtools packages/vite/src/rpc/index.ts -
 * the function names and shapes are the client's API contract.
 */
import type { RpcFunctionCtx, RpcFunctions } from './types'
import { getAssetsFunctions } from './assets'
import { getGraphFunctions } from './graph'

export type { RpcFunction, RpcFunctionCtx, RpcFunctions } from './types'

export function getRpcFunctions(ctx: RpcFunctionCtx): RpcFunctions {
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
