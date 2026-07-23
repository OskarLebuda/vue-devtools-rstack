import type { Server as HttpServer } from 'node:http'
import type { Http2SecureServer } from 'node:http2'
import type {
  ConnectMiddleware,
  DevtoolsServer,
  GraphCollector,
  VueDevToolsOptions,
} from '@vue-devtools-rstack/core'
import path from 'node:path'
import process from 'node:process'
import {
  createDevtoolsServer,
  normalizeBase,
  resolveVueDevToolsOptions,
} from '@vue-devtools-rstack/core'
import { bold, cyan, green } from 'kolorist'

export interface DevtoolsMiddlewareOptions extends VueDevToolsOptions {
  /** Dev-server base path. @default '/' */
  base?: string
  /** Project root used for the assets tab. @default process.cwd() */
  root?: string
  /** Absolute public dir, or '' to disable the public-dir stripping. */
  publicDir?: string
  /** Build output dir, excluded from the assets watcher. */
  distPath?: string
  /**
   * The plugin instance, so the graph tab shares its collected module data.
   * Pass the same `VueDevToolsRspackPlugin` you added to `plugins`.
   */
  collector?: GraphCollector
}

export interface DevtoolsMiddlewareSetup {
  /** Middleware entries for `devServer.setupMiddlewares`. */
  middlewares: { name: string, path: string, middleware: ConnectMiddleware }[]
  /** Call from `devServer.options.onListening` to enable the WebSocket. */
  attach: (httpServer: HttpServer | Http2SecureServer | null | undefined) => void
  close: () => void
}

/**
 * Dev-server half of the Vue DevTools integration for raw Rspack setups.
 *
 * ```js
 * const plugin = new VueDevToolsRspackPlugin()
 * const devtools = createDevtoolsMiddlewares({ collector: plugin.collector })
 *
 * module.exports = {
 *   plugins: [plugin],
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
  const publicDir = options.publicDir ?? path.join(root, 'public')

  const middlewares: DevtoolsMiddlewareSetup['middlewares'] = []
  let server: DevtoolsServer | undefined
  let httpServer: HttpServer | Http2SecureServer | null | undefined

  const start = () => {
    server = createDevtoolsServer({
      base,
      root,
      publicDir,
      distPath: options.distPath,
      options: resolved,
      collector: options.collector,
      httpServer,
      use: (mountPath, middleware) => {
        middlewares.push({ name: `vue-devtools:${mountPath}`, path: mountPath, middleware })
      },
    })
  }

  return {
    get middlewares() {
      if (!server)
        start()
      return middlewares
    },
    attach(server_) {
      httpServer = server_
      // Attaching must happen before the middlewares are materialized so the
      // WebSocket transport is chosen over the SSE fallback.
      if (!server)
        start()
    },
    close() {
      server?.close()
      server = undefined
    },
  }
}

/** Prints the DevTools banner, mirroring the rsbuild plugin's output. */
export function printDevtoolsBanner(port: number, base = '/'): void {
  const url = `http://localhost:${port}${normalizeBase(base)}__devtools__/`
  // eslint-disable-next-line no-console
  console.log(`  ${green('➜')}  ${bold('Vue DevTools')}: Open ${cyan(url)} as a separate window`)
  // eslint-disable-next-line no-console
  console.log(
    `  ${green('➜')}  ${bold('Vue DevTools')}: Press ${cyan('Option(⌥)+Shift(⇧)+D')} in App to toggle the Vue DevTools`,
  )
}
