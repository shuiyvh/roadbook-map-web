<template><admin-config-page title="偏好站点绑定" description="配置每类推荐偏好可使用的搜索站点及绑定权重。" entity-name="站点绑定" :fields="fields" :api="api" /></template>
<script setup lang="ts" name="TripPreferenceSourceRel">
import AdminConfigPage from '@/views/trip/shared/AdminConfigPage.vue'
import type { CrudApi, CrudField } from '@/views/trip/shared/types'
import { addPreferenceSourceRel, deletePreferenceSourceRel, getPreferenceSourceRel, listPreferenceSourceRels, togglePreferenceSourceRel, updatePreferenceSourceRel } from '@/api/trip/preferenceSourceRel'
const { trip_enabled_status } = useDict('trip_enabled_status')
const fields = computed<CrudField[]>(() => [
  { prop: 'prefCode', label: '偏好编码', required: true, query: true, table: true },
  { prop: 'sourceCode', label: '站点编码', required: true, query: true, table: true },
  { prop: 'weight', label: '绑定权重', type: 'number', table: true },
  { prop: 'enabled', label: '启用状态', type: 'switch', query: true, table: true, options: trip_enabled_status.value }
])
const api: CrudApi = { list: listPreferenceSourceRels, get: getPreferenceSourceRel, add: addPreferenceSourceRel, update: updatePreferenceSourceRel, remove: deletePreferenceSourceRel, toggle: togglePreferenceSourceRel }
</script>
