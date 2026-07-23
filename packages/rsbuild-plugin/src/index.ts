import type { RsbuildPlugin } from '@rsbuild/core'
import type { DevtoolsServer, VueDevToolsOptions } from '@vue-devtools-rspack/core'
import { createRequire } from 'node:module'
import { isAbsolute, join } from 'node:path'
import {
  createDevtoolsServer,
  getBootstrapScriptTag,
  GraphCollector,
  normalizeBase,
  resolveVueDevToolsOptions,
} from '@vue-devtools-rspack/core'
import { bold, cyan, green } from 'kolorist'

const require = createRequire(import.meta.url)

export type { VueDevToolsOptions }

export function pluginVueDevTools(options: VueDevToolsOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:vue-devtools',

    setup(api) {
      const resolved = resolveVueDevToolsOptions(options)
      const collector = new GraphCollector()
      let server: DevtoolsServer | undefined

      const isDev = () => api.context.action === 'dev'
      const getBase = () => normalizeBase(api.getNormalizedConfig().server.base)

      // -- overlay injection --------------------------------------------------
      api.modifyHTMLTags(({ headTags, bodyTags }) => {
        if (!isDev() || resolved.appendTo)
          return { headTags, bodyTags }
        headTags.unshift(getBootstrapScriptTag(getBase(), resolved))
        return { headTags, bodyTags }
      })

      // -- component inspector (click-to-source) ------------------------------
      if (resolved.componentInspector) {
        api.modifyRsbuildConfig((config) => {
          if (!isDev())
            return config
          const runtime = require.resolve('@vue-devtools-rspack/core/inspector-runtime')
          config.source ??= {}
          const pre = config.source.preEntry
          config.source.preEntry = [
            ...(Array.isArray(pre) ? pre : pre ? [pre] : []),
            runtime,
          ]
          return config
        })

        api.modifyRspackConfig((config, { rspack }) => {
          if (!isDev())
            return
          const inspectorOptions
            = typeof resolved.componentInspector === 'object' ? resolved.componentInspector : {}
          config.module ??= {}
          config.module.rules ??= []
          // `enforce: 'pre'` so the transform sees the original SFC source,
          // before vue-loader splits the blocks.
          config.module.rules.unshift({
            test: /\.vue$/,
            exclude: /node_modules/,
            enforce: 'pre',
            use: [{ loader: require.resolve('@vue-devtools-rspack/core/inspector-loader') }],
          })
          config.plugins ??= []
          config.plugins.push(
            new rspack.DefinePlugin({
              __VUE_INSPECTOR_OPTIONS__: JSON.stringify({
                ...inspectorOptions,
                base: getBase(),
              }),
            }),
          )
        })
      }

      // -- module graph -------------------------------------------------------
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

      // -- dev server ---------------------------------------------------------
      api.onBeforeStartDevServer(({ server: devServer }) => {
        server = createDevtoolsServer({
          base: getBase(),
          root: api.context.rootPath,
          publicDir: resolvePublicDir(),
          distPath: api.context.distPath,
          options: resolved,
          collector,
          httpServer: devServer.httpServer,
          use: (path, middleware) => devServer.middlewares.use(path, middleware),
        })
      })

      api.onCloseDevServer(() => {
        server?.close()
        server = undefined
      })

      api.onAfterStartDevServer(({ port }) => {
        if (!isDev())
          return
        const url = `http://localhost:${port}${getBase()}__devtools__/`
        // eslint-disable-next-line no-console
        console.log(
          `  ${green('➜')}  ${bold('Vue DevTools')}: Open ${cyan(url)} as a separate window`,
        )
        // eslint-disable-next-line no-console
        console.log(
          `  ${green('➜')}  ${bold('Vue DevTools')}: Press ${cyan('Option(⌥)+Shift(⇧)+D')} in App to toggle the Vue DevTools`,
        )
      })

      function resolvePublicDir(): string {
        const publicDir = api.getNormalizedConfig().server.publicDir
        if (!publicDir)
          return ''
        const first = Array.isArray(publicDir) ? publicDir[0] : publicDir
        const name = (first && typeof first === 'object' ? first.name : undefined) ?? 'public'
        return isAbsolute(name) ? name : join(api.context.rootPath, name)
      }
    },
  }
}

export default pluginVueDevTools
