import type { RpcFunctionCtx } from './rpc'
import type { DevtoolsHotChannel } from './transport/types'
import { createViteServerRpc } from '@vue/devtools-core'
import { setViteServerContext } from '@vue/devtools-kit'
import { getRpcFunctions } from './rpc'
import { createFakeViteServer } from './transport/types'

/**
 * Registers the server side of the devtools "vite" RPC channel.
 * Mirrors upstream packages/vite/src/vite.ts configureServer (lines 109–117):
 * setViteServerContext + createViteServerRpc. The kit only touches
 * `.hot.send/.hot.on` on the context object.
 */
export function setupDevtoolsRpc(
  channel: DevtoolsHotChannel,
  ctx: RpcFunctionCtx,
  extraFunctions: Record<string, (...args: any[]) => any> = {},
): void {
  setViteServerContext(createFakeViteServer(channel))
  createViteServerRpc({ ...getRpcFunctions(ctx), ...extraFunctions })
}

/** Fans out to several transports; listeners are registered on all of them. */
export function combineChannels(...channels: DevtoolsHotChannel[]): DevtoolsHotChannel {
  return {
    send(event, payload) {
      for (const channel of channels)
        channel.send(event, payload)
    },
    on(event, cb) {
      for (const channel of channels)
        channel.on(event, cb)
    },
  }
}
