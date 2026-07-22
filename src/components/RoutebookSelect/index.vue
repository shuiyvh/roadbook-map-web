<template>
  <el-select
    v-model="model"
    filterable
    clearable
    :disabled="disabled"
    :loading="loading"
    :placeholder="placeholder"
    :no-data-text="loadError ? '路书加载失败，重新打开后重试' : '暂无可选路书'"
    style="width: 100%"
    @visible-change="handleVisibleChange"
  >
    <el-option
      v-for="option in options"
      :key="option.id"
      :label="option.title"
      :value="option.id"
    >
      <span>{{ option.title }}</span>
      <small class="routebook-id">#{{ option.id }}</small>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { listRoutebookOptions } from '@/api/trip/routebook'
import type { TripRoutebookOption } from '@/types/api/trip/routebook'

withDefaults(defineProps<{
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: '请输入路书名称搜索',
  disabled: false
})

const model = defineModel<number>()
const options = ref<TripRoutebookOption[]>([])
const loading = ref(false)
const loadError = ref(false)
const loaded = ref(false)

/**
 * 路书选项接口不接收搜索词，因此首次加载后由 Element Plus 在本地按标题过滤。
 * 加载失败时保留空列表，用户再次展开下拉即可重新请求，避免页面进入不可恢复状态。
 */
async function loadOptions(): Promise<void> {
  if (loading.value) return
  loading.value = true
  loadError.value = false
  try {
    const response = await listRoutebookOptions()
    options.value = Array.isArray(response.data) ? response.data : []
    loaded.value = true
  } catch (error) {
    loadError.value = true
    console.warn('路书下拉选项加载失败，请检查路书选项接口。', error)
  } finally {
    loading.value = false
  }
}

function handleVisibleChange(visible: boolean): void {
  if (visible && (!loaded.value || loadError.value)) loadOptions()
}

onMounted(loadOptions)
</script>

<style scoped lang="scss">
.routebook-id {
  float: right;
  margin-left: 16px;
  color: var(--el-text-color-secondary);
}
</style>
