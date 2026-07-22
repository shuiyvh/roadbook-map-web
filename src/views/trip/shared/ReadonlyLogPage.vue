<template>
  <business-page :title="title" :description="description">
    <section class="business-panel search-panel">
      <el-form :inline="true" :model="query">
        <el-form-item v-for="field in queryFields" :key="field.prop" :label="field.label">
          <el-select v-if="field.options" v-model="query[field.prop]" clearable :placeholder="`请选择${field.label}`" style="width: 160px"><el-option v-for="option in field.options" :key="option.value" :label="option.label" :value="option.value" /></el-select>
          <el-input v-else v-model="query[field.prop]" clearable :placeholder="`请输入${field.label}`" @keyup.enter="search" />
        </el-form-item>
        <el-form-item><el-button type="primary" icon="Search" @click="search">查询</el-button><el-button icon="Refresh" @click="reset">重置</el-button></el-form-item>
      </el-form>
    </section>
    <section class="business-panel table-panel">
      <page-state v-if="loading" type="loading" :description="`正在读取${title}`" />
      <page-state v-else-if="loadError" type="error" :description="`${title}加载失败，请检查接口后重试。`" action-text="重新加载" @action="loadData" />
      <page-state v-else-if="rows.length === 0" description="当前筛选条件下没有日志记录。" />
      <template v-else>
        <el-table :data="rows" stripe>
          <el-table-column v-for="field in tableFields" :key="field.prop" :label="field.label" :prop="field.prop" :min-width="field.width || 120" show-overflow-tooltip>
            <template #default="scope"><dict-tag v-if="field.options" :options="field.options" :value="scope.row[field.prop]" /><span v-else>{{ scope.row[field.prop] ?? '--' }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right"><template #default="scope"><el-button link type="primary" @click="showDetail(scope.row)">详情</el-button></template></el-table-column>
        </el-table>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadData" />
      </template>
    </section>
    <el-dialog v-model="detailOpen" :title="`${title}详情`" width="760px" append-to-body>
      <div v-loading="detailLoading">
        <el-descriptions :column="2" border>
          <el-descriptions-item v-for="field in detailFields" :key="field.prop" :label="field.label" :span="field.span || 1"><dict-tag v-if="field.options" :options="field.options" :value="detail[field.prop]" /><pre v-else-if="field.span === 2" class="detail-text">{{ detail[field.prop] ?? '--' }}</pre><span v-else>{{ detail[field.prop] ?? '--' }}</span></el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer><el-button @click="detailOpen = false">关闭</el-button></template>
    </el-dialog>
  </business-page>
</template>

<script setup lang="ts">
import BusinessPage from '@/components/BusinessPage/index.vue'
import PageState from '@/components/BusinessPage/PageState.vue'
import type { CrudField, DetailField } from './types'

const props = defineProps<{
  title: string
  description: string
  queryFields: CrudField[]
  tableFields: CrudField[]
  detailFields: DetailField[]
  listApi: (query: any) => Promise<any>
  getApi: (id: number) => Promise<any>
}>()
const query = reactive<Record<string, any>>({ pageNum: 1, pageSize: 10 })
const rows = ref<Record<string, any>[]>([])
const total = ref(0)
const loading = ref(false)
const loadError = ref(false)
const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<Record<string, any>>({})
async function loadData(): Promise<void> {
  loading.value = true; loadError.value = false
  try { const response = await props.listApi({ ...query }); rows.value = response.rows || []; total.value = response.total || 0 }
  catch (error) { loadError.value = true; console.warn(`${props.title}加载失败，请检查日志查询接口。`, error) }
  finally { loading.value = false }
}
function search(): void { query.pageNum = 1; loadData() }
function reset(): void { for (const field of props.queryFields) query[field.prop] = undefined; search() }
async function showDetail(row: Record<string, any>): Promise<void> {
  detail.value = row; detailOpen.value = true; detailLoading.value = true
  try { const response = await props.getApi(Number(row.id)); detail.value = response.data || row }
  catch (error) { console.warn(`${props.title}详情加载失败。`, error) }
  finally { detailLoading.value = false }
}
onMounted(loadData)
</script>

<style scoped lang="scss">
.business-panel { border: 1px solid var(--roadbook-border); border-radius: var(--roadbook-radius); background: var(--roadbook-panel-bg); box-shadow: var(--roadbook-shadow); }
.search-panel { padding: 16px 20px 0; margin-bottom: 16px; }
.table-panel { min-height: 320px; padding: 16px; }
.detail-text { margin: 0; max-height: 180px; overflow: auto; white-space: pre-wrap; word-break: break-all; font: inherit; }
</style>
