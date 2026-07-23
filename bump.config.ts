import { defineConfig } from 'bumpp'

export default defineConfig({
  // Every package shares one version, so bump them together with the root.
  files: ['package.json', 'packages/*/package.json'],
  commit: 'release v%s',
  tag: 'v%s',
  push: true,
})
