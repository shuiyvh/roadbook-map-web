<template>
  <business-page title="路书管理" description="维护路书基础信息，并执行复制、发布、归档和删除等业务操作。">
    <template #actions><el-button type="primary" icon="Plus" @click="openCreate">新建路书</el-button></template>
    <section class="business-panel search-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="标题"><el-input v-model="query.title" clearable placeholder="请输入路书标题" @keyup.enter="search" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="query.status" clearable placeholder="全部状态" style="width: 160px"><el-option v-for="item in trip_routebook_status" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item label="可见性"><el-select v-model="query.visibility" clearable placeholder="全部可见性" style="width: 160px"><el-option v-for="item in trip_routebook_visibility" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item label="路线模式"><el-select v-model="query.routeMode" clearable placeholder="全部模式" style="width: 150px"><el-option v-for="item in trip_route_mode" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item label="模板"><el-select v-model="query.templateFlag" clearable placeholder="全部" style="width: 120px"><el-option v-for="item in trip_template_flag" :key="item.value" :label="item.label" :value="Number(item.value)" /></el-select></el-form-item>
        <el-form-item><el-button icon="Search" @click="search">查询</el-button><el-button icon="Refresh" @click="resetSearch">重置</el-button></el-form-item>
      </el-form>
    </section>
    <section class="business-panel table-panel">
      <page-state v-if="loading" type="loading" description="正在读取路书列表" />
      <page-state v-else-if="loadError" type="error" description="路书列表加载失败，请检查接口后重试。" action-text="重新加载" @action="loadData" />
      <page-state v-else-if="rows.length === 0" description="当前没有路书，可点击右上角创建第一条路书。" />
      <template v-else>
        <el-table :data="rows" stripe>
          <el-table-column label="路书" min-width="240"><template #default="scope"><div class="routebook-cell"><div class="cover" :style="coverStyle(scope.row.coverUrl)" /><div><strong>{{ scope.row.title || '未命名路书' }}</strong><small>{{ scope.row.startName || '起点待完善' }} → {{ scope.row.endName || '终点待完善' }}</small></div></div></template></el-table-column>
          <el-table-column label="状态" width="100"><template #default="scope"><dict-tag :options="trip_routebook_status" :value="scope.row.status" /></template></el-table-column>
          <el-table-column label="可见性" width="110"><template #default="scope"><dict-tag :options="trip_routebook_visibility" :value="scope.row.visibility" /></template></el-table-column>
          <el-table-column label="路线模式" width="110"><template #default="scope"><dict-tag :options="trip_route_mode" :value="scope.row.routeMode" /></template></el-table-column>
          <el-table-column label="模板" width="90"><template #default="scope"><dict-tag :options="trip_template_flag" :value="scope.row.templateFlag" /></template></el-table-column>
          <el-table-column label="距离" width="110"><template #default="scope">{{ formatDistance(scope.row.totalDistanceM) }}</template></el-table-column>
          <el-table-column label="更新时间" prop="updateTime" min-width="170" />
          <el-table-column label="操作" width="280" fixed="right"><template #default="scope"><el-button link type="primary" @click="openRouteViewer(scope.row)">查看路线</el-button><el-button link type="danger" @click="handleMore('delete', scope.row)">删除</el-button><el-button link @click="copy(scope.row)">复制</el-button><el-dropdown @command="(command: string) => handleMore(command, scope.row)"><el-button link type="primary">更多<el-icon><ArrowDown /></el-icon></el-button><template #dropdown><el-dropdown-menu><el-dropdown-item command="publish">发布</el-dropdown-item><el-dropdown-item command="archive">归档</el-dropdown-item><el-dropdown-item command="template">标记模板</el-dropdown-item></el-dropdown-menu></template></el-dropdown></template></el-table-column>
        </el-table>
        <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadData" />
      </template>
    </section>
    <el-dialog v-model="dialogOpen" title="新建路书" width="680px" append-to-body :close-on-click-modal="false" :before-close="beforeClose">
      <div v-loading="detailLoading"><el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="路书标题" prop="title"><el-input v-model="form.title" placeholder="请输入清晰的路书标题" /></el-form-item>
        <el-form-item label="路线起点" prop="startName">
          <poi-selector v-model="form.startName" placeholder="搜索并选择起点" />
        </el-form-item>
        <el-form-item label="路线终点" prop="endName">
          <poi-selector v-model="form.endName" placeholder="搜索并选择终点" />
        </el-form-item>
        <el-form-item label="路书封面">
          <image-upload v-model="form.coverUrl" action="/common/minio/upload" :limit="1" :drag="false" :file-size="8" />
        </el-form-item>
        <el-form-item label="可见性"><el-select v-model="form.visibility" placeholder="请选择可见性" style="width: 100%"><el-option v-for="item in trip_routebook_visibility" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item label="路线策略"><div class="form-grid"><el-select v-model="form.routeMode" placeholder="路线模式"><el-option v-for="item in trip_route_mode" :key="item.value" :label="item.label" :value="item.value" /></el-select><el-input v-model="form.routePolicy" placeholder="路线策略" /></div></el-form-item>
        <el-form-item label="路书描述"><el-input v-model="form.description" type="textarea" :rows="4" placeholder="说明路线特点、天数和注意事项" /></el-form-item>
      </el-form></div>
      <template #footer><el-button :disabled="submitting" @click="dialogOpen = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submit">保存</el-button></template>
    </el-dialog>
    <route-viewer v-model="routeViewerOpen" :routebook="selectedRoutebook" @point-deleted="loadData" />
  </business-page>
</template>

<script setup lang="ts" name="TripRoutebook">
import { ElMessage, ElMessageBox } from 'element-plus'
import BusinessPage from '@/components/BusinessPage/index.vue'
import PageState from '@/components/BusinessPage/PageState.vue'
import PoiSelector from '@/views/trip/routebook/PoiSelector.vue'
import RouteViewer from '@/views/trip/routebook/RouteViewer.vue'
import { addRoutebook, archiveRoutebook, copyRoutebook, deleteRoutebook, listRoutebooks, markRoutebookTemplate, publishRoutebook } from '@/api/trip/routebook'
import type { TripRoutebook, TripRoutebookQuery } from '@/types/api/trip/routebook'
const { trip_routebook_status, trip_routebook_visibility, trip_route_mode, trip_template_flag } = useDict('trip_routebook_status', 'trip_routebook_visibility', 'trip_route_mode', 'trip_template_flag')
const query = reactive<TripRoutebookQuery>({ pageNum: 1, pageSize: 10, orderByColumn: 'updateTime', isAsc: 'desc' })
const rows = ref<TripRoutebook[]>([]); const total = ref(0); const loading = ref(false); const loadError = ref(false)
const dialogOpen = ref(false); const detailLoading = ref(false); const submitting = ref(false); const form = ref<TripRoutebook>({}); const formRef = ref<any>()
const routeViewerOpen = ref(false); const selectedRoutebook = ref<TripRoutebook>()
const rules: Record<string, any[]> = {
  title: [{ required: true, message: '请填写路书标题', trigger: 'blur' }],
  startName: [{ required: true, message: '请从地图搜索结果中选择起点', trigger: 'change' }],
  endName: [{ required: true, message: '请从地图搜索结果中选择终点', trigger: 'change' }]
}
async function loadData(): Promise<void> { loading.value = true; loadError.value = false; try { const response = await listRoutebooks(query); rows.value = response.rows || []; total.value = response.total || 0 } catch (error) { loadError.value = true; console.warn('路书列表加载失败，请检查路书分页接口。', error) } finally { loading.value = false } }
function search(): void { query.pageNum = 1; loadData() }
function resetSearch(): void { query.title = undefined; query.status = undefined; query.visibility = undefined; query.routeMode = undefined; query.templateFlag = undefined; search() }
function openCreate(): void { form.value = { visibility: 'PRIVATE', routeMode: 'DRIVING' }; dialogOpen.value = true; nextTick(() => formRef.value?.clearValidate()) }
function openRouteViewer(row: TripRoutebook): void { selectedRoutebook.value = row; routeViewerOpen.value = true }
async function submit(): Promise<void> { await formRef.value?.validate(); submitting.value = true; try { await addRoutebook(form.value); ElMessage.success('创建成功'); dialogOpen.value = false; await loadData() } catch (error) { console.warn('路书创建失败，请检查表单和接口返回。', error) } finally { submitting.value = false } }
async function copy(row: TripRoutebook): Promise<void> { await copyRoutebook(Number(row.id)); ElMessage.success('路书已复制'); await loadData() }
async function handleMore(command: string, row: TripRoutebook): Promise<void> {
  const id = Number(row.id)
  if (command === 'delete') { await ElMessageBox.confirm(`确定删除“${row.title}”吗？`, '删除确认', { type: 'warning' }); await deleteRoutebook(id); ElMessage.success('删除成功') }
  if (command === 'publish') { await publishRoutebook(id); ElMessage.success('发布成功') }
  if (command === 'archive') { await archiveRoutebook(id); ElMessage.success('归档成功') }
  if (command === 'template') { const result = await ElMessageBox.prompt('请输入模板名称', '标记为模板', { inputValue: row.title || '' }); await markRoutebookTemplate(id, { templateName: result.value }); ElMessage.success('已标记为模板') }
  await loadData()
}
function formatDistance(distance?: number): string { return distance === undefined ? '--' : `${Math.round(distance / 1000)} km` }
function coverStyle(url?: string): Record<string, string> { return url ? { backgroundImage: `url("${encodeURI(url).replace(/"/g, '%22')}")` } : {} }
function beforeClose(done: () => void): void { if (!submitting.value) done() }
onMounted(loadData)
</script>

<style scoped lang="scss">
.business-panel { border: 1px solid var(--roadbook-border); border-radius: var(--roadbook-radius); background: var(--roadbook-panel-bg); box-shadow: var(--roadbook-shadow); }
.search-panel { padding: 16px 20px 0; margin-bottom: 16px; }.table-panel { min-height: 340px; padding: 16px; }
.routebook-cell { display: flex; align-items: center; gap: 12px; }.routebook-cell strong,.routebook-cell small { display: block; }.routebook-cell small { margin-top: 5px; color: var(--roadbook-text-secondary); }
.cover { width: 54px; height: 42px; flex: none; border-radius: 7px; background: linear-gradient(145deg,#d9e2ff,#8ba7ef) center/cover; }.form-grid { display: grid; width: 100%; grid-template-columns: 1fr 1fr; gap: 12px; }
</style>
