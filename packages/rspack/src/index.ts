import type { Compiler } from '@rspack/core'
import type { VueDevToolsOptions } from '@vue-devtools-rstack/core'
import { fileURLToPath } from 'node:url'
import {
  getBootstrapUrl,
  matchesAppendTo,
  normalizeBase,
  resolveVueDevToolsOptions,
} from '@vue-devtools-rstack/core'

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

/** The slice of HtmlRspackPlugin's compilation hooks used for tag injection. */
interface HtmlAssetTag {
  tagName: string
  voidTag: boolean
  meta: Record<string, unknown>
  attributes: Record<string, string>
}

interface AlterAssetTagsData {
  assetTags: { scripts: HtmlAssetTag[] }
}

interface HtmlCompilationHooks {
  alterAssetTags?: {
    tap: (name: string, fn: (data: AlterAssetTagsData) => AlterAssetTagsData) => void
  }
}

interface HtmlPluginLike {
  HtmlRspackPlugin?: {
    getCompilationHooks?: (compilation: unknown) => HtmlCompilationHooks
  }
}

/**
 * Rspack plugin half of the Vue DevTools integration: injects the in-page
 * bootstrap into the HTML (or, with `appendTo`, into a matching module).
 *
 * The dev-server half (devtools hub, client SPA, RPC, open-in-editor) is
 * mounted separately - see `@vue-devtools-rstack/rspack/middleware`.
 */
export class VueDevToolsRspackPlugin {
  private readonly options: ReturnType<typeof resolveVueDevToolsOptions>
  private readonly base: string

  constructor(options: RspackVueDevToolsOptions = {}) {
    this.options = resolveVueDevToolsOptions(options)
    this.base = normalizeBase(options.base)
  }

  apply(compiler: Compiler): void {
    if (compiler.options.mode === 'production' || !this.options.enabled)
      return

    this.applyHtmlInjection(compiler)
  }

  private applyHtmlInjection(compiler: Compiler): void {
    const src = getBootstrapUrl(this.base)

    if (this.options.appendTo.length) {
      // Parity with upstream `appendTo`: no HTML tag, the runtime is imported
      // by a matching module instead.
      const appendTo = this.options.appendTo
      compiler.options.module.rules.unshift({
        test: (resource: string) => matchesAppendTo(resource, appendTo),
        enforce: 'pre',
        use: [{
          loader: resolvePath('@vue-devtools-rstack/core/append-loader'),
          options: { base: this.base },
        }],
      })
      return
    }

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      const rspackApi = compiler.rspack as unknown as HtmlPluginLike
      const hooks = rspackApi.HtmlRspackPlugin?.getCompilationHooks?.(compilation)
      if (!hooks?.alterAssetTags) {
        compilation.warnings.push(
          new compiler.rspack.WebpackError(
            '[vue-devtools-rstack] HtmlRspackPlugin was not detected - the DevTools bootstrap '
            + 'script could not be injected. Use the `appendTo` option instead, or add '
            + 'HtmlRspackPlugin/html-webpack-plugin to your config.',
          ) as never,
        )
        return
      }

      hooks.alterAssetTags.tap(PLUGIN_NAME, (data) => {
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
