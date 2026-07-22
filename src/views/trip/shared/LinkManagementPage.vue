<template>
  <business-page :title="config.title" :description="config.description">
    <template #actions><el-button type="primary" icon="Plus" @click="openCreate">{{ config.createText }}</el-button></template>
    <section class="business-panel filter-bar">
      <routebook-select v-model="routebookId" class="routebook-filter" />
      <el-button icon="Search" @click="loadData">查询</el-button>
      <el-button icon="Refresh" @click="resetFilter">重置</el-button>
    </section>
    <section class="business-panel table-panel">
      <page-state v-if="loading" type="loading" :description="`正在读取${config.itemName}`" />
      <page-state v-else-if="loadError" type="error" :description="`${config.itemName}加载失败，请检查接口后重试。`" action-text="重新加载" @action="loadData" />
      <page-state v-else-if="rows.length === 0" :description="`当前没有${config.itemName}，可点击右上角创建。`" />
      <el-table v-else :data="rows" stripe>
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="路书 ID" prop="routebookId" width="110" />
        <el-table-column :label="config.codeLabel" :prop="config.codeProp" min-width="180" show-overflow-tooltip />
        <el-table-column :label="config.typeLabel" min-width="120"><template #default="scope"><dict-tag :options="mode === 'share' ? trip_share_type : trip_routebook_role" :value="scope.row[config.typeProp]" /></template></el-table-column>
        <el-table-column v-if="mode === 'invite'" label="使用次数" min-width="110">
          <template #default="scope">{{ scope.row.usedCount ?? 0 }} / {{ scope.row.maxUseCount ?? '不限' }}</template>
        </el-table-column>
        <el-table-column v-else label="访问次数" prop="viewCount" width="100" />
        <el-table-column label="过期时间" prop="expireTime" min-width="170" />
        <el-table-column label="状态" width="90">
          <template #default="scope"><dict-tag :options="trip_enabled_status" :value="scope.row.enabled" /></template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="copyLink(scope.row)">复制链接</el-button>
            <el-button v-if="Number(scope.row.enabled) !== 0" link type="danger" @click="disable(scope.row)">禁用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogOpen" :title="config.createText" width="560px" append-to-body :close-on-click-modal="false" :before-close="beforeClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
        <el-form-item label="路书" prop="routebookId"><routebook-select v-model="form.routebookId" /></el-form-item>
        <template v-if="mode === 'share'">
          <el-form-item label="分享类型" prop="shareType"><el-select v-model="form.shareType" style="width: 100%"><el-option v-for="item in trip_share_type" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item label="访问密码"><el-input v-model="form.password" type="password" show-password placeholder="可选，不填写则无需密码" /></el-form-item>
        </template>
        <template v-else>
          <el-form-item label="协作角色" prop="roleCode"><el-select v-model="form.roleCode" style="width: 100%"><el-option v-for="item in trip_routebook_role" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item label="最大使用次数"><el-input-number v-model="form.maxUseCount" :min="1" controls-position="right" /></el-form-item>
        </template>
        <el-form-item label="过期时间"><el-date-picker v-model="form.expireTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="可选，留空表示长期有效" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer><el-button :disabled="submitting" @click="dialogOpen = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submit">创建</el-button></template>
    </el-dialog>
  </business-page>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import BusinessPage from '@/components/BusinessPage/index.vue'
import PageState from '@/components/BusinessPage/PageState.vue'
import RoutebookSelect from '@/components/RoutebookSelect/index.vue'
import { createInviteLink, disableInviteLink, listInviteLinks } from '@/api/trip/invite'
import { createShareLink, disableShareLink, listShareLinks } from '@/api/trip/share'

const props = defineProps<{ mode: 'share' | 'invite' }>()
const { trip_share_type, trip_routebook_role, trip_enabled_status } = useDict('trip_share_type', 'trip_routebook_role', 'trip_enabled_status')
const config = computed(() => props.mode === 'share' ? {
  title: '分享管理', description: '创建路书公开分享链接并查看访问状态。', createText: '创建分享链接', itemName: '分享链接', codeLabel: '分享码', codeProp: 'shareCode', typeLabel: '分享类型', typeProp: 'shareType'
} : {
  title: '邀请管理', description: '创建协作邀请链接，控制角色、有效期和可用次数。', createText: '创建邀请链接', itemName: '邀请链接', codeLabel: '邀请码', codeProp: 'inviteCode', typeLabel: '协作角色', typeProp: 'roleCode'
})
const routebookId = ref<number>()
const loading = ref(false)
const loadError = ref(false)
const rows = ref<Record<string, any>[]>([])
const dialogOpen = ref(false)
const submitting = ref(false)
const formRef = ref<any>()
const form = ref<Record<string, any>>({})
const rules: Record<string, any[]> = { routebookId: [{ required: true, message: '请选择路书', trigger: 'change' }], shareType: [{ required: true, message: '请选择分享类型', trigger: 'change' }], roleCode: [{ required: true, message: '请选择协作角色', trigger: 'change' }] }

async function loadData(): Promise<void> {
  loading.value = true
  loadError.value = false
  try {
    const response: any = props.mode === 'share' ? await listShareLinks(routebookId.value) : await listInviteLinks(routebookId.value)
    const payload = response.data ?? response.rows ?? []
    rows.value = Array.isArray(payload) ? payload : payload.rows || payload.list || []
  } catch (error) {
    loadError.value = true
    console.warn(`${config.value.itemName}加载失败，请检查业务接口。`, error)
  } finally {
    loading.value = false
  }
}

function resetFilter(): void { routebookId.value = undefined; loadData() }
function openCreate(): void {
  form.value = props.mode === 'share' ? { routebookId: routebookId.value, shareType: 'VIEW_ONLY' } : { routebookId: routebookId.value, roleCode: 'EDITOR', maxUseCount: 1 }
  dialogOpen.value = true
  nextTick(() => formRef.value?.clearValidate())
}
async function submit(): Promise<void> {
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (props.mode === 'share') await createShareLink(form.value as any)
    else await createInviteLink(form.value as any)
    ElMessage.success('创建成功')
    dialogOpen.value = false
    routebookId.value = Number(form.value.routebookId)
    await loadData()
  } catch (error) {
    console.warn(`${config.value.itemName}创建失败，请检查表单和接口返回。`, error)
  } finally { submitting.value = false }
}
async function disable(row: Record<string, any>): Promise<void> {
  await ElMessageBox.confirm(`禁用后现有${config.value.itemName}将无法继续使用，确定吗？`, '禁用确认', { type: 'warning' })
  if (props.mode === 'share') await disableShareLink(Number(row.id)); else await disableInviteLink(Number(row.id))
  ElMessage.success('已禁用')
  await loadData()
}
async function copyLink(row: Record<string, any>): Promise<void> {
  const prefix = props.mode === 'share' ? '/s/' : '/invite/'
  await navigator.clipboard.writeText(`${window.location.origin}${prefix}${row[config.value.codeProp]}`)
  ElMessage.success('链接已复制')
}
function beforeClose(done: () => void): void { if (!submitting.value) done() }
onMounted(loadData)
</script>

<style scoped lang="scss">
.business-panel { border: 1px solid var(--roadbook-border); border-radius: var(--roadbook-radius); background: var(--roadbook-panel-bg); box-shadow: var(--roadbook-shadow); }
.filter-bar { display: flex; padding: 16px; margin-bottom: 16px; align-items: center; gap: 8px; }
.routebook-filter { width: 280px !important; }
.table-panel { min-height: 320px; padding: 16px; }
</style>
