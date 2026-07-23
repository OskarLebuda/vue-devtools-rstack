/**
 * `appendTo` mode: prepends the devtools runtime import to a matching module,
 * so the overlay is bundled into the app instead of injected via a script tag.
 * Mirrors upstream vite-plugin-vue-devtools's `appendTo` transform.
 */
const path = require('node:path')

const RUNTIME = path.join(__dirname, 'dist', 'runtime.js')

module.exports = function appendLoader(source) {
  if (typeof source !== 'string')
    return source
  const options = this.getOptions?.() ?? {}
  const query = new URLSearchParams({
    base: options.base ?? '/',
    inspector: options.componentInspector ? '1' : '0',
  })
  const request = JSON.stringify(`${RUNTIME}?${query.toString()}`)
  return `import ${request};\n${source}`
}
