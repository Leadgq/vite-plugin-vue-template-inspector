import process from 'node:process'
import type { Plugin } from 'vite'
import {
  PLUGIN_NAME,
  createOpenInEditorMiddleware,
  injectClientIntoHtml,
  normalizeEditorStart,
  transformVueSfc,
  type VueTemplateInspectorOptions,
} from './core'

export type { VueTemplateInspectorOptions }

export function vueTemplateInspector(options: VueTemplateInspectorOptions = {}): Plugin {
  const { enable = true, start = '' } = options
  const editor = normalizeEditorStart(start)
  let root = process.cwd()

  if (!enable) {
    return {
      name: PLUGIN_NAME,
      apply: 'serve',
    }
  }

  return {
    name: PLUGIN_NAME,
    apply: 'serve',
    enforce: 'pre',
    configResolved(config) {
      root = config.root
    },
    configureServer(server) {
      server.middlewares.use(
        createOpenInEditorMiddleware({
          getRoot: () => root,
          editor,
        }),
      )
    },
    transform(code, id) {
      return transformVueSfc(code, id, root) || undefined
    },
    transformIndexHtml(html) {
      return injectClientIntoHtml(html)
    },
  }
}
