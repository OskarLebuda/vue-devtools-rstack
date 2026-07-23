import type { Compiler } from '@rspack/core'
import type { VueDevToolsOptions } from '@vue-devtools-rspack/core'
import { fileURLToPath } from 'node:url'
import {
  getBootstrapUrl,
  GraphCollector,
  normalizeBase,
  resolveVueDevToolsOptions,
} from '@vue-devtools-rspack/core'

/** Absolute path of a package subpath, resolved from this module. */
const resolvePath = (specifier: string) => fileURLToPath(import.meta.resolve(specifier))

export type { VueDevToolsOptions }

export interface RspackVueDevToolsOptions extends VueDevToolsOptions {
  /**
   * Dev-server base path. Must match the `devServer.devMiddleware.publicPath`
   * / router base the app is served under.
   * @default '/'
   */
  base?: string
}

const PLUGIN_NAME = 'VueDevToolsRspackPlugin'

/**
 * Rspack plugin half of the Vue DevTools integration: injects the overlay
 * bootstrap into the HTML, wires up the component inspector transform, and
 * collects the module graph from compilation stats.
 *
 * The dev-server half (static assets, RPC channel, open-in-editor) is mounted
 * separately - see `rspack-plugin-vue-devtools/middleware`.
 */
export class VueDevToolsRspackPlugin {
  /** Shared with the dev-server middlewares so the graph tab has data. */
  readonly collector = new GraphCollector()

  private readonly options: ReturnType<typeof resolveVueDevToolsOptions>
  private readonly base: string

  constructor(options: RspackVueDevToolsOptions = {}) {
    this.options = resolveVueDevToolsOptions(options)
    this.base = normalizeBase(options.base)
  }

  apply(compiler: Compiler): void {
    if (compiler.options.mode === 'production')
      return

    this.applyInspector(compiler)
    this.applyHtmlInjection(compiler)

    compiler.hooks.done.tap(PLUGIN_NAME, (stats) => {
      this.collector.handleStatsJson(
        stats.toJson({
          all: false,
          modules: true,
          reasons: true,
          ids: true,
          cachedModules: true,
        }),
      )
    })
  }

  private applyInspector(compiler: Compiler): void {
    if (!this.options.componentInspector)
      return

    const inspectorOptions
      = typeof this.options.componentInspector === 'object' ? this.options.componentInspector : {}

    // `enforce: 'pre'` so the transform sees the original SFC source, before
    // vue-loader splits the blocks.
    compiler.options.module.rules.unshift({
      test: /\.vue$/,
      exclude: /node_modules/,
      enforce: 'pre',
      use: [{ loader: resolvePath('@vue-devtools-rspack/core/inspector-loader') }],
    })

    const { DefinePlugin, EntryPlugin } = compiler.rspack
    new DefinePlugin({
      __VUE_INSPECTOR_OPTIONS__: JSON.stringify({ ...inspectorOptions, base: this.base }),
    }).apply(compiler)

    // The inspector overlay imports `vue`, so it must be compiled into the
    // app bundle - prepend it as an extra entry module.
    const runtime = resolvePath('@vue-devtools-rspack/core/inspector-runtime')
    for (const entryName of Object.keys(compiler.options.entry ?? {}))
      new EntryPlugin(compiler.context, runtime, { name: entryName }).apply(compiler)
  }

  private applyHtmlInjection(compiler: Compiler): void {
    const src = getBootstrapUrl(this.base, this.options)

    if (this.options.appendTo) {
      // Parity with upstream `appendTo`: no HTML tag, the runtime is imported
      // by a matching module instead.
      const appendTo = this.options.appendTo
      compiler.options.module.rules.unshift({
        test: (resource: string) =>
          typeof appendTo === 'string' ? resource.endsWith(appendTo) : appendTo.test(resource),
        enforce: 'pre',
        use: [{
          loader: resolvePath('@vue-devtools-rspack/core/append-loader'),
          options: { base: this.base, componentInspector: !!this.options.componentInspector },
        }],
      })
      return
    }

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      const hooks = (compiler.rspack as any).HtmlRspackPlugin?.getCompilationHooks?.(compilation)
      if (!hooks?.alterAssetTags) {
        compilation.warnings.push(
          new compiler.rspack.WebpackError(
            '[vue-devtools-rspack] HtmlRspackPlugin was not detected - the DevTools overlay '
            + 'script could not be injected. Use the `appendTo` option instead, or add '
            + 'HtmlRspackPlugin/html-webpack-plugin to your config.',
          ) as never,
        )
        return
      }

      hooks.alterAssetTags.tap(PLUGIN_NAME, (data: any) => {
        data.assetTags.scripts.unshift({
          tagName: 'script',
          voidTag: false,
          meta: { plugin: PLUGIN_NAME },
          attributes: { type: 'module', src },
        })
        return data
      })
    })
  }
}

export default VueDevToolsRspackPlugin
