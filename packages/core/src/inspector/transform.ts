/**
 * Vendored from vite-plugin-vue-inspector@6.0.0 src/compiler/template.ts
 * (MIT, © webfansplz), template branch only - adds
 * `data-v-inspector="file:line:column"` to every element in SFC templates.
 * JSX/TSX support (babel-based upstream) is not ported yet.
 */
import type { ElementNode, Node } from '@vue/compiler-dom'
import path from 'node:path'
import process from 'node:process'
import { ElementTypes, NodeTypes, parse as vueParse, transform as vueTransform } from '@vue/compiler-dom'
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
      (node: Node) => {
        if (node.type === NodeTypes.ELEMENT) {
          const element = node as ElementNode
          const isTagged
            = element.tagType === ElementTypes.ELEMENT || element.tagType === ElementTypes.COMPONENT
          if (isTagged && !EXCLUDE_TAG.includes(element.tag)) {
            if (element.loc.source.includes(KEY_DATA))
              return
            const insertPosition = element.props.length
              ? Math.max(...element.props.map(prop => prop.loc.end.offset))
              : element.loc.start.offset + element.tag.length + 1
            const { line, column } = element.loc.start
            const content = ` ${KEY_DATA}="${relativePath}:${line}:${column}"`
            s.prependLeft(insertPosition, content)
          }
        }
      },
    ],
  })

  return s.toString()
}
