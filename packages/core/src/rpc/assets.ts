/**
 * Ported from vuejs/devtools packages/vite/src/rpc/assets.ts (v8.1.5, MIT).
 * Differences: config values come from the rspack/rsbuild side (root, base,
 * publicDir), the file watcher is our own chokidar instance, and asset
 * importers come from the graph collector instead of Vite's moduleGraph.
 */
import type { GraphCollector } from '../graph/collector'
import type { BroadcastEmitter, RpcFunctionCtx } from './types'
import fsp from 'node:fs/promises'
import { getViteRpcServer } from '@vue/devtools-kit'
import chokidar from 'chokidar'
import fg from 'fast-glob'
import { imageMeta } from 'image-meta'
import { join, relative, resolve } from 'pathe'
import { debounce } from 'perfect-debounce'

export type AssetType = 'image' | 'font' | 'video' | 'audio' | 'text' | 'json' | 'wasm' | 'other'

export interface AssetInfo {
  path: string
  type: AssetType
  publicPath: string
  relativePath: string
  filePath: string
  size: number
  mtime: number
}

export interface ImageMeta {
  width: number
  height: number
  orientation?: number
  type?: string
  mimeType?: string
}

function guessType(path: string): AssetType {
  if (/\.(?:png|jpe?g|jxl|gif|svg|webp|avif|ico|bmp|tiff?)$/i.test(path))
    return 'image'
  if (/\.(?:mp4|webm|ogv|mov|avi|flv|wmv|mpg|mpeg|mkv|3gp|3g2|ts|mts|m2ts|vob|ogm|ogx|rm|rmvb|asf|amv|divx|m4v|svi|viv|f4v|f4p|f4a|f4b)$/i.test(path))
    return 'video'
  if (/\.(?:mp3|wav|ogg|flac|aac|wma|alac|ape|ac3|dts|tta|opus|amr|aiff|au|mid|midi|ra|rm|wv|weba|dss|spx|vox|tak|dsf|dff|dsd|cda)$/i.test(path))
    return 'audio'
  if (/\.(?:woff2?|eot|ttf|otf|ttc|pfa|pfb|pfm|afm)/i.test(path))
    return 'font'
  if (/\.(?:json[5c]?|te?xt|[mc]?[jt]sx?|md[cx]?|markdown|ya?ml|toml)/i.test(path))
    return 'text'
  if (/\.wasm/i.test(path))
    return 'wasm'
  return 'other'
}

export function getAssetsFunctions(ctx: RpcFunctionCtx) {
  const _imageMetaCache = new Map<string, ImageMeta | undefined>()
  let cache: AssetInfo[] | null = null

  async function scan() {
    const dir = resolve(ctx.root)
    const baseURL = ctx.base
    const publicDir = ctx.publicDir
    const relativePublicDir = publicDir === '' ? '' : `${relative(dir, publicDir)}/`

    const files = await fg([
      // image
      '**/*.(png|jpg|jpeg|gif|svg|webp|avif|ico|bmp|tiff)',
      // video
      '**/*.(mp4|webm|ogv|mov|avi|flv|wmv|mpg|mpeg|mkv|3gp|3g2|m2ts|vob|ogm|ogx|rm|rmvb|asf|amv|divx|m4v|svi|viv|f4v|f4p|f4a|f4b)',
      // audio
      '**/*.(mp3|wav|ogg|flac|aac|wma|alac|ape|ac3|dts|tta|opus|amr|aiff|au|mid|midi|ra|rm|wv|weba|dss|spx|vox|tak|dsf|dff|dsd|cda)',
      // font
      '**/*.(woff2?|eot|ttf|otf|ttc|pfa|pfb|pfm|afm)',
      // text
      '**/*.(json|json5|jsonc|txt|text|tsx|jsx|md|mdx|mdc|markdown|yaml|yml|toml)',
      // wasm
      '**/*.wasm',
    ], {
      cwd: dir,
      onlyFiles: true,
      caseSensitiveMatch: false,
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/package-lock.*',
        '**/pnpm-lock.*',
        '**/pnpm-workspace.*',
      ],
    })

    cache = await Promise.all(files.map(async (relativePath) => {
      const filePath = resolve(dir, relativePath)
      const stat = await fsp.lstat(filePath)
      // remove public prefix so served URLs match the dev server's URL space
      const path = relativePath.replace(relativePublicDir, '')
      return {
        path,
        relativePath,
        publicPath: join(baseURL, path),
        filePath,
        type: guessType(relativePath),
        size: stat.size,
        mtime: stat.mtimeMs,
      }
    }))
    return cache
  }

  return {
    async getStaticAssets() {
      return await scan()
    },
    async getAssetImporters(url: string) {
      return ctx.collector?.getAssetImporters(url) ?? []
    },
    async getImageMeta(filepath: string) {
      if (_imageMetaCache.has(filepath))
        return _imageMetaCache.get(filepath)
      try {
        const meta = imageMeta(await fsp.readFile(filepath)) as ImageMeta
        _imageMetaCache.set(filepath, meta)
        return meta
      }
      catch (e) {
        _imageMetaCache.set(filepath, undefined)
        console.error(e)
        return undefined
      }
    },
    async getTextAssetContent(filepath: string, limit = 300) {
      try {
        const content = await fsp.readFile(filepath, 'utf-8')
        return content.slice(0, limit)
      }
      catch (e) {
        console.error(e)
        return undefined
      }
    },
  }
}

/**
 * Watches the project for asset additions/removals and broadcasts
 * `assetsUpdated` - mirror of upstream assets.ts server.watcher wiring.
 * Returns a disposer.
 */
export function createAssetsWatcher(root: string, extraIgnored: string[] = []): () => void {
  const debouncedAssetsUpdated = debounce(() => {
    (getViteRpcServer?.()?.broadcast as unknown as BroadcastEmitter | undefined)?.emit('assetsUpdated')
  }, 100)

  const watcher = chokidar.watch(root, {
    ignoreInitial: true,
    ignored: (path: string) =>
      path.includes('node_modules')
      || path.includes('/.git')
      || path.includes('/dist/')
      || extraIgnored.some(dir => dir && path.startsWith(dir)),
  })

  watcher.on('all', (event, path) => {
    if (process.env.VUE_DEVTOOLS_RSPACK_DEBUG)
      console.log('[vue-devtools-rspack] watcher', event, path)
    if (event !== 'change')
      debouncedAssetsUpdated()
  })
  watcher.on('error', (err) => {
    console.error('[vue-devtools-rspack] watcher error', err)
  })

  return () => {
    watcher.close()
  }
}
