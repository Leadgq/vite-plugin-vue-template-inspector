import { build } from 'esbuild'

await build({
  entryPoints: ['src/client.js'],
  outfile: 'dist/client.js',
  minify: true,
})
