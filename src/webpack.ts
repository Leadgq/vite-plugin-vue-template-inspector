import { fileURLToPath } from 'node:url'
import type { Compiler } from 'webpack'
import {
  PLUGIN_NAME,
  createOpenInEditorMiddleware,
  injectClientIntoHtml,
  normalizeEditorStart,
  type VueTemplateInspectorOptions,
} from './core'

export type { VueTemplateInspectorOptions }

type HtmlWebpackPluginCtor = {
  getHooks: (compilation: unknown) => {
    beforeEmit: {
      tap: (name: string, fn: (data: { html: string }) => { html: string }) => void
    }
  }
}

type DevServerOptions = {
  setupMiddlewares?: (
    middlewares: unknown[],
    devServer: { app?: { use: (middleware: unknown) => void } },
  ) => unknown[]
}

function loaderFile() {
  return fileURLToPath(new URL('./webpack-loader.cjs', import.meta.url))
}

function findHtmlWebpackPlugin(compiler: Compiler): HtmlWebpackPluginCtor | undefined {
  for (const plugin of compiler.options.plugins ?? []) {
    if (!plugin || typeof plugin !== 'object') continue
    const ctor = plugin.constructor as unknown as HtmlWebpackPluginCtor & { name?: string }
    if (ctor.name === 'HtmlWebpackPlugin' && typeof ctor.getHooks === 'function') return ctor
  }
}

export class VueTemplateInspectorWebpackPlugin {
  private readonly options: VueTemplateInspectorOptions

  constructor(options: VueTemplateInspectorOptions = {}) {
    this.options = options
  }

  apply(compiler: Compiler) {
    const { enable = true, start = '' } = this.options
    if (!enable || compiler.options.mode === 'production') return

    const editor = normalizeEditorStart(start)
    const root = compiler.context
    const loader = loaderFile()

    const rules = compiler.options.module.rules
    if (Array.isArray(rules)) {
      rules.unshift({
        test: /\.vue$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: [{ loader }],
      })
    }

    const options = compiler.options as Compiler['options'] & { devServer?: DevServerOptions }
    options.devServer ??= {}
    const originalSetup = options.devServer.setupMiddlewares
    const openInEditor = createOpenInEditorMiddleware({
      getRoot: () => root,
      editor,
    })

    // 拦截 devServer 的 setupMiddlewares 方法，在中间件数组中插入 openInEditor 中间件
    options.devServer.setupMiddlewares = (middlewares, devServer) => {
      const next = originalSetup ? originalSetup(middlewares, devServer) : middlewares
      if (devServer.app) devServer.app.use(openInEditor)
      return next
    }

    // 拦截 compilation 钩子，在 beforeEmit 阶段注入 client script
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      const HtmlWebpackPlugin = findHtmlWebpackPlugin(compiler)
      // 找不到html 就不行，因为要注入 client script 到 html 中
      if (!HtmlWebpackPlugin) {
        console.warn(`[${PLUGIN_NAME}] html-webpack-plugin not found, skip injecting client script`)
        return
      }
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tap(PLUGIN_NAME, (data) => {
        data.html = injectClientIntoHtml(data.html)
        return data
      })
    })
  }
}
