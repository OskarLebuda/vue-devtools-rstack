/**
 * `appendTo` mode: prepends the devtools runtime import to a matching module,
 * so the devtools are bundled into the app instead of injected via a script
 * tag. Mirrors upstream vite-plugin-vue-devtools's `appendTo` transform.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RUNTIME = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist', 'runtime.js')
const MARKER = '/* vue-devtools-rstack:client-injection */'

export default function appendLoader(source) {
  if (typeof source !== 'string' || source.includes(MARKER))
    return source
  const options = this.getOptions?.() ?? {}
  const query = new URLSearchParams({ base: options.base ?? '/' })
  const request = JSON.stringify(`${RUNTIME}?${query.toString()}`)
  return `${MARKER}\nimport ${request};\n${source}`
}
