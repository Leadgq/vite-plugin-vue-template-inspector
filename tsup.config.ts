import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  minify: true,
  splitting: false,
  sourcemap: true,
  target: 'node18',
  external: [
    'vite',
    'vue',
    'vue/compiler-sfc',
    '@vue/compiler-dom',
    'magic-string',
    'launch-editor',
  ],
})
