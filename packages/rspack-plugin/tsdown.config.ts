import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts', middleware: 'src/middleware.ts' },
  format: ['esm', 'cjs'],
  platform: 'node',
  dts: true,
  clean: true,
})
