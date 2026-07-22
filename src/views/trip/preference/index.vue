<template><admin-config-page title="推荐偏好" description="维护推荐检索使用的稳定偏好编码、权重和排序。" entity-name="偏好" :fields="fields" :api="api" /></template>
<script setup lang="ts" name="TripPreference">
import AdminConfigPage from '@/views/trip/shared/AdminConfigPage.vue'
import type { CrudApi, CrudField } from '@/views/trip/shared/types'
import { addPreference, deletePreference, getPreference, listPreferences, togglePreference, updatePreference } from '@/api/trip/preference'
const { trip_enabled_status } = useDict('trip_enabled_status')
const fields = computed<CrudField[]>(() => [
  { prop: 'prefCode', label: '偏好编码', required: true, query: true, table: true, disabledOnEdit: true },
  { prop: 'prefName', label: '偏好名称', required: true, query: true, table: true },
  { prop: 'description', label: '偏好描述', type: 'textarea', table: true, width: 180 },
  { prop: 'weight', label: '推荐权重', type: 'number', table: true },
  { prop: 'sortOrder', label: '排序值', type: 'number', table: true },
  { prop: 'enabled', label: '启用状态', type: 'switch', query: true, table: true, options: trip_enabled_status.value }
])
const api: CrudApi = { list: listPreferences, get: getPreference, add: addPreference, update: updatePreference, remove: deletePreference, toggle: togglePreference }
</script>
