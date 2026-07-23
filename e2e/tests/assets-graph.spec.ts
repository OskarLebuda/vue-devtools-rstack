import { expect, test } from '@playwright/test'

async function callRpc<T>(page: any, expression: string): Promise<T> {
  return page.evaluate(async (expr: string) => {
    const start = Date.now()
    while (!(window as any).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__) {
      if (Date.now() - start > 10_000)
        throw new Error('vite rpc client never initialized')
      await new Promise(r => setTimeout(r, 100))
    }
    const rpc = (window as any).__VUE_DEVTOOLS_KIT_VITE_RPC_CLIENT__
    // eslint-disable-next-line no-new-func
    return new Function('rpc', `return (async () => ${expr})()`)(rpc)
  }, expression)
}

test('getStaticAssets lists playground assets with correct metadata', async ({ page }) => {
  await page.goto('/__devtools__/')

  const assets = await callRpc<any[]>(page, 'rpc.getStaticAssets()')
  expect(assets.length).toBeGreaterThan(0)

  const logo = assets.find(a => a.path === 'logo.svg')
  expect(logo).toBeTruthy()
  expect(logo.type).toBe('image')
  expect(logo.publicPath).toBe('/logo.svg')
  expect(logo.size).toBeGreaterThan(0)

  const json = assets.find(a => a.path === 'sample.json')
  expect(json?.type).toBe('text')

  const png = assets.find(a => a.path === 'pixel.png')
  expect(png?.type).toBe('image')

  const meta = await callRpc<any>(page, `rpc.getImageMeta(${JSON.stringify(png.filePath)})`)
  expect(meta.width).toBe(8)
  expect(meta.height).toBe(8)

  const text = await callRpc<string>(page, `rpc.getTextAssetContent(${JSON.stringify(json.filePath)})`)
  expect(text).toContain('sample-asset')
})

test('getGraphModules returns the module graph with App.vue and its deps', async ({ page }) => {
  // Visit the app first so the dev compilation (and stats collection) has run.
  await page.goto('/')
  await page.goto('/__devtools__/')

  const modules = await callRpc<any[]>(page, 'rpc.getGraphModules()')
  expect(modules.length).toBeGreaterThan(3)

  const appVue = modules.find(m => m.id.endsWith('/src/App.vue'))
  expect(appVue).toBeTruthy()

  const entry = modules.find(m => m.id.endsWith('/src/index.ts'))
  expect(entry).toBeTruthy()
  // index.ts imports App.vue (directly or through filtered intermediates).
  expect(entry.deps.some((d: string) => d.endsWith('/src/App.vue'))).toBe(true)

  const store = modules.find(m => m.id.endsWith('/src/stores/counter.ts'))
  expect(store).toBeTruthy()
})
