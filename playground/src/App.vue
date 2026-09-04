<script setup lang="ts">
import { ref } from 'vue'
import NestedCard from './NestedCard.vue'

const showHint = ref(true)
const items = ['模板注入', 'v-if 分支', 'v-for 列表']
</script>

<template>
  <main class="page">
    <h1>vue-template-inspector</h1>
    <p class="lead">按住 <kbd>Alt</kbd> 再左键点击下面的节点，应弹出源码路径。</p>

    <p v-if="showHint" class="hint">
      这段受 <code>v-if</code> 控制，点这里应定位到 App.vue。
    </p>
    <button type="button" @click="showHint = !showHint">
      {{ showHint ? '隐藏提示' : '显示提示' }}
    </button>

    <ul>
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>

    <NestedCard />
  </main>
</template>

<style>
:root {
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #111827;
  background: #f3f4f6;
}

body {
  margin: 0;
}

.page {
  max-width: 640px;
  margin: 48px auto;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.lead {
  color: #4b5563;
}

.hint {
  padding: 10px 12px;
  background: #eff6ff;
  border-radius: 8px;
}

kbd,
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: #e5e7eb;
  padding: 1px 6px;
  border-radius: 4px;
}

button {
  margin: 8px 0 16px;
  padding: 6px 12px;
  border: 0;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
}

ul {
  padding-left: 20px;
}
</style>
