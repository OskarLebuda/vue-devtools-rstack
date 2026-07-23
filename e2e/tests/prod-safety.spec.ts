import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const appDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../playground/rsbuild-app',
)

// Build outside the playground: anything written inside it would be picked up
// by the assets tab (and its watcher), racing the assets specs.
const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vue-devtools-prod-'))

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
  const out: string[] = []
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name)
      if (entry.isDirectory())
        walk(p)
      else out.push(`${path.relative(dir, p)}:${fs.readFileSync(p).length}`)
    }
  }
  walk(dir)
  return out.sort()
}

test('production build is unaffected by the plugin', async () => {
  test.slow()

  const withDir = path.join(outRoot, 'with-plugin')
  const withoutDir = path.join(outRoot, 'without-plugin')

  try {
    build(withDir, true)
    build(withoutDir, false)

    expect(listOutput(withDir)).toEqual(listOutput(withoutDir))

    // No devtools artifacts leak into the production bundle.
    const bundle = listOutput(withDir)
      .map(entry => entry.slice(0, entry.lastIndexOf(':')))
      .filter(file => file.endsWith('.js') || file.endsWith('.html'))
      .map(file => fs.readFileSync(path.join(withDir, file), 'utf-8'))
      .join('\n')
    expect(bundle).not.toContain('__vue-devtools__')
    expect(bundle).not.toContain('data-v-inspector')
  }
  finally {
    fs.rmSync(outRoot, { recursive: true, force: true })
  }
})
