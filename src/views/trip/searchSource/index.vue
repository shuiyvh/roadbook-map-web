<template><admin-config-page title="搜索站点" description="维护推荐搜索允许使用的站点、平台类型与优先权重。" entity-name="搜索站点" :fields="fields" :api="api" /></template>
<script setup lang="ts" name="TripSearchSource">
import AdminConfigPage from '@/views/trip/shared/AdminConfigPage.vue'
import type { CrudApi, CrudField } from '@/views/trip/shared/types'
import { addSearchSource, deleteSearchSource, getSearchSource, listSearchSources, toggleSearchSource, updateSearchSource } from '@/api/trip/searchSource'
const { trip_search_source_platform, trip_enabled_status } = useDict('trip_search_source_platform', 'trip_enabled_status')
const fields = computed<CrudField[]>(() => [
  { prop: 'sourceName', label: '站点名称', required: true, query: true, table: true },
  { prop: 'sourceCode', label: '站点编码', required: true, query: true, table: true, disabledOnEdit: true },
  { prop: 'domain', label: '站点域名', required: true, table: true, width: 180 },
  { prop: 'platformType', label: '平台类型', type: 'select', query: true, table: true, options: trip_search_source_platform.value },
  { prop: 'weight', label: '推荐权重', type: 'number', table: true },
  { prop: 'sortOrder', label: '排序值', type: 'number', table: true },
  { prop: 'remark', label: '备注', type: 'textarea' },
  { prop: 'enabled', label: '启用状态', type: 'switch', query: true, table: true, options: trip_enabled_status.value }
])
const api: CrudApi = { list: listSearchSources, get: getSearchSource, add: addSearchSource, update: updateSearchSource, remove: deleteSearchSource, toggle: toggleSearchSource }
</script>
