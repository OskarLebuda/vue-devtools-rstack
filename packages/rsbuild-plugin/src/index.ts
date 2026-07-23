import type { RsbuildPlugin } from '@rsbuild/core'
import type { VueDevToolsOptions } from '@vue-devtools-rspack/core'
import {
  createClientMiddleware,
  createOpenInEditorMiddleware,
  createOverlayAssetsMiddleware,
  getBootstrapScriptTag,
  normalizeBase,
  resolveDevtoolsDirs,
  resolveVueDevToolsOptions,
} from '@vue-devtools-rspack/core'
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
        headTags.unshift({
          ...getBootstrapScriptTag(getBase(), resolved),
          head: true,
          append: false,
        })
        return { headTags, bodyTags }
      })

      api.onBeforeStartDevServer(({ server }) => {
        const base = getBase()
        const dirs = resolveDevtoolsDirs()

        server.middlewares.use(`${base}__devtools__`, createClientMiddleware(dirs.clientDir))
        server.middlewares.use(
          `${base}__vue-devtools__`,
          createOverlayAssetsMiddleware(dirs.overlayDir),
        )
        server.middlewares.use(
          `${base}__open-in-editor`,
          createOpenInEditorMiddleware(resolved.launchEditor),
        )
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
