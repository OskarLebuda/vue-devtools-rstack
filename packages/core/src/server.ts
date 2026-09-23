import type { HubInstance } from '@devframes/hub/initiate'
import type { IncomingMessage, Server as HttpServer, ServerResponse } from 'node:http'
import type { Http2SecureServer } from 'node:http2'
import type { ResolvedVueDevToolsOptions } from './options'
import fs from 'node:fs'
import { initHub } from '@devframes/hub/initiate'
import { createUi } from '@devframes/hub-ui'
import { defineRpcFunction } from 'devframe'
import { launchEditor } from 'devframe/utils/launch-editor'
import { relative, resolve } from 'pathe'
import sirv from 'sirv'
import { BOOTSTRAP_FILE, getAssetsBase, getClientBase, getHubBase, resolveClientDir } from './paths'

export type ConnectMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void

export interface DevtoolsServerOptions {
  base: string
  root: string
  options: ResolvedVueDevToolsOptions
  /** Node HTTP server, when reachable - carries the RPC WebSocket. */
  httpServer?: HttpServer | Http2SecureServer | null
  /** Force the SSE transport (used when no upgrade access is available). */
  forceSse?: boolean
}

export interface DevtoolsServer {
  /** Handles every devtools route; passes anything else to `next`. */
  middleware: ConnectMiddleware
  hub: HubInstance
  close: () => Promise<void>
}

/** Same id as vite-plugin-vue-devtools, so client-side lookups line up. */
const DOCK_ENTRY_ID = 'vue-devtools'

/**
 * Stands up the Vue DevTools v9 dev-server surface on a devframe hub - the
 * host that Vite DevTools provides under Vite:
 *
 * - `${base}__devtools/`: the hub (floating dock, standalone viewer,
 *   `__connection.json`, RPC over WebSocket or SSE)
 * - `${base}__devtools__/`: the Vue DevTools client SPA, as a dock entry
 * - `${base}__vue-devtools__/bootstrap.js`: our in-page bootstrap
 *
 * The dock registration mirrors vite-plugin-vue-devtools's
 * `devtools.setup(ctx)`; the open-in-editor RPC mirrors the one
 * `@vitejs/devtools` ships as `vite:core:open-in-editor`.
 */
export function createDevtoolsServer(opts: DevtoolsServerOptions): DevtoolsServer {
  const { base, root, options } = opts
  const clientDir = resolveClientDir()
  const hubBase = getHubBase(base)
  const clientBase = getClientBase(base)
  const forceSse = opts.forceSse || process.env.VUE_DEVTOOLS_RSPACK_FORCE_SSE === '1'
  const httpServer = forceSse ? undefined : opts.httpServer ?? undefined

  const hub = initHub({
    name: 'vue-devtools-rstack',
    base: hubBase,
    cwd: root,
    ui: createUi({
      embeddedVisibility: options.embeddedVisibility,
      dockPreferences: options.dockPreferences,
    }),
    // devframe only needs the `upgrade` event, which an HTTP/2 server with
    // HTTP/1 fallback emits as well.
    ...httpServer ? { server: httpServer as HttpServer } : { ws: false },
    // The dev server is the trust boundary, as it is for the rest of the app:
    // the socket only accepts loopback (or explicitly allowed) origins, and
    // open-in-editor refuses paths outside the project root.
    auth: false,
    mcp: false,
    register: false,
    ...options.allowedOrigins.length ? { allowedOrigins: options.allowedOrigins } : {},
    configure(ctx) {
      ctx.docks.register({
        id: DOCK_ENTRY_ID,
        title: 'Vue DevTools',
        category: 'framework',
        icon: 'logos:vue',
        type: 'iframe',
        url: clientBase,
        frameId: DOCK_ENTRY_ID,
        clientScript: { importFrom: `${clientBase}dock-client.js` },
      })
      ctx.rpc.register(defineRpcFunction({
        name: 'vite:core:open-in-editor',
        type: 'action',
        jsonSerializable: true,
        setup: context => ({
          handler: async (path: string) => {
            // vue-loader emits `__file` relative to the project root, Vite
            // emits it absolute; the workspace root bounds both.
            const resolved = resolve(root, path)
            const rel = relative(context.workspaceRoot, resolved)
            if (rel.startsWith('..') || rel.includes('\0'))
              throw new Error(`[vue-devtools-rstack] Refusing to open a file outside the project root: ${path}`)
            launchEditor(resolved, options.launchEditor)
          },
        }),
      }))
    },
  })

  const assetsBase = getAssetsBase(base)
  const connectionMetaPath = `${clientBase}__connection.json`
  // The hub only routes requests under its own base, so the client SPA -
  // which keeps upstream's `__devtools__` mount - is served here.
  const serveClient = sirv(clientDir, { dev: true, single: true })

  const middleware: ConnectMiddleware = (req, res, next) => {
    const pathname = (req.url ?? '').split('?')[0] ?? ''

    if (pathname === `${assetsBase}bootstrap.js`) {
      fs.readFile(BOOTSTRAP_FILE, (err, content) => {
        if (err)
          return next(err)
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/javascript')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(content)
      })
      return
    }

    // The client SPA looks for its connection next to itself when it is
    // opened as a standalone window rather than inside the dock.
    if (pathname === connectionMetaPath) {
      hub.ready.then(() => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(hub.connectionMeta()))
      }, next)
      return
    }

    if (pathname.startsWith(hubBase) || pathname === hubBase.slice(0, -1))
      return hub.nodeMiddleware(req, res, next)

    if (pathname.startsWith(clientBase)) {
      const url = req.url!
      req.url = url.slice(clientBase.length - 1)
      return serveClient(req, res, () => {
        req.url = url
        next()
      })
    }

    next()
  }

  return {
    middleware,
    hub,
    close: () => hub.close(),
  }
}
