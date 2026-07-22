<template>
  <div class="header-search">
    <button type="button" class="search-trigger" aria-label="打开菜单搜索" @click.stop="click">
      <svg-icon class-name="search-icon" icon-class="search" />
      <span>搜索路书、点位、用户...</span>
      <kbd>⌘K</kbd>
    </button>
    <el-dialog
      v-model="show"
      width="600"
      @close="close"
      @opened="onDialogOpened"
      :show-close="false"
      append-to-body
    >
      <el-input
        v-model="search"
        ref="headerSearchSelectRef"
        size="large"
        @input="querySearch"
        prefix-icon="Search"
        placeholder="菜单搜索，支持标题、URL模糊查询"
        clearable
        @keyup.enter="selectActiveResult"
        @keydown.up.prevent="navigateResult('up')"
        @keydown.down.prevent="navigateResult('down')"
      >
      </el-input>

      <div class="result-count" v-if="search && options.length > 0">
        找到 <strong>{{ options.length }}</strong> 个结果
      </div>

      <div class="result-wrap">
        <el-scrollbar>

          <template v-if="options.length > 0">
            <div
              class="search-item"
              tabindex="1"
              v-for="(item, index) in options"
              :key="item.path"
              :class="{ 'is-active': index === activeIndex }"
              :style="activeStyle(index)"
              @mouseenter="activeIndex = index"
              @mouseleave="activeIndex = -1"
            >
              <div class="left">
                <svg-icon class="menu-icon" :icon-class="item.icon" />
              </div>
              <div class="search-info" @click="change(item)">
                <div class="menu-title" v-html="highlightText(item.title.join(' / '))"></div>
                <div class="menu-path" v-html="highlightText(item.path)"></div>
              </div>
              <svg-icon icon-class="enter" v-show="index === activeIndex" />
            </div>
          </template>

          <div class="empty-state" v-else-if="search && options.length === 0">
            <el-icon class="empty-icon"><Search /></el-icon>
            <p class="empty-text">未找到 "<strong>{{ search }}</strong>" 相关菜单</p>
            <p class="empty-tip">试试其他关键词或路径</p>
          </div>

        </el-scrollbar>
      </div>

      <div class="search-footer">
        <span class="shortcut-item">
          <kbd>↑</kbd><kbd>↓</kbd> 切换
        </span>
        <span class="shortcut-item">
          <kbd>↵</kbd> 选择
        </span>
        <span class="shortcut-item">
          <kbd>Esc</kbd> 关闭
        </span>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import Fuse from 'fuse.js'
import { getNormalPath } from '@/utils/ruoyi'
import { isHttp } from '@/utils/validate'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

interface SearchItem {
  path: string
  title: string[]
  icon: string
  query?: string
}

const search = ref<string>('')
const options = ref<SearchItem[]>([])
const searchPool = ref<SearchItem[]>([])
const activeIndex = ref<number>(-1)
const show = ref<boolean>(false)
const fuse = ref<Fuse<SearchItem> | undefined>(undefined)
const headerSearchSelectRef = ref<any>(null)
const router = useRouter()
const theme = computed(() => useSettingsStore().theme)
const routes = computed(() => usePermissionStore().defaultRoutes)

function click(): void {
  show.value = !show.value
  if (show.value) {
    options.value = searchPool.value
  }
}

function onDialogOpened(): void {
  nextTick(() => {
    headerSearchSelectRef.value && headerSearchSelectRef.value.focus()
  })
}

function close(): void {
  headerSearchSelectRef.value && headerSearchSelectRef.value.blur()
  search.value = ''
  options.value = searchPool.value
  show.value = false
  activeIndex.value = -1
}

function change(val: SearchItem): void {
  const p = val.path
  const query = val.query
  if (isHttp(p)) {
    // http(s):// 路径新窗口打开
    const pindex = p.indexOf("http")
    window.open(p.substr(pindex, p.length), "_blank")
  } else {
    if (query) {
      router.push({ path: p, query: JSON.parse(query) })
    } else {
      router.push(p)
    }
  }
  search.value = ''
  options.value = searchPool.value
  nextTick(() => {
    show.value = false
  })
}

function initFuse(list: SearchItem[]): void {
  fuse.value = new Fuse(list, {
    shouldSort: true,
    threshold: 0.2,
    minMatchCharLength: 1,
    keys: ['title', 'path']
  })
}

function generateRoutes(routes: any, basePath = '', prefixTitle: string[] = []): SearchItem[] {
  let res: SearchItem[] = []
  for (const r of routes) {
    if (r.hidden) { continue }
    const p = r.path.length > 0 && r.path[0] === '/' ? r.path : '/' + r.path
    const data: SearchItem = {
      path: !isHttp(r.path) ? getNormalPath(basePath + p) : r.path,
      title: [...prefixTitle],
      icon: ''
    }
    if (r.meta && r.meta.title) {
      data.title = [...data.title, r.meta.title as string]
      data.icon = (r.meta.icon as string) || ''
      if (r.redirect !== "noRedirect") {
        res.push(data)
      }
    }
    if (r.query) {
      data.query = r.query
    }
    if (r.children) {
      const tempRoutes = generateRoutes(r.children, data.path, data.title)
      if (tempRoutes.length >= 1) {
        res = [...res, ...tempRoutes]
      }
    }
  }
  return res
}

function querySearch(query: string): void {
  activeIndex.value = -1
  if (query !== '') {
    const q = query.toLowerCase()
    const pathMatches = searchPool.value.filter((item: SearchItem) =>
      item.path.toLowerCase().includes(q)
    )
    const fuseMatches = (fuse.value?.search(query) ?? []).map((item: any) => item.item as SearchItem)
    const merged: SearchItem[] = [...pathMatches]
    fuseMatches.forEach((item: SearchItem) => {
      if (!merged.find((m: SearchItem) => m.path === item.path)) {
        merged.push(item)
      }
    })
    options.value = merged
  } else {
    options.value = searchPool.value
  }
}

function activeStyle(index: number): Record<string, string> {
  if (index !== activeIndex.value) return {}
  return {
    "background-color": theme.value,
    "color": "#fff"
  }
}

function navigateResult(direction: 'up' | 'down'): void {
  if (direction === "up") {
    activeIndex.value = activeIndex.value <= 0 ? options.value.length - 1 : activeIndex.value - 1
  } else if (direction === "down") {
    activeIndex.value = activeIndex.value >= options.value.length - 1 ? 0 : activeIndex.value + 1
  }
}

function selectActiveResult(): void {
  if (options.value.length > 0 && activeIndex.value >= 0) {
    change(options.value[activeIndex.value])
  }
}

function highlightText(text: string): string {
  if (!text) return ''
  if (!search.value) return text
  const keyword = escapeRegExp(search.value)
  const reg = new RegExp(`(${keyword})`, 'gi')
  return text.replace(reg, '<span class="highlight">$1</span>')
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function handleGlobalShortcut(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    click()
  }
}

onMounted(() => {
  searchPool.value = generateRoutes(routes.value)
  window.addEventListener('keydown', handleGlobalShortcut)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalShortcut)
})

watch(searchPool, (list: SearchItem[]) => {
  initFuse(list)
})
</script>

<style lang='scss' scoped>
:deep(.el-dialog__header) {
  padding: 6px !important;
}

:deep(.highlight) {
  color: red;
  font-weight: 600;
}

:deep(.is-active .highlight) {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.header-search {
  width: 100%;

  .search-icon {
    flex: 0 0 auto;
    font-size: 15px;
    vertical-align: middle;
  }
}

.search-trigger {
  display: flex;
  width: 100%;
  height: 38px;
  padding: 0 10px 0 13px;
  align-items: center;
  gap: 9px;
  border: 1px solid var(--roadbook-border);
  border-radius: 12px;
  color: var(--roadbook-text-secondary);
  background: var(--roadbook-panel-muted);
  font: inherit;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.search-trigger:hover,
.search-trigger:focus-visible {
  border-color: color-mix(in srgb, var(--roadbook-primary) 38%, var(--roadbook-border));
  background: var(--roadbook-panel-bg);
  box-shadow: 0 4px 16px rgba(80, 96, 140, 0.08);
  outline: none;
}

.search-trigger span {
  overflow: hidden;
  flex: 1;
  font-size: 12px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-trigger kbd {
  padding: 2px 6px;
  border: 1px solid var(--roadbook-border);
  border-radius: 5px;
  color: var(--roadbook-text-secondary);
  background: var(--roadbook-panel-bg);
  font-family: inherit;
  font-size: 10px;
}

.result-count {
  padding: 6px 16px 0;
  font-size: 12px;
  color: #aaa;

  strong {
    color: red;
    font-weight: 600;
  }
}

.result-wrap {
  height: 280px;
  margin: 4px 0;

  .search-item {
    display: flex;
    height: 48px;
    align-items: center;
    padding-right: 10px;
    border-radius: 4px;
    transition: background 0.15s;

    .left {
      width: 60px;
      text-align: center;
      flex-shrink: 0;

      .menu-icon {
        width: 18px;
        height: 18px;
      }
    }

    .search-info {
      padding-left: 5px;
      margin-top: 10px;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      flex: 1;
      overflow: hidden;

      .menu-title,
      .menu-path {
        height: 20px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .menu-path {
        color: #ccc;
        font-size: 10px;
      }
    }
  }

  .search-item:hover {
    cursor: pointer;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;

    .empty-icon {
      font-size: 42px;
      color: #e0e0e0;
      margin-bottom: 14px;
    }

    .empty-text {
      font-size: 14px;
      color: #999;
      margin: 0 0 6px;

      strong {
        color: #666;
      }
    }

    .empty-tip {
      font-size: 12px;
      color: #bbb;
      margin: 0;
    }
  }
}

.search-footer {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 10px 20px;
  border-top: 1px solid #f0f0f0;
  color: #999;
  font-size: 12px;

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #f7f7f7;
    color: #555;
    font-size: 11px;
    font-family: inherit;
    line-height: 1;
    box-shadow: 0 1px 0 #ccc;
  }
}
</style>
