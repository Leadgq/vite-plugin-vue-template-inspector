;(() => {
  const config = window.__VUE_INSPECTOR_CONFIG__ || {}
  const ATTR = config.ATTR || 'data-v-inspector'
  const REQ_PATH = config.REQ_PATH || '/__vue-template-inspector/open-in-editor'
  const INIT_KEY = Symbol.for('vue-template-inspector.initialized')
  if (window[INIT_KEY]) return
  window[INIT_KEY] = true

  const locations = new WeakMap()
  let panel = null

  const hideElementAttr = (el) => {
    if (!(el instanceof Element)) return
    const loc = el.getAttribute(ATTR)
    if (!loc) return
    locations.set(el, loc)
    el.removeAttribute(ATTR)
  }
  const hideTree = (node) => {
    if (!(node instanceof Element)) return
    hideElementAttr(node)
    node.querySelectorAll('[' + ATTR + ']').forEach(hideElementAttr)
  }
  const findElement = (target) => {
    let el = target instanceof Element ? target : null
    while (el) {
      if (locations.has(el) || el.hasAttribute(ATTR)) return el
      el = el.parentElement
    }
    return null
  }
  const getLocation = (el) => {
    const loc = locations.get(el) || el.getAttribute(ATTR)
    if (el.hasAttribute(ATTR)) hideElementAttr(el)
    return loc
  }
  document.querySelectorAll('[' + ATTR + ']').forEach(hideElementAttr)
  new MutationObserver((records) =>
    records.forEach((record) => {
      if (record.type === 'attributes') hideElementAttr(record.target)
      else record.addedNodes.forEach(hideTree)
    }),
  ).observe(document.documentElement, {
    attributes: true,
    attributeFilter: [ATTR],
    childList: true,
    subtree: true,
  })

  const hidePanel = () => {
    panel?.remove()
    panel = null
  }
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      const input = document.createElement('textarea')
      input.value = text
      input.style.cssText = 'position:fixed;left:-9999px;opacity:0'
      document.body.appendChild(input)
      input.select()
      const ok = document.execCommand('copy')
      input.remove()
      return ok
    }
  }
  const openEditor = async (file, line, column) => {
    const query = new URLSearchParams({ file, line, column })
    const response = await fetch(REQ_PATH + '?' + query, { method: 'POST' })
    if (!response.ok) throw new Error(await response.text())
  }

  function showPanel(loc, x, y) {
    hidePanel()
    const match = loc.match(/^(.*):(\d+):(\d+)$/)
    const [, file, line, column] = match || [null, loc, '-', '-']
    panel = document.createElement('div')
    panel.style.cssText = `
          position:fixed;
          z-index:2147483647;
          max-width:min(520px,calc(100vw - 24px));
          padding:12px 14px;
          border-radius:8px;
          background:#111827;
          color:#f9fafb;
          font:13px/1.5 ui-sans-serif,system-ui,sans-serif;
          box-shadow:0 10px 30px rgba(0,0,0,.35);
    `
    const pathEl = document.createElement('div')
    pathEl.textContent = file
    pathEl.title = file
    pathEl.style.cssText = `
          word-break:break-all;
          margin-bottom:10px;
          color:#e5e7eb;
    `
    const actions = document.createElement('div')
    actions.style.cssText = `
    display:flex;
    gap:8px;
    justify-content:flex-end;
    `
    const position = document.createElement('div')
    position.style.cssText = `
    display:flex;
    align-items:center;
    gap:6px;
    margin-right:auto;
    `
    for (const text of ['行 ' + line, '列 ' + column]) {
      const tag = document.createElement('span')
      tag.textContent = text
      tag.style.cssText = `padding:2px 7px;
        border:1px solid #4b5563;
        border-radius:4px;
        background:#1f2937;
        color:#d1d5db;
        font-size:12px;
        white-space:nowrap`

      position.append(tag)
    }
    const makeButton = (text, color) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = text
      button.style.cssText = `cursor:pointer;
      border:0;
      border-radius:6px;
      padding:6px 10px;
      background:${color};
      color:#fff;
      `
      return button
    }
    const copy = makeButton('复制路径', '#2563eb')
    const open = makeButton('打开编辑器', '#059669')
    const close = makeButton('关闭', '#374151')
    copy.onclick = async (event) => {
      event.stopPropagation()
      copy.textContent = (await copyText(file)) ? '已复制' : '复制失败'
      setTimeout(() => {
        copy.textContent = '复制路径'
      }, 1200)
    }
    open.onclick = async (event) => {
      event.stopPropagation()
      open.disabled = true
      try {
        await openEditor(file, line, column)
        open.textContent = '已打开'
      } catch {
        open.textContent = '打开失败'
      }
      setTimeout(() => {
        open.textContent = '打开编辑器'
        open.disabled = false
      }, 1200)
    }
    close.onclick = (event) => {
      event.stopPropagation()
      hidePanel()
    }
    actions.append(position, copy, open, close)
    panel.append(pathEl, actions)
    document.body.appendChild(panel)
    const rect = panel.getBoundingClientRect()
    panel.style.left = `${Math.min(Math.max(8, x + 8), window.innerWidth - rect.width - 8)}px`
    panel.style.top = `${Math.min(Math.max(8, y + 8), window.innerHeight - rect.height - 8)}px`
  }
  window.addEventListener(
    'click',
    (event) => {
      if (event.button !== 0 || !event.altKey) return
      const el = findElement(event.target)
      const loc = el && getLocation(el)
      if (!loc) return
      event.preventDefault()
      event.stopPropagation()
      showPanel(loc, event.clientX, event.clientY)
    },
    true,
  )
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hidePanel()
  })
  window.addEventListener('click', (event) => {
    if (panel && !event.altKey && !panel.contains(event.target)) hidePanel()
  })
})()
