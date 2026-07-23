import { defineConfig, globalIgnores, js, ts } from '@rslint/core'

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/dist-*/**',
    'e2e/test-results/**',
    'e2e/playwright-report/**',
    // Vendored from vite-plugin-vue-inspector (MIT) - kept close to upstream
    // so it stays diffable; see docs/COMPATIBILITY.md.
    'packages/core/inspector-runtime/**',
  ]),
  js.configs.recommended,
  ts.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        // Typed linting + `--type-check`: every TypeScript project in the
        // workspace, so `pnpm lint` is also the type check.
        project: [
          './packages/*/tsconfig.json',
          './e2e/tsconfig.json',
          './playground/*/tsconfig.json',
        ],
      },
    },
  },
])
