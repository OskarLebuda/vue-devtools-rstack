import { expect, test } from '@playwright/test'
import { viteRpc } from './helpers'

test('getStaticAssets lists playground assets with correct metadata', async ({ page }) => {
  await page.goto('/__devtools__/')

  const assets = await viteRpc(page, 'getStaticAssets')
  expect(assets.length).toBeGreaterThan(0)

  const logo = assets.find(a => a.path === 'logo.svg')
  expect(logo).toBeTruthy()
  expect(logo!.type).toBe('image')
  expect(logo!.publicPath).toBe('/logo.svg')
  expect(logo!.size).toBeGreaterThan(0)

  const json = assets.find(a => a.path === 'sample.json')
  expect(json?.type).toBe('text')

  const png = assets.find(a => a.path === 'pixel.png')
  expect(png?.type).toBe('image')

  const meta = await viteRpc(page, 'getImageMeta', png!.filePath)
  expect(meta?.width).toBe(8)
  expect(meta?.height).toBe(8)

  const text = await viteRpc(page, 'getTextAssetContent', json!.filePath)
  expect(text).toContain('sample-asset')
})

test('getGraphModules returns the module graph with App.vue and its deps', async ({ page }) => {
  // Visit the app first so the dev compilation (and stats collection) has run.
  await page.goto('/')
  await page.goto('/__devtools__/')

  const modules = await viteRpc(page, 'getGraphModules')
  expect(modules.length).toBeGreaterThan(3)

  expect(modules.find(m => m.id.endsWith('/src/App.vue'))).toBeTruthy()

  const entry = modules.find(m => m.id.endsWith('/src/index.ts'))
  expect(entry).toBeTruthy()
  // index.ts imports App.vue (directly or through filtered intermediates).
  expect(entry!.deps.some(d => d.endsWith('/src/App.vue'))).toBe(true)

  expect(modules.find(m => m.id.endsWith('/src/stores/counter.ts'))).toBeTruthy()
})
