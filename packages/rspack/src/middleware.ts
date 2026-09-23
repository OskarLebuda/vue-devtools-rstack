import type { Server as HttpServer } from 'node:http'
import type { Http2SecureServer } from 'node:http2'
import type {
  ConnectMiddleware,
  DevtoolsServer,
  VueDevToolsOptions,
} from '@vue-devtools-rstack/core'
import process from 'node:process'
import {
  createDevtoolsServer,
  getHubBase,
  normalizeBase,
  resolveVueDevToolsOptions,
} from '@vue-devtools-rstack/core'
import { bold, cyan, green } from 'kolorist'

export interface DevtoolsMiddlewareOptions extends VueDevToolsOptions {
  /** Dev-server base path. @default '/' */
  base?: string
  /** Project root; open-in-editor refuses files outside it. @default process.cwd() */
  root?: string
}

export interface DevtoolsMiddlewareSetup {
  /** Middleware entries for `devServer.setupMiddlewares`. */
  middlewares: { name: string, middleware: ConnectMiddleware }[]
  /** Call from `devServer.setupMiddlewares` to enable the WebSocket. */
  attach: (httpServer: HttpServer | Http2SecureServer | null | undefined) => void
  close: () => Promise<void>
}

/**
 * Dev-server half of the Vue DevTools integration for raw Rspack setups.
 *
 * ```js
 * const devtools = createDevtoolsMiddlewares()
 *
 * module.exports = {
 *   plugins: [new VueDevToolsRspackPlugin()],
 *   devServer: {
 *     setupMiddlewares: (middlewares, devServer) => {
 *       devtools.attach(devServer.server)
 *       middlewares.unshift(...devtools.middlewares)
 *       return middlewares
 *     },
 *   },
 * }
 * ```
 */
export function createDevtoolsMiddlewares(
  options: DevtoolsMiddlewareOptions = {},
): DevtoolsMiddlewareSetup {
  const resolved = resolveVueDevToolsOptions(options)
  const base = normalizeBase(options.base)
  const root = options.root ?? process.cwd()

  let server: DevtoolsServer | undefined
  let httpServer: HttpServer | Http2SecureServer | null | undefined

  const start = (): DevtoolsServer => {
    server ??= createDevtoolsServer({ base, root, options: resolved, httpServer })
    return server
  }

  return {
    get middlewares() {
      if (!resolved.enabled)
        return []
      return [{ name: 'vue-devtools', middleware: start().middleware }]
    },
    attach(server_) {
      httpServer = server_
      // Attaching must happen before the middlewares are materialized so the
      // WebSocket transport is chosen over the SSE fallback.
      if (resolved.enabled)
        start()
    },
    async close() {
      await server?.close()
      server = undefined
    },
  }
}

/** Prints the DevTools banner, mirroring the rsbuild plugin's output. */
export function printDevtoolsBanner(port: number, base = '/'): void {
  const url = `http://localhost:${port}${getHubBase(normalizeBase(base))}`
  // eslint-disable-next-line no-console
  console.log(`  ${green('➜')}  ${bold('Vue DevTools')}: Open ${cyan(url)} as a separate window`)
}
