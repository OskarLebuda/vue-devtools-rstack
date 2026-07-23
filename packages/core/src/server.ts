import type { Server as HttpServer } from 'node:http'
import type { Http2SecureServer } from 'node:http2'
import type { ConnectMiddleware } from './middlewares/client'
import type { ResolvedVueDevToolsOptions } from './options'
import type { RpcFunctionCtx } from './rpc'
import type { DevtoolsHotChannel } from './transport/types'
import { createViteServerRpc } from '@vue/devtools-core'
import { setViteServerContext } from '@vue/devtools-kit'
import { GraphCollector } from './graph/collector'
import { resolveDevtoolsDirs } from './dirs'
import { createClientMiddleware } from './middlewares/client'
import { createOpenInEditorMiddleware } from './middlewares/open-in-editor'
import { createOverlayAssetsMiddleware } from './middlewares/overlay-assets'
import { createViteClientShimMiddleware } from './middlewares/vite-client-shim'
import { getRpcFunctions } from './rpc'
import { createAssetsWatcher } from './rpc/assets'
import { createSseTransport } from './transport/sse'
import { createFakeViteServer } from './transport/types'
import { createWsTransport } from './transport/ws'

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

export interface DevtoolsServerOptions {
  base: string
  root: string
  publicDir: string
  distPath?: string
  options: ResolvedVueDevToolsOptions
  collector?: GraphCollector
  /** Registers a connect-style middleware under `path`. */
  use: (path: string, middleware: ConnectMiddleware) => void
  /** Node HTTP server, when reachable - enables the WebSocket transport. */
  httpServer?: HttpServer | Http2SecureServer | null
  /** Force the SSE transport (used when no upgrade access is available). */
  forceSse?: boolean
}

export interface DevtoolsServer {
  collector: GraphCollector
  close: () => void
}

/**
 * Mounts every devtools dev-server endpoint and brings the RPC channel up.
 * Shared by the rsbuild plugin and the raw rspack dev-server helpers.
 */
export function createDevtoolsServer(opts: DevtoolsServerOptions): DevtoolsServer {
  const { base, use } = opts
  const dirs = resolveDevtoolsDirs()
  const collector = opts.collector ?? new GraphCollector()
  const forceSse = opts.forceSse || process.env.VUE_DEVTOOLS_RSPACK_FORCE_SSE === '1'

  // -- static serving ------------------------------------------------------
  use(`${base}__devtools__`, createClientMiddleware(dirs.clientDir))
  use(`${base}__vue-devtools__`, createOverlayAssetsMiddleware(dirs.overlayDir))
  use(`${base}__open-in-editor`, createOpenInEditorMiddleware(opts.options.launchEditor))

  // -- channel B: transports + vite-hot-client shim -------------------------
  const sse = createSseTransport()
  const ws = createWsTransport(`${base}__vue-devtools-ws__`)

  const useWs = !forceSse && !!opts.httpServer
  if (useWs)
    ws.attach(opts.httpServer!)

  // The shim tries WS first and falls back to SSE by itself; when WS is
  // unavailable (middlewareMode) or forced off, it goes straight to SSE.
  use(`${base}@vite/client`, createViteClientShimMiddleware(base, !useWs))
  use(`${base}__vue-devtools-sse__`, sse.streamMiddleware)
  use(`${base}__vue-devtools-send__`, sse.sendMiddleware)

  setupDevtoolsRpc(combineChannels(ws.channel, sse.channel), {
    root: opts.root,
    base,
    publicDir: opts.publicDir,
    collector,
  })

  const stopWatcher = createAssetsWatcher(opts.root, opts.distPath ? [opts.distPath] : [])

  return {
    collector,
    close() {
      stopWatcher()
      ws.close()
      sse.close()
    },
  }
}
