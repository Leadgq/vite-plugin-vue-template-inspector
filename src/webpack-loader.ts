import { transformVueSfc } from './core'

interface WebpackLoaderThis {
  resourcePath: string
  rootContext: string
  callback: (error: Error | null, source?: string, map?: object) => void
}

export default function vueTemplateInspectorLoader(this: WebpackLoaderThis, code: string) {
  const result = transformVueSfc(code, this.resourcePath, this.rootContext)
  if (!result) return code
  this.callback(null, result.code, result.map)
}
