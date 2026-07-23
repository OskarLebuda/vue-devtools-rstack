import { defineConfig, globalIgnores, js, ts } from '@rslint/core'

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/dist-*/**',
    'e2e/test-results/**',
    'e2e/playwright-report/**',
    'packages/core/inspector-runtime/**',
  ]),
  js.configs.recommended,
  ts.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: [
          './packages/*/tsconfig.json',
          './e2e/tsconfig.json',
          './playground/*/tsconfig.json',
        ],
      },
    },
  },
])
