<template><admin-config-page title="搜索模板" description="按偏好编码维护推荐查询模板和变量化检索内容。" entity-name="搜索模板" :fields="fields" :api="api" /></template>
<script setup lang="ts" name="TripSearchTemplate">
import AdminConfigPage from '@/views/trip/shared/AdminConfigPage.vue'
import type { CrudApi, CrudField } from '@/views/trip/shared/types'
import { addSearchTemplate, deleteSearchTemplate, getSearchTemplate, listSearchTemplates, toggleSearchTemplate, updateSearchTemplate } from '@/api/trip/searchTemplate'
const { trip_enabled_status } = useDict('trip_enabled_status')
const fields = computed<CrudField[]>(() => [
  { prop: 'prefCode', label: '偏好编码', required: true, query: true, table: true },
  { prop: 'templateName', label: '模板名称', required: true, query: true, table: true },
  { prop: 'templateContent', label: '模板内容', type: 'textarea', required: true, table: true, width: 260 },
  { prop: 'sortOrder', label: '排序值', type: 'number', table: true },
  { prop: 'enabled', label: '启用状态', type: 'switch', query: true, table: true, options: trip_enabled_status.value }
])
const api: CrudApi = { list: listSearchTemplates, get: getSearchTemplate, add: addSearchTemplate, update: updateSearchTemplate, remove: deleteSearchTemplate, toggle: toggleSearchTemplate }
</script>
