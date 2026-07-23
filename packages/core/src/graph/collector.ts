import { getViteRpcServer } from '@vue/devtools-kit'
import { debounce } from 'perfect-debounce'

export interface CollectedModule {
  id: string
  deps: string[]
}

export interface AssetImporter {
  url: string
  id: string | null
}

/**
 * Builds the module list the DevTools graph tab renders, from Rspack stats
 * (replacement for vite-plugin-inspect's metadata used upstream).
 * Ids are absolute file paths - the client strips the project root itself.
 *
 * Rspack stats give REVERSE edges (module.reasons[] = importers), so forward
 * `deps` are built by inverting: for module M with reason R, M is a dep of R.
 */
export class GraphCollector {
  private modules = new Map<string, Set<string>>()

  private debouncedModuleUpdated = debounce(() => {
    (getViteRpcServer?.()?.broadcast as any)?.emit('graphModuleUpdated')
  }, 100)

  /** Accepts the result of stats.toJson({ modules: true, reasons: true }). */
  handleStatsJson(statsJson: any): void {
    const statsList: any[] = Array.isArray(statsJson?.children) && statsJson.children.length
      ? statsJson.children
      : [statsJson]

    const next = new Map<string, Set<string>>()

    for (const stats of statsList) {
      for (const module of stats?.modules ?? []) {
        const resource = moduleResource(module)
        if (!resource)
          continue
        if (!next.has(resource))
          next.set(resource, new Set())

        for (const reason of module.reasons ?? []) {
          const importer = identifierToResource(
            reason.resolvedModuleIdentifier ?? reason.moduleIdentifier,
          )
          if (!importer || importer === resource)
            continue
          if (!next.has(importer))
            next.set(importer, new Set())
          next.get(importer)!.add(resource)
        }

        // Concatenated modules keep their origins nested.
        for (const inner of module.modules ?? []) {
          const innerResource = moduleResource(inner)
          if (innerResource && !next.has(innerResource))
            next.set(innerResource, new Set())
        }
      }
    }

    if (next.size > 0) {
      this.modules = next
      this.debouncedModuleUpdated()
    }
  }

  getModules(): CollectedModule[] {
    return [...this.modules.entries()].map(([id, deps]) => ({ id, deps: [...deps] }))
  }

  /** Modules that import the given asset (matched by path suffix). */
  getAssetImporters(url: string): AssetImporter[] {
    const path = url.split('?')[0] ?? ''
    if (!path)
      return []
    const importers: AssetImporter[] = []
    for (const [id, deps] of this.modules) {
      for (const dep of deps) {
        if (dep === path || dep.endsWith(path)) {
          importers.push({ url: id, id })
          break
        }
      }
    }
    return importers
  }
}

/** Absolute resource path of a stats module, or null for runtime/virtual ones. */
function moduleResource(module: any): string | null {
  const viaName = typeof module.nameForCondition === 'string' ? module.nameForCondition : null
  const resource = viaName ?? identifierToResource(module.identifier)
  if (!resource)
    return null
  if (module.moduleType === 'runtime' || resource.startsWith('webpack/'))
    return null
  return resource
}

function identifierToResource(identifier: unknown): string | null {
  if (typeof identifier !== 'string')
    return null
  // "<loaders>!<resource>?<query>" - take the part after the last '!',
  // then strip the query (collapses App.vue?vue&type=script into App.vue).
  const afterLoaders = identifier.slice(identifier.lastIndexOf('!') + 1)
  const resource = afterLoaders.split('?')[0] ?? ''
  if (!resource || resource.startsWith('webpack/') || resource.startsWith('data:'))
    return null
  return resource
}
