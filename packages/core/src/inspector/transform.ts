/**
 * Vendored from vite-plugin-vue-inspector@6.0.0 src/compiler/template.ts
 * (MIT, © webfansplz), template branch only - adds
 * `data-v-inspector="file:line:column"` to every element in SFC templates.
 * JSX/TSX support (babel-based upstream) is not ported yet.
 */
import path from 'node:path'
import process from 'node:process'
import { parse as vueParse, transform as vueTransform } from '@vue/compiler-dom'
import MagicString from 'magic-string'

const EXCLUDE_TAG = ['template', 'script', 'style']
const KEY_DATA = 'data-v-inspector'

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/')
}

export function injectInspectorAttrs(code: string, id: string, cwd = process.cwd()): string {
  const s = new MagicString(code)
  const relativePath = normalizePath(path.relative(cwd, id))

  const ast = vueParse(code, { comments: true })
  vueTransform(ast, {
    nodeTransforms: [
      (node: any) => {
        if (node.type === 1) {
          if ((node.tagType === 0 || node.tagType === 1) && !EXCLUDE_TAG.includes(node.tag)) {
            if (node.loc.source.includes(KEY_DATA))
              return
            const insertPosition = node.props.length
              ? Math.max(...node.props.map((i: any) => i.loc.end.offset))
              : node.loc.start.offset + node.tag.length + 1
            const { line, column } = node.loc.start
            const content = ` ${KEY_DATA}="${relativePath}:${line}:${column}"`
            s.prependLeft(insertPosition, content)
          }
        }
      },
    ],
  })

  return s.toString()
}
