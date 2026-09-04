import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { vueTemplateInspector } from '../src/index.ts'

const playgroundRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: playgroundRoot,
  plugins: [vueTemplateInspector({ enable: true }), vue()],
  server: {
    port: 5175,
  },
})
