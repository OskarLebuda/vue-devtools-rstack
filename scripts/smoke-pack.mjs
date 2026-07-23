/**
 * Packs the publishable packages, installs them into a throwaway app with npm
 * (outside the pnpm workspace), and verifies the DevTools actually come up.
 *
 * This is what catches missing `files` entries and bad `exports` maps - things
 * the in-repo e2e suite cannot see because it resolves through the workspace.
 *
 * Usage: node scripts/smoke-pack.mjs
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vue-devtools-smoke-'))
const tarballDir = path.join(workDir, 'tarballs')
const appDir = path.join(workDir, 'app')
const PORT = 3399

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString()

function pack() {
  fs.mkdirSync(tarballDir, { recursive: true })
  const packages = ['packages/core', 'packages/rsbuild-plugin', 'packages/rspack-plugin']
  return packages.map((pkg) => {
    const out = run('pnpm', ['pack', '--pack-destination', tarballDir], path.join(repoRoot, pkg))
    return out.trim().split('\n').pop()
  })
}

function scaffold(tarballs) {
  fs.mkdirSync(path.join(appDir, 'src'), { recursive: true })
  fs.writeFileSync(path.join(appDir, 'package.json'), `${JSON.stringify({
    name: 'smoke-app',
    private: true,
    type: 'module',
    scripts: { dev: 'rsbuild dev' },
  }, null, 2)}\n`)

  fs.writeFileSync(path.join(appDir, 'rsbuild.config.ts'), `import { defineConfig } from '@rsbuild/core'
import { pluginVue } from '@rsbuild/plugin-vue'
import { pluginVueDevTools } from 'rsbuild-plugin-vue-devtools'

export default defineConfig({
  plugins: [pluginVue(), pluginVueDevTools()],
  server: { port: ${PORT} },
})
`)
  fs.writeFileSync(path.join(appDir, 'src/index.ts'), `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#root')
`)
  fs.writeFileSync(path.join(appDir, 'src/App.vue'), `<script setup lang="ts">
import { ref } from 'vue'

const msg = ref('smoke test')
</script>

<template><h1 data-testid="msg">{{ msg }}</h1></template>
`)

  run('npm', [
    'install',
    '--silent',
    'vue@^3.5',
    '@rsbuild/core@^2.1',
    '@rsbuild/plugin-vue@^2',
    ...tarballs,
  ], appDir)
}

async function verify() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  const checks = []

  try {
    await page.goto(`http://localhost:${PORT}/`)
    await page.waitForSelector('#__vue-devtools-container__', { state: 'attached', timeout: 20_000 })
    checks.push('overlay mounted')

    await page.waitForFunction(() => !!window.__VUE_INSPECTOR__, { timeout: 20_000 })
    const attr = await page
      .locator('[data-v-inspector*="App.vue"]')
      .first()
      .getAttribute('data-v-inspector')
    if (!/App\.vue:\d+:\d+$/.test(attr ?? ''))
      throw new Error(`unexpected data-v-inspector value: ${attr}`)
    checks.push(`component inspector (${attr})`)

    // The overlay app may still be hydrating; retry until the panel opens.
    let opened = false
    for (let i = 0; i < 10 && !opened; i++) {
      await page.locator('#__vue-devtools-container__ .panel-entry-btn').click({ force: true })
      opened = await page
        .waitForSelector('#vue-devtools-iframe', { state: 'visible', timeout: 2000 })
        .then(() => true)
        .catch(() => false)
    }
    if (!opened)
      throw new Error('devtools panel never opened')

    const frame = await (await page.$('#vue-devtools-iframe')).contentFrame()
    await frame.waitForFunction(() => document.body.innerText.includes('App'), { timeout: 20_000 })
    checks.push('devtools panel + component tree (channel A)')

    await page.goto(`http://localhost:${PORT}/__devtools__/`)
    const heartbeat = await page.evaluate(async () => {
      const start = Date.now()
      while (!window.__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__) {
        if (Date.now() - start > 20_000)
          throw new Error('vite rpc client never initialized')
        await new Promise(r => setTimeout(r, 100))
      }
      return window.__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__.heartbeat()
    })
    if (heartbeat !== true)
      throw new Error('channel B heartbeat did not resolve')
    checks.push('channel B heartbeat')

    if (errors.length)
      throw new Error(`page errors: ${errors.join('; ')}`)
    checks.push('no page errors')
  }
  finally {
    await browser.close()
  }

  return checks
}

const tarballs = pack()
scaffold(tarballs)

const { spawn } = await import('node:child_process')
const server = spawn('npm', ['run', 'dev'], {
  cwd: appDir,
  stdio: 'ignore',
  detached: true,
})

try {
  // Wait for the dev server to answer before driving a browser at it.
  const deadline = Date.now() + 90_000
  for (;;) {
    try {
      const res = await fetch(`http://localhost:${PORT}/`)
      if (res.ok)
        break
    }
    catch {
      // server not up yet
    }
    if (Date.now() > deadline)
      throw new Error('smoke app dev server never started')
    await new Promise(r => setTimeout(r, 500))
  }

  const checks = await verify()
  for (const check of checks)
    console.log(`  ✓ ${check}`)
  console.log('\nsmoke-pack: packaged artifacts work in a fresh npm install')
}
finally {
  try {
    process.kill(-server.pid)
  }
  catch {
    // already exited
  }
  fs.rmSync(workDir, { recursive: true, force: true })
}
