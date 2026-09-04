# vite-plugin-vue-template-inspector

[GitHub](https://github.com/Leadgq/vite-plugin-vue-template-inspector)

Vite 开发插件：在页面上 **Alt + 左键** 点击 Vue 模板节点，弹出源码路径，可复制或在本地编辑器中打开。

仅在 `vite serve` 下生效，不会进入生产构建。

## 安装

```bash
pnpm add -D vite-plugin-vue-template-inspector
```

本地未发布时，从业务项目指向这个目录：

```bash
pnpm add -D ../vite-plugin-vue-template-inspector
```

## 使用

插件需要放在 `@vitejs/plugin-vue` **之前**，才能在编译前给模板打上定位属性。

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { vueTemplateInspector } from 'vite-plugin-vue-template-inspector'

export default defineConfig({
  plugins: [
    vueTemplateInspector({
      enable: true,
      // 命令名，或编辑器 exe 的绝对路径
      start: 'code',
    }),
    vue(),
  ],
})
```

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `enable` | `true` | 为 `false` 时完全关闭插件 |
| `start` | 自动检测 | 传给 [launch-editor](https://github.com/yyx990803/launch-editor) 的编辑器。可用 `code`、`trae`、`webstorm` 等命令名；Windows 上若命令找不到，可改成 exe 绝对路径 |

## 本地调试

```bash
pnpm install
pnpm dev
```

打开 playground 后，按住 Alt 点击页面上的元素即可验证注入、复制路径和打开编辑器。
