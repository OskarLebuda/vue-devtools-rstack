import type { RsbuildPlugin } from '@rsbuild/core'
import type { VueDevToolsOptions } from '@vue-devtools-rspack/core'
import {
  combineChannels,
  createAssetsWatcher,
  createClientMiddleware,
  createOpenInEditorMiddleware,
  createOverlayAssetsMiddleware,
  createSseTransport,
  createViteClientShimMiddleware,
  createWsTransport,
  getBootstrapScriptTag,
  GraphCollector,
  normalizeBase,
  resolveDevtoolsDirs,
  resolveVueDevToolsOptions,
  setupDevtoolsRpc,
} from '@vue-devtools-rspack/core'
import { isAbsolute, join } from 'node:path'
import { bold, cyan, green } from 'kolorist'

export type { VueDevToolsOptions }

export function pluginVueDevTools(options: VueDevToolsOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:vue-devtools',

    setup(api) {
      const resolved = resolveVueDevToolsOptions(options)

      const isDev = () => api.context.action === 'dev'
      const getBase = () => normalizeBase(api.getNormalizedConfig().server.base)

      api.modifyHTMLTags(({ headTags, bodyTags }) => {
        if (!isDev() || resolved.appendTo)
          return { headTags, bodyTags }
        headTags.unshift(getBootstrapScriptTag(getBase(), resolved))
        return { headTags, bodyTags }
      })

      const closers: (() => void)[] = []
      const collector = new GraphCollector()

      api.onAfterDevCompile(({ stats }) => {
        collector.handleStatsJson(
          stats.toJson({
            all: false,
            modules: true,
            reasons: true,
            ids: true,
            cachedModules: true,
          }),
        )
      })

      const resolvePublicDir = (): string => {
        const publicDir = api.getNormalizedConfig().server.publicDir
        if (!publicDir)
          return ''
        const first = Array.isArray(publicDir) ? publicDir[0] : publicDir
        const name = (first && typeof first === 'object' ? first.name : undefined) ?? 'public'
        return isAbsolute(name) ? name : join(api.context.rootPath, name)
      }

      api.onBeforeStartDevServer(({ server }) => {
        const base = getBase()
        const dirs = resolveDevtoolsDirs()
        const forceSse = process.env.VUE_DEVTOOLS_RSPACK_FORCE_SSE === '1'

        // -- static serving ------------------------------------------------
        server.middlewares.use(`${base}__devtools__`, createClientMiddleware(dirs.clientDir))
        server.middlewares.use(
          `${base}__vue-devtools__`,
          createOverlayAssetsMiddleware(dirs.overlayDir),
        )
        server.middlewares.use(
          `${base}__open-in-editor`,
          createOpenInEditorMiddleware(resolved.launchEditor),
        )

        // -- channel B: transports + vite-hot-client shim --------------------
        const sse = createSseTransport()
        const ws = createWsTransport(`${base}__vue-devtools-ws__`)
        closers.push(() => sse.close(), () => ws.close())

        if (!forceSse && server.httpServer) {
          // Scoped to our pathname; the HMR socket's upgrades are untouched.
          ws.attach(server.httpServer)
        }
        // The shim tries WS first and falls back to SSE by itself; when WS is
        // unavailable (middlewareMode) or forced off, it goes straight to SSE.
        server.middlewares.use(
          `${base}@vite/client`,
          createViteClientShimMiddleware(base, forceSse || !server.httpServer),
        )
        server.middlewares.use(`${base}__vue-devtools-sse__`, sse.streamMiddleware)
        server.middlewares.use(`${base}__vue-devtools-send__`, sse.sendMiddleware)

        setupDevtoolsRpc(combineChannels(ws.channel, sse.channel), {
          root: api.context.rootPath,
          base,
          publicDir: resolvePublicDir(),
          collector,
        })

        closers.push(
          createAssetsWatcher(api.context.rootPath, [api.context.distPath]),
        )
      })

      api.onCloseDevServer(() => {
        for (const close of closers.splice(0))
          close()
      })

      api.onAfterStartDevServer(({ port }) => {
        if (!isDev())
          return
        const base = getBase()
        const url = `http://localhost:${port}${base}__devtools__/`
        // eslint-disable-next-line no-console
        console.log(
          `  ${green('➜')}  ${bold('Vue DevTools')}: Open ${cyan(url)} as a separate window`,
        )
        // eslint-disable-next-line no-console
        console.log(
          `  ${green('➜')}  ${bold('Vue DevTools')}: Press ${cyan('Option(⌥)+Shift(⇧)+D')} in App to toggle the Vue DevTools`,
        )
      })
    },
  }
}

export default pluginVueDevTools
