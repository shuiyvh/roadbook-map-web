<template>
  <div class="poi-selector">
    <el-select
      :model-value="modelValue"
      filterable
      remote
      reserve-keyword
      clearable
      :loading="loading"
      :placeholder="placeholder"
      :remote-method="searchPoiOptions"
      @update:model-value="(value: unknown) => emit('update:modelValue', String(value || ''))"
    >
      <el-option v-for="poi in options" :key="poiKey(poi)" :label="poi.name || '未命名点位'" :value="poi.name || ''">
        <div class="poi-option">
          <strong>{{ poi.name || '未命名点位' }}</strong>
          <small>{{ poi.address || poi.type || '地址信息暂无' }}</small>
        </div>
      </el-option>
    </el-select>
    <small v-if="searchError" class="poi-selector__error">地图搜索失败，请稍后重新输入关键词。</small>
    <small v-else class="poi-selector__tip">输入至少 2 个字，从高德地图结果中选择。</small>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { searchPoi } from '@/api/trip/map'
import type { PoiItem } from '@/types/api/trip/map'

defineProps<{
  modelValue?: string
  placeholder: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const options = ref<PoiItem[]>([])
const loading = ref(false)
const searchError = ref(false)
let requestSequence = 0

/**
 * 远程搜索可能因连续输入并发返回，通过序号只接收最后一次请求结果，
 * 避免较慢的旧响应覆盖用户刚输入的新关键词。
 */
const searchPoiOptions = useDebounceFn(async (keywords: string) => {
  const normalizedKeywords = keywords.trim()
  if (normalizedKeywords.length < 2) {
    options.value = []
    searchError.value = false
    return
  }
  const currentSequence = ++requestSequence
  loading.value = true
  searchError.value = false
  try {
    const response: any = await searchPoi({ keywords: normalizedKeywords, pageNum: 1, pageSize: 10 })
    if (currentSequence !== requestSequence) {
      return
    }
    const payload = response.data || {}
    options.value = Array.isArray(payload) ? payload : payload.pois || payload.list || payload.rows || []
  } catch (error) {
    if (currentSequence === requestSequence) {
      options.value = []
      searchError.value = true
    }
    console.warn('路书起终点地图搜索失败，请检查 POI 搜索接口。', error)
  } finally {
    if (currentSequence === requestSequence) {
      loading.value = false
    }
  }
}, 350)

function poiKey(poi: PoiItem): string {
  return String(poi.id || `${poi.name || ''}-${poi.address || ''}`)
}
</script>

<style scoped lang="scss">
.poi-selector,
.poi-selector :deep(.el-select) {
  width: 100%;
}

.poi-option {
  display: flex;
  min-width: 0;
  flex-direction: column;
  line-height: 1.35;
}

.poi-option strong,
.poi-option small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poi-option small,
.poi-selector__tip,
.poi-selector__error {
  color: var(--roadbook-text-secondary);
  font-size: 11px;
}

.poi-selector__tip,
.poi-selector__error {
  display: block;
  margin-top: 5px;
  line-height: 1.4;
}

.poi-selector__error {
  color: var(--roadbook-danger);
}
</style>
