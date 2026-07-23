/**
 * Ported from vuejs/devtools packages/vite/src/rpc/graph.ts (v8.1.5, MIT).
 * Module data comes from the rspack GraphCollector instead of
 * vite-plugin-inspect; the searchForVueDeps flattening is kept verbatim so
 * hidden intermediates (css, assets) don't break edges.
 */
import type { RpcFunctionCtx } from './types'

export interface ModuleInfo {
  id: string
  deps: string[]
}

const FILTER_RE = /\.(vue|js|ts|jsx|tsx|html|json)($|\?)/

export function getGraphFunctions(ctx: RpcFunctionCtx) {
  return {
    async getGraphModules(): Promise<ModuleInfo[]> {
      const modules = ctx.collector?.getModules() ?? []
      const filteredModules = modules.filter(m => m.id.match(FILTER_RE))
      const graph = filteredModules.map((i) => {
        function searchForVueDeps(id: string, seen = new Set<string>()): string[] {
          if (seen.has(id))
            return []
          seen.add(id)
          const module = modules.find(m => m.id === id)
          if (!module)
            return []
          return module.deps.flatMap((dep) => {
            if (filteredModules.find(m => m.id === dep))
              return [dep]
            return searchForVueDeps(dep, seen)
          })
        }

        return {
          id: i.id,
          deps: searchForVueDeps(i.id),
        }
      })
      return graph
    },
  }
}
