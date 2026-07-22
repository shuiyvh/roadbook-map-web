<template>
  <div :class="['sidebar-theme-wrapper', { 'has-logo': showLogo, 'has-footer': !isCollapse }, sideTheme]" class="sidebar-container">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="getMenuBackground"
        :text-color="getMenuTextColor"
        :unique-opened="true"
        :active-text-color="theme"
        :collapse-transition="false"
        mode="vertical"
        :class="sideTheme"
      >
        <sidebar-item
          v-for="(route, index) in sidebarRouters"
          :key="route.path + index"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
    <div v-if="!isCollapse" class="sidebar-footer">
      <div class="sidebar-landscape" aria-hidden="true">
        <span></span>
        <span></span>
      </div>
      <strong>让每一次旅行更精彩</strong>
      <small>Smart Trip, Better Life.</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import Logo from './Logo.vue'
import SidebarItem from './SidebarItem.vue'
import variables from '@/assets/styles/variables.module.scss'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()

const sidebarRouters = computed(() => permissionStore.sidebarRouters)
const showLogo = computed(() => settingsStore.sidebarLogo)
const sideTheme = computed(() => settingsStore.sideTheme)
const theme = computed(() => settingsStore.theme)
const isCollapse = computed(() => !appStore.sidebar.opened)

// 获取菜单背景色
const getMenuBackground = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-bg)'
  }
  return sideTheme.value === 'theme-dark' ? variables.menuBg : variables.menuLightBg
})

// 获取菜单文字颜色
const getMenuTextColor = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-text)'
  }
  return sideTheme.value === 'theme-dark' ? variables.menuText : variables.menuLightText
})

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})
</script>

<style lang="scss" scoped>
.sidebar-container {
  background-color: v-bind(getMenuBackground);
  border-right: 1px solid var(--sidebar-border);
  
  .scrollbar-wrapper {
    background-color: v-bind(getMenuBackground);
  }

  .el-menu {
    border: none;
    height: 100%;
    width: 100% !important;
    
    .el-menu-item, .el-sub-menu__title {
      &:hover {
        background-color: var(--menu-hover, rgba(0, 0, 0, 0.06)) !important;
      }
    }

    .el-menu-item {
      color: v-bind(getMenuTextColor);
      
      &.is-active {
        color: var(--menu-active-text, #409eff);
        background-color: var(--menu-hover, rgba(0, 0, 0, 0.06)) !important;
      }
    }

    .el-sub-menu__title {
      color: v-bind(getMenuTextColor);
    }
  }

  &.has-logo.has-footer .el-scrollbar {
    height: calc(100% - var(--roadbook-header-height) - 166px);
  }
}

.sidebar-footer {
  position: absolute;
  right: 16px;
  bottom: 12px;
  left: 16px;
  height: 142px;
  padding: 0 8px;
  color: var(--roadbook-text-regular);
}

.sidebar-footer strong,
.sidebar-footer small {
  position: relative;
  z-index: 2;
  display: block;
}

.sidebar-footer strong {
  margin-top: 88px;
  font-size: 12px;
}

.sidebar-footer small {
  margin-top: 5px;
  color: var(--roadbook-text-secondary);
  font-size: 10px;
}

.sidebar-landscape {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 76px;
  overflow: hidden;
  border-radius: 7px;
  background: linear-gradient(180deg, #f5f4ff, #eef4ff);
}

.sidebar-landscape span {
  position: absolute;
  right: -10px;
  bottom: -16px;
  width: 88%;
  height: 74px;
  clip-path: polygon(0 100%, 21% 50%, 35% 72%, 56% 18%, 70% 62%, 85% 35%, 100% 100%);
  background: linear-gradient(145deg, rgba(139, 166, 255, 0.2), rgba(91, 124, 250, 0.42));
}

.sidebar-landscape span + span {
  right: 54px;
  bottom: -27px;
  opacity: 0.55;
  transform: scale(0.82);
}

html.dark .sidebar-landscape {
  background: #1d2532;
}
</style>
