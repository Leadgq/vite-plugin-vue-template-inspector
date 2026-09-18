import { copyFileSync, existsSync } from 'node:fs'
import { build } from 'esbuild'

await build({
  entryPoints: ['src/client.js'],
  outfile: 'dist/client.js',
  minify: true,
})

if (existsSync('dist/webpack.d.cts')) {
  copyFileSync('dist/webpack.d.cts', 'dist/webpack.d.ts')
}
