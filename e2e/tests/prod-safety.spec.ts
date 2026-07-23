import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const appDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../playground/rsbuild-app',
)

function build(distDir: string, withPlugin: boolean) {
  execFileSync('pnpm', ['exec', 'rsbuild', 'build'], {
    cwd: appDir,
    stdio: 'pipe',
    env: {
      ...process.env,
      VUE_DEVTOOLS_DISABLE: withPlugin ? '' : '1',
      RSBUILD_DIST_PATH: distDir,
    },
  })
}

function listOutput(dir: string): string[] {
  const abs = path.join(appDir, dir)
  const out: string[] = []
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name)
      if (entry.isDirectory())
        walk(p)
      else out.push(`${path.relative(abs, p)}:${fs.readFileSync(p).length}`)
    }
  }
  walk(abs)
  return out.sort()
}

test('production build is unaffected by the plugin', async () => {
  test.slow()

  build('dist-with-plugin', true)
  build('dist-without-plugin', false)

  const withPlugin = listOutput('dist-with-plugin')
  const withoutPlugin = listOutput('dist-without-plugin')
  expect(withPlugin).toEqual(withoutPlugin)

  // No devtools artifacts leak into the production bundle.
  const bundle = listOutput('dist-with-plugin')
    .map(entry => entry.split(':')[0]!)
    .filter(file => file.endsWith('.js') || file.endsWith('.html'))
    .map(file => fs.readFileSync(path.join(appDir, 'dist-with-plugin', file), 'utf-8'))
    .join('\n')
  expect(bundle).not.toContain('__vue-devtools__')
  expect(bundle).not.toContain('data-v-inspector')

  fs.rmSync(path.join(appDir, 'dist-with-plugin'), { recursive: true, force: true })
  fs.rmSync(path.join(appDir, 'dist-without-plugin'), { recursive: true, force: true })
})
