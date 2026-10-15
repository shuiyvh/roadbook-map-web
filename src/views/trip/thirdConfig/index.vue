<template>
  <admin-config-page
    title="三方配置"
    description="维护高德、Tavily、AI 模型、行前打卡半径与导航策略等三方配置，密钥类敏感值加密存储。"
    entity-name="三方配置"
    :fields="fields"
    :api="api"
  />
</template>
<script setup lang="ts" name="TripThirdConfig">
import AdminConfigPage from '@/views/trip/shared/AdminConfigPage.vue'
import type { CrudApi, CrudField } from '@/views/trip/shared/types'
import {
  addThirdConfig,
  deleteThirdConfig,
  getThirdConfig,
  listThirdConfigs,
  toggleThirdConfig,
  updateThirdConfig
} from '@/api/trip/thirdConfig'

const { trip_enabled_status } = useDict('trip_enabled_status')

// 配置类型固定白名单，与后端 TripThirdConfig 常量一致（高德/搜索/AI/行前打卡/导航策略）
const configTypeOptions = [
  { label: '高德地图', value: 'AMAP' },
  { label: 'Tavily 搜索', value: 'TAVILY' },
  { label: 'AI 模型', value: 'AI' },
  { label: '行前打卡', value: 'CHECKIN' },
  { label: '导航策略', value: 'ROUTE' }
]

const fields = computed<CrudField[]>(() => [
  { prop: 'configType', label: '配置类型', type: 'select', required: true, query: true, table: true, options: configTypeOptions },
  { prop: 'configKey', label: '配置键', required: true, query: true, table: true, disabledOnEdit: true },
  { prop: 'configValue', label: '配置值', type: 'textarea', table: true, placeholder: '密钥类自动加密存储；编辑时留空表示不修改' },
  { prop: 'encrypted', label: '加密存储', type: 'switch', table: true },
  { prop: 'enabled', label: '启用状态', type: 'switch', query: true, table: true, options: trip_enabled_status.value },
  { prop: 'remark', label: '备注', type: 'textarea' }
])

const api: CrudApi = { list: listThirdConfigs, get: getThirdConfig, add: addThirdConfig, update: updateThirdConfig, remove: deleteThirdConfig, toggle: toggleThirdConfig }
</script>