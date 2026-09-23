import type { RsbuildPlugin } from '@rsbuild/core'
import type { DevtoolsServer, VueDevToolsOptions } from '@vue-devtools-rstack/core'
import { fileURLToPath } from 'node:url'
import {
  createDevtoolsServer,
  getBootstrapUrl,
  getHubBase,
  matchesAppendTo,
  normalizeBase,
  resolveVueDevToolsOptions,
} from '@vue-devtools-rstack/core'
import { bold, cyan, green } from 'kolorist'

/** Absolute path of a package subpath, resolved from this module. */
const resolvePath = (specifier: string) => fileURLToPath(import.meta.resolve(specifier))

export type { VueDevToolsOptions }

export function pluginVueDevTools(options: VueDevToolsOptions = {}): RsbuildPlugin {
  return {
    name: 'vue-devtools-rstack:rsbuild',

    setup(api) {
      const resolved = resolveVueDevToolsOptions(options)
      if (!resolved.enabled)
        return

      let server: DevtoolsServer | undefined

      const isDev = () => api.context.action === 'dev'
      const getBase = () => normalizeBase(api.getNormalizedConfig().server.base)

      // -- in-page bootstrap --------------------------------------------------
      // First in <head>, so the devtools hook is installed before the app
      // module runs createApp().
      api.modifyHTMLTags(({ headTags, bodyTags }) => {
        if (!isDev() || resolved.appendTo.length)
          return { headTags, bodyTags }
        headTags.unshift({ tag: 'script', attrs: { type: 'module', src: getBootstrapUrl(getBase()) } })
        return { headTags, bodyTags }
      })

      if (resolved.appendTo.length) {
        api.modifyRspackConfig((config) => {
          if (!isDev())
            return
          config.module ??= {}
          config.module.rules ??= []
          config.module.rules.unshift({
            test: (resource: string) => matchesAppendTo(resource, resolved.appendTo),
            enforce: 'pre',
            use: [{
              loader: resolvePath('@vue-devtools-rstack/core/append-loader'),
              options: { base: getBase() },
            }],
          })
        })
      }

      // -- dev server ---------------------------------------------------------
      api.onBeforeStartDevServer(({ server: devServer }) => {
        server = createDevtoolsServer({
          base: getBase(),
          root: api.context.rootPath,
          options: resolved,
          httpServer: devServer.httpServer,
        })
        devServer.middlewares.use(server.middleware)
      })

      api.onCloseDevServer(async () => {
        await server?.close()
        server = undefined
      })

      api.onAfterStartDevServer(({ port }) => {
        if (!isDev())
          return
        const url = `http://localhost:${port}${getHubBase(getBase())}`
        // eslint-disable-next-line no-console
        console.log(`  ${green('➜')}  ${bold('Vue DevTools')}: Open ${cyan(url)} as a separate window`)
      })
    },
  }
}

export default pluginVueDevTools
