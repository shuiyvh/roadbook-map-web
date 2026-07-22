<template>
  <business-page :title="title" :description="description">
    <template #actions>
      <el-button type="primary" icon="Plus" @click="openCreate">新增{{ entityName }}</el-button>
    </template>

    <section class="business-panel search-panel">
      <el-form :inline="true" :model="query">
        <template v-for="field in queryFields" :key="field.prop">
          <el-form-item :label="field.label">
            <el-select v-if="field.options" v-model="query[field.prop]" clearable :placeholder="field.placeholder || `请选择${field.label}`" style="width: 180px">
              <el-option v-for="option in field.options" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
            <el-input v-else v-model="query[field.prop]" clearable :placeholder="field.placeholder || `请输入${field.label}`" @keyup.enter="search" />
          </el-form-item>
        </template>
        <el-form-item>
          <el-button icon="Search" @click="search">查询</el-button>
          <el-button icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="business-panel table-panel">
      <page-state v-if="loading" type="loading" :description="`正在读取${entityName}列表`" />
      <page-state v-else-if="loadError" type="error" :description="`${entityName}列表加载失败，请检查接口后重试。`" action-text="重新加载" @action="loadData" />
      <page-state v-else-if="rows.length === 0" :description="`当前没有${entityName}，可点击右上角新增。`" />
      <template v-else>
        <el-table :data="rows" stripe>
          <el-table-column label="ID" prop="id" width="80" />
          <el-table-column v-for="field in tableFields" :key="field.prop" :label="field.label" :prop="field.prop" :min-width="field.width || 120" show-overflow-tooltip>
            <template #default="scope">
              <div v-if="field.type === 'switch'" class="enabled-cell">
                <el-switch
                  :model-value="Number(scope.row[field.prop])"
                  :active-value="1"
                  :inactive-value="0"
                  :loading="toggleId === scope.row.id"
                  @change="(value: unknown) => changeEnabled(scope.row, Number(value))"
                />
                <span>{{ optionLabel(field, scope.row[field.prop]) }}</span>
              </div>
              <span v-else-if="field.type === 'select'">{{ optionLabel(field, scope.row[field.prop]) }}</span>
              <span v-else>{{ scope.row[field.prop] ?? '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="142" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="openEdit(scope.row)">编辑</el-button>
              <el-button link type="danger" @click="removeRow(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadData" />
      </template>
    </section>

    <el-dialog v-model="dialogOpen" :title="editing ? `编辑${entityName}` : `新增${entityName}`" width="620px" append-to-body :close-on-click-modal="false" :before-close="beforeDialogClose">
      <div v-loading="detailLoading">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
          <el-form-item v-for="field in fields" :key="field.prop" :label="field.label" :prop="field.prop">
            <el-input v-if="field.type === 'textarea'" v-model="form[field.prop]" type="textarea" :rows="4" :placeholder="field.placeholder || `请输入${field.label}`" />
            <el-input-number v-else-if="field.type === 'number'" v-model="form[field.prop]" :min="0" controls-position="right" />
            <el-select v-else-if="field.type === 'select'" v-model="form[field.prop]" :placeholder="field.placeholder || `请选择${field.label}`" style="width: 100%">
              <el-option v-for="option in field.options" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
            <el-switch v-else-if="field.type === 'switch'" v-model="form[field.prop]" :active-value="1" :inactive-value="0" />
            <el-input v-else v-model="form[field.prop]" :disabled="editing && field.disabledOnEdit" :placeholder="field.placeholder || `请输入${field.label}`" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button :disabled="submitting" @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </business-page>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import BusinessPage from '@/components/BusinessPage/index.vue'
import PageState from '@/components/BusinessPage/PageState.vue'
import type { CrudApi, CrudField } from './types'

const props = defineProps<{
  title: string
  description: string
  entityName: string
  fields: CrudField[]
  api: CrudApi
}>()

const loading = ref(false)
const loadError = ref(false)
const rows = ref<Record<string, any>[]>([])
const total = ref(0)
const query = reactive<Record<string, any>>({ pageNum: 1, pageSize: 10 })
const dialogOpen = ref(false)
const detailLoading = ref(false)
const submitting = ref(false)
const toggleId = ref<number>()
const form = ref<Record<string, any>>({})
const formRef = ref<any>()
const editing = computed(() => form.value.id !== undefined)
const queryFields = computed(() => props.fields.filter((field: CrudField) => field.query))
const tableFields = computed(() => props.fields.filter((field: CrudField) => field.table))
const rules = computed<Record<string, any[]>>(() => Object.fromEntries(props.fields.filter((field: CrudField) => field.required).map((field: CrudField) => [field.prop, [{ required: true, message: field.options ? `请选择${field.label}` : `请填写${field.label}`, trigger: field.options ? 'change' : 'blur' }]])))

async function loadData(): Promise<void> {
  loading.value = true
  loadError.value = false
  try {
    const response = await props.api.list({ ...query })
    rows.value = response.rows || []
    total.value = response.total || 0
  } catch (error) {
    loadError.value = true
    console.warn(`${props.entityName}列表加载失败，请检查后台配置接口。`, error)
  } finally {
    loading.value = false
  }
}

function search(): void {
  query.pageNum = 1
  loadData()
}

function resetSearch(): void {
  for (const field of queryFields.value) {
    query[field.prop] = undefined
  }
  search()
}

function defaultForm(): Record<string, any> {
  return Object.fromEntries(props.fields.map((field: CrudField) => [field.prop, field.type === 'switch' ? 1 : field.type === 'number' ? 0 : undefined]))
}

function openCreate(): void {
  form.value = defaultForm()
  dialogOpen.value = true
  nextTick(() => formRef.value?.clearValidate())
}

async function openEdit(row: Record<string, any>): Promise<void> {
  form.value = { id: row.id }
  dialogOpen.value = true
  detailLoading.value = true
  try {
    const response = await props.api.get(Number(row.id))
    form.value = { ...defaultForm(), ...(response.data || row) }
    nextTick(() => formRef.value?.clearValidate())
  } catch (error) {
    dialogOpen.value = false
    console.warn(`${props.entityName}详情加载失败，无法打开编辑弹窗。`, error)
  } finally {
    detailLoading.value = false
  }
}

async function submit(): Promise<void> {
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (editing.value) {
      await props.api.update({ ...form.value })
    } else {
      await props.api.add({ ...form.value })
    }
    ElMessage.success(editing.value ? '修改成功' : '新增成功')
    dialogOpen.value = false
    await loadData()
  } catch (error) {
    console.warn(`${props.entityName}保存失败，请检查填写内容和接口返回。`, error)
  } finally {
    submitting.value = false
  }
}

async function removeRow(row: Record<string, any>): Promise<void> {
  await ElMessageBox.confirm(`确定删除“${row.name || row.prefName || row.sourceName || row.templateName || row.id}”吗？`, '删除确认', { type: 'warning' })
  await props.api.remove(Number(row.id))
  ElMessage.success('删除成功')
  await loadData()
}

async function changeEnabled(row: Record<string, any>, enabled: number): Promise<void> {
  toggleId.value = Number(row.id)
  try {
    await props.api.toggle(Number(row.id), enabled)
    row.enabled = enabled
    ElMessage.success(enabled === 1 ? '已启用' : '已停用')
  } catch (error) {
    console.warn(`${props.entityName}启停状态修改失败。`, error)
  } finally {
    toggleId.value = undefined
  }
}

function optionLabel(field: CrudField, value: unknown): string {
  return field.options?.find(option => String(option.value) === String(value))?.label || String(value ?? '--')
}

function beforeDialogClose(done: () => void): void {
  if (!submitting.value) {
    done()
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.business-panel {
  border: 1px solid var(--roadbook-border);
  border-radius: var(--roadbook-radius);
  background: var(--roadbook-panel-bg);
  box-shadow: var(--roadbook-shadow);
}
.search-panel { padding: 16px 20px 0; margin-bottom: 16px; }
.table-panel { min-height: 320px; padding: 16px; }
.enabled-cell { display: flex; align-items: center; gap: 8px; }.enabled-cell span { color: var(--roadbook-text-secondary); font-size: 12px; }
</style>
