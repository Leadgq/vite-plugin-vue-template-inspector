import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { NodeTypes, parse as parseTemplate } from '@vue/compiler-dom'
import type { ElementNode, TemplateChildNode } from '@vue/compiler-dom'
import launchEditor from 'launch-editor'
import MagicString from 'magic-string'
import type { Plugin } from 'vite'
import { parse as parseSFC } from 'vue/compiler-sfc'

const ATTR = 'data-v-inspector'
const REQ_PATH = '/__vue-template-inspector/open-in-editor'
const clientScriptPath = fileURLToPath(new URL('./client.js', import.meta.url))

function walkElements(nodes: TemplateChildNode[], visit: (el: ElementNode) => void) {
  for (const node of nodes) {
    if (node.type === NodeTypes.ELEMENT) {
      visit(node)
      walkElements(node.children, visit)
    } else if (node.type === NodeTypes.IF) {
      for (const branch of node.branches) walkElements(branch.children, visit)
    } else if (node.type === NodeTypes.FOR) {
      walkElements(node.children, visit)
    }
  }
}

function injectInspector(code: string, filename: string, root: string) {
  const { descriptor } = parseSFC(code, { filename })
  if (!descriptor.template) return null

  const template = descriptor.template
  const ast = parseTemplate(template.content)
  const rel = path.relative(root, filename).replace(/\\/g, '/')
  const lineOffset = template.loc.start.line - 1
  const templateOffset = template.loc.start.offset
  const magicString = new MagicString(code)
  let changed = false

  walkElements(ast.children, (el) => {
    const already = el.props.some(
      (prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === ATTR,
    )
    if (already) return
    const line = el.loc.start.line + lineOffset
    const column = el.loc.start.column
    const insertPosition = templateOffset + el.loc.start.offset + 1 + el.tag.length
    magicString.appendLeft(insertPosition, ` ${ATTR}="${rel}:${line}:${column}"`)
    changed = true
  })

  if (!changed) return null
  return {
    code: magicString.toString(),
    map: magicString.generateMap({
      source: filename,
      includeContent: true,
      hires: true,
    }),
  }
}

function clientScript() {
  const clientCode = fs.readFileSync(clientScriptPath, 'utf8')
  const config = JSON.stringify({ ATTR, REQ_PATH }).replace(/</g, '\\u003c')
  return `<script>
      window.__VUE_INSPECTOR_CONFIG__=${config};
      ${clientCode};
    </script>`
}

export function vueTemplateInspector(): Plugin {
  let root = process.cwd()

  return {
    name: 'vue-template-inspector',
    apply: 'serve',
    enforce: 'pre',
    configResolved(config) {
      root = config.root
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next()

        const url = new URL(req.url, 'http://localhost')
        if (url.pathname !== REQ_PATH) return next()

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        const file = url.searchParams.get('file')
        if (!file) {
          res.statusCode = 400
          res.end('Missing file')
          return
        }

        const absolutePath = path.resolve(root, file)
        const relativePath = path.relative(root, absolutePath)
        const outsideRoot =
          relativePath === '..' ||
          relativePath.startsWith(`..${path.sep}`) ||
          path.isAbsolute(relativePath)

        if (outsideRoot) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }

        const line = Math.max(1, Number.parseInt(url.searchParams.get('line') ?? '', 10) || 1)
        const column = Math.max(1, Number.parseInt(url.searchParams.get('column') ?? '', 10) || 1)

        launchEditor(`${absolutePath}:${line}:${column}`, undefined, (fileName, errorMessage) => {
          console.error(`[vue-template-inspector] 无法打开 ${fileName}: ${errorMessage}`)
        })
        res.statusCode = 204
        res.end()
      })
    },
    transform(code, id) {
      const filename = id.split('?')[0] ?? id
      if (id.includes('node_modules') || !filename.endsWith('.vue')) return
      return injectInspector(code, filename, root) || undefined
    },
    transformIndexHtml(html) {
      return html.replace('</body>', `${clientScript()}</body>`)
    },
  }
}
