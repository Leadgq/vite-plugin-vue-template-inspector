import { defineConfig } from 'tsup'

const shared = {
  minify: true,
  splitting: false,
  sourcemap: true,
  target: 'node18' as const,
  clean: false,
  shims: true,
  outExtension: () => ({ js: '.cjs' as const }),
  external: [
    'vite',
    'vue',
    '@vue/compiler-sfc',
    '@vue/compiler-dom',
    'magic-string',
    'launch-editor',
    'webpack',
    'html-webpack-plugin',
    'webpack-dev-server',
  ],
}

export default defineConfig([
  {
    ...shared,
    entry: { webpack: 'src/webpack.ts' },
    format: ['cjs'],
    dts: true,
    esbuildOptions(options) {
      options.keepNames = true
    },
  },
  {
    ...shared,
    entry: { 'webpack-loader': 'src/webpack-loader.ts' },
    format: ['cjs'],
    dts: false,
    footer: {
      js: 'module.exports = module.exports.default || module.exports;',
    },
  },
])
