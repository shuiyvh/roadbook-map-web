<template>
  <el-dialog
    v-model="model"
    :title="`${routebook?.title || '路书'} · 完整路线`"
    width="94vw"
    top="3vh"
    append-to-body
    destroy-on-close
    class="route-viewer-dialog"
    @opened="handleOpened"
    @closed="destroyMap"
  >
    <div class="route-summary">
      <div><small>点位</small><strong>{{ points.length }}</strong></div>
      <div><small>总里程</small><strong>{{ formatDistance(detail?.totalDistanceM) }}</strong></div>
      <div><small>预计耗时</small><strong>{{ formatDuration(detail?.totalDurationS) }}</strong></div>
      <el-tag v-if="usingFallbackPath" type="warning" effect="plain">部分路段为简化连线</el-tag>
    </div>

    <page-state v-if="loading" type="loading" description="正在读取路书点位和完整路径" />
    <page-state v-else-if="loadError" type="error" description="路书路线加载失败，请检查点位和分段路线接口。" action-text="重新加载" @action="loadRouteData" />
    <div v-else class="route-layout">
      <aside class="point-panel">
        <div class="panel-heading">
          <div><h3>途经点位</h3><p>按路书顺序展示全部行程点</p></div>
          <el-button v-if="points.length > 0" size="small" icon="Calendar" @click="openDayPlan">安排天数</el-button>
        </div>
        <el-alert v-if="segmentError" title="分段路线读取失败，地图暂按点位顺序绘制简化路径。" type="warning" :closable="false" show-icon />
        <page-state v-if="points.length === 0" description="当前路书还没有点位，暂无可展示的路线。" />
        <ol v-else class="point-list">
          <li
            v-for="(point, index) in points"
            :key="point.id || index"
            :class="{ active: selectedPoint?.id === point.id }"
            @click="focusPoint(point)"
          >
            <span class="point-order">{{ index + 1 }}</span>
            <div class="point-main">
              <div class="point-title"><strong>{{ point.pointName || '未命名点位' }}</strong><el-tag v-if="point.dayNo" size="small" effect="plain">第 {{ point.dayNo }} 天</el-tag></div>
              <p>{{ point.address || '暂无详细地址' }}</p>
              <small>{{ getDictLabel(trip_point_type, point.pointType, '未分类') }} · {{ getDictLabel(trip_point_source, point.source, '来源未知') }}<template v-if="point.stayMinutes"> · 停留 {{ point.stayMinutes }} 分钟</template></small>
            </div>
            <div class="point-actions" @click.stop>
              <el-button link @click="showPoint(point)">查看</el-button>
              <el-button link type="danger" :loading="deletingPointId === point.id" @click="removePoint(point)">删除</el-button>
            </div>
          </li>
        </ol>
      </aside>

      <section class="map-panel">
        <div v-if="mapLoading" class="map-state"><page-state type="loading" description="正在加载高德地图并绘制路线" /></div>
        <div v-else-if="mapError" class="map-state"><page-state type="error" :description="mapError" action-text="重试地图" @action="initializeMap" /></div>
        <div ref="mapContainerRef" class="map-container" :class="{ hidden: mapLoading || mapError }" />
      </section>
    </div>

    <el-dialog v-model="dayPlanOpen" title="每日行程安排" width="760px" append-to-body :close-on-click-modal="false" @open="initDayPlanRows">
      <p class="dayplan-tip">按路书顺序为每个点位设置所属天（第几天从 1 开始），点位数多时建议按每天 4~6 个点位拆分，保存后点位旁会显示对应天数标签。</p>
      <div v-if="dayPlanStats.length > 0" class="dayplan-stats">
        <el-tag v-for="item in dayPlanStats" :key="item.dayNo" type="info" effect="plain" size="small">第 {{ item.dayNo }} 天 · {{ item.count }} 个点位</el-tag>
      </div>
      <el-table :data="dayPlanRows" max-height="400" size="small" border>
        <el-table-column type="index" label="顺序" width="60" align="center" />
        <el-table-column prop="pointName" label="点位" min-width="220" show-overflow-tooltip />
        <el-table-column label="所属天数" width="160" align="center">
          <template #default="scope">
            <el-input-number v-model="scope.row.dayNo" :min="1" :max="30" size="small" controls-position="right" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button :disabled="daySaving" @click="dayPlanOpen = false">取消</el-button>
        <el-button type="primary" :loading="daySaving" @click="saveDayPlan">保存安排</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="detailOpen" title="点位详情" width="620px" append-to-body>
      <el-descriptions v-if="selectedPoint" :column="2" border>
        <el-descriptions-item label="点位名称" :span="2">{{ selectedPoint.pointName || '--' }}</el-descriptions-item>
        <el-descriptions-item label="点位类型"><dict-tag :options="trip_point_type" :value="selectedPoint.pointType" /></el-descriptions-item>
        <el-descriptions-item label="所属行程">{{ selectedPoint.dayNo ? `第 ${selectedPoint.dayNo} 天` : '--' }}</el-descriptions-item>
        <el-descriptions-item label="经度">{{ selectedPoint.lng ?? '--' }}</el-descriptions-item>
        <el-descriptions-item label="纬度">{{ selectedPoint.lat ?? '--' }}</el-descriptions-item>
        <el-descriptions-item label="详细地址" :span="2">{{ selectedPoint.address || '--' }}</el-descriptions-item>
        <el-descriptions-item label="建议停留">{{ selectedPoint.stayMinutes ? `${selectedPoint.stayMinutes} 分钟` : '--' }}</el-descriptions-item>
        <el-descriptions-item label="打卡半径">{{ selectedPoint.checkinRadiusM ? `${selectedPoint.checkinRadiusM} 米` : '--' }}</el-descriptions-item>
        <el-descriptions-item label="点位来源"><dict-tag :options="trip_point_source" :value="selectedPoint.source" /></el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ selectedPoint.remark || '--' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">点位评论（{{ comments.length }}）</el-divider>
      <ul v-if="comments.length > 0" class="comment-list">
        <li v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-head">
            <strong>{{ comment.userName || '匿名' }}</strong>
            <small>{{ comment.createTime }}</small>
            <span v-if="isMyComment(comment)" class="comment-mine">我</span>
          </div>
          <p v-if="editingCommentId !== comment.id" class="comment-content">{{ comment.commentContent }}</p>
          <div v-else class="comment-edit">
            <el-input
              v-model="editingDraft"
              type="textarea"
              :rows="2"
              maxlength="1000"
              show-word-limit
              placeholder="修改评论内容"
            />
            <div class="comment-edit-actions">
              <el-button size="small" @click="editingCommentId = undefined">取消</el-button>
              <el-button
                size="small"
                type="primary"
                :loading="commentSaving"
                :disabled="!editingDraft.trim()"
                @click="saveEditComment(comment)"
              >
                保存
              </el-button>
            </div>
          </div>
          <div v-if="isMyComment(comment) && editingCommentId !== comment.id" class="comment-actions">
            <el-button link type="primary" @click="startEditComment(comment)">编辑</el-button>
            <el-button link type="danger" @click="removeComment(comment)">删除</el-button>
          </div>
        </li>
      </ul>
      <el-empty v-else description="暂无评论，发表第一条评价吧" :image-size="60" />
      <div v-if="selectedPoint" class="comment-add">
        <el-input
          v-model="draftComment"
          type="textarea"
          :rows="2"
          maxlength="1000"
          show-word-limit
          placeholder="写下对当前点位的评价或建议（1000 字以内）"
        />
        <div class="comment-add-actions">
          <el-button type="primary" :loading="commentSaving" :disabled="!draftComment.trim()" @click="addComment">发布评论</el-button>
        </div>
      </div>
      <template #footer><el-button @click="detailOpen = false">关闭</el-button></template>
    </el-dialog>

    <template #footer><el-button @click="model = false">关闭</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import useUserStore from '@/store/modules/user'
import PageState from '@/components/BusinessPage/PageState.vue'
import { assignRoutebookDayPlan, deleteRoutebookPoint, listRoutebookPoints } from '@/api/trip/point'
import { addPointComment, deletePointComment, listPointComments, updatePointComment } from '@/api/trip/comment'
import { getRoutebook } from '@/api/trip/routebook'
import { listRoutebookSegments } from '@/api/trip/segment'
import { loadAmap } from '@/utils/amapLoader'
import { getDictLabel } from '@/utils/dict'
import type { TripPointComment, TripRoutebookPoint, TripRoutebookSegment } from '@/types/api/trip/point'
import type { TripRoutebook } from '@/types/api/trip/routebook'

/** 每日行程安排弹窗的可编辑行。 */
interface DayPlanRow {
  pointId?: number
  pointName?: string
  dayNo: number
}

const props = defineProps<{ routebook?: TripRoutebook }>()
const { trip_point_type, trip_point_source } = useDict('trip_point_type', 'trip_point_source')
const emit = defineEmits<{ pointDeleted: [] }>()
const model = defineModel<boolean>({ default: false })
const detail = ref<TripRoutebook>()
const points = ref<TripRoutebookPoint[]>([])
const segments = ref<TripRoutebookSegment[]>([])
const loading = ref(false)
const loadError = ref(false)
const segmentError = ref(false)
const mapLoading = ref(false)
const mapError = ref('')
const usingFallbackPath = ref(false)
const deletingPointId = ref<number>()
const selectedPoint = ref<TripRoutebookPoint>()
const detailOpen = ref(false)
const dayPlanOpen = ref(false)
const dayPlanRows = ref<DayPlanRow[]>([])
const daySaving = ref(false)
const comments = ref<TripPointComment[]>([])
const draftComment = ref('')
const editingCommentId = ref<number>()
const editingDraft = ref('')
const commentSaving = ref(false)
const userStore = useUserStore()
const mapContainerRef = ref<HTMLElement>()
let amap: any
let mapInstance: any
let mapOverlays: any[] = []
let markerByPointId = new Map<number, any>()

watch(() => model.value, (open: boolean) => {
  if (open) loadRouteData()
})

async function loadRouteData(): Promise<void> {
  const routebookId = Number(props.routebook?.id)
  if (!routebookId) return
  loading.value = true
  loadError.value = false
  segmentError.value = false
  try {
    const [detailResult, pointResult, segmentResult] = await Promise.allSettled([
      getRoutebook(routebookId),
      listRoutebookPoints(routebookId),
      listRoutebookSegments(routebookId)
    ])
    if (pointResult.status === 'rejected') throw pointResult.reason
    detail.value = detailResult.status === 'fulfilled' ? detailResult.value.data || props.routebook : props.routebook
    points.value = normalizeList<TripRoutebookPoint>(pointResult.value).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    if (segmentResult.status === 'fulfilled') {
      segments.value = normalizeList<TripRoutebookSegment>(segmentResult.value).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    } else {
      segments.value = []
      segmentError.value = true
      console.warn('路书分段路线加载失败，将使用点位坐标绘制简化路径。', segmentResult.reason)
    }
    if (mapInstance) renderRoute()
  } catch (error) {
    loadError.value = true
    console.warn('路书点位加载失败，无法展示完整路线。', error)
  } finally {
    loading.value = false
  }
}

function normalizeList<T>(response: any): T[] {
  const payload = response?.data
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.list)) return payload.list
  return []
}

function handleOpened(): void {
  nextTick(initializeMap)
}

async function initializeMap(): Promise<void> {
  if (!mapContainerRef.value) return
  mapLoading.value = true
  mapError.value = ''
  try {
    amap = await loadAmap()
    destroyMap()
    mapInstance = new amap.Map(mapContainerRef.value, {
      zoom: 10,
      center: [104.0668, 30.5728],
      resizeEnable: true,
      viewMode: '2D'
    })
    mapInstance.addControl(new amap.Scale())
    renderRoute()
  } catch (error) {
    mapError.value = error instanceof Error ? `${error.message}，请检查地图密钥或网络后重试。` : '高德地图加载失败，请检查地图密钥或网络后重试。'
    console.warn('高德地图初始化失败。', error)
  } finally {
    mapLoading.value = false
  }
}

/**
 * 按点位顺序逐段匹配后端路线：有 polyline 时绘制真实道路折线；缺失的相邻段
 * 使用两个点位坐标兜底直连，确保删除点位或分段尚未重算时仍能完整表达行程顺序。
 */
function renderRoute(): void {
  if (!mapInstance || !amap) return
  mapInstance.remove(mapOverlays)
  mapOverlays = []
  markerByPointId = new Map<number, any>()
  usingFallbackPath.value = false

  const validPoints = points.value.filter(hasCoordinates)
  validPoints.forEach((point: TripRoutebookPoint, index: number) => {
    const markerContent = document.createElement('div')
    markerContent.textContent = String(index + 1)
    Object.assign(markerContent.style, {
      display: 'grid', width: '30px', height: '30px', placeItems: 'center', border: '3px solid white',
      borderRadius: '50% 50% 50% 8px', color: 'white', background: '#356df3', boxShadow: '0 4px 12px rgba(20,45,90,.28)',
      fontSize: '12px', fontWeight: '700', transform: 'rotate(-45deg)'
    })
    const label = document.createElement('span')
    label.textContent = String(index + 1)
    label.style.transform = 'rotate(45deg)'
    markerContent.textContent = ''
    markerContent.appendChild(label)
    const marker = new amap.Marker({ position: [Number(point.lng), Number(point.lat)], content: markerContent, offset: new amap.Pixel(-15, -30), title: point.pointName || '' })
    marker.on('click', () => focusPoint(point))
    mapOverlays.push(marker)
    if (point.id) markerByPointId.set(Number(point.id), marker)
  })

  for (let index = 0; index < validPoints.length - 1; index += 1) {
    const from = validPoints[index]
    const to = validPoints[index + 1]
    const segment = findSegment(from, to, index)
    const segmentPath = parsePolyline(segment?.polyline)
    const path = segmentPath.length >= 2 ? segmentPath : [[Number(from.lng), Number(from.lat)], [Number(to.lng), Number(to.lat)]]
    if (segmentPath.length < 2) usingFallbackPath.value = true
    const line = new amap.Polyline({ path, strokeColor: '#356df3', strokeWeight: 6, strokeOpacity: 0.9, lineJoin: 'round', lineCap: 'round', showDir: true })
    mapOverlays.push(line)
  }

  if (mapOverlays.length > 0) {
    mapInstance.add(mapOverlays)
    mapInstance.setFitView(mapOverlays, false, [56, 56, 56, 56], 16)
  }
}

function hasCoordinates(point: TripRoutebookPoint): boolean {
  return Number.isFinite(Number(point.lng)) && Number.isFinite(Number(point.lat))
}

function findSegment(from: TripRoutebookPoint, to: TripRoutebookPoint, index: number): TripRoutebookSegment | undefined {
  const exactSegment = segments.value.find((segment: TripRoutebookSegment) => Number(segment.fromPointId) === Number(from.id) && Number(segment.toPointId) === Number(to.id))
  if (exactSegment) return exactSegment
  // 仅兼容未返回起止点 ID 的旧数据；有明确起止点的失效分段不能按下标误配。
  return segments.value.find((segment: TripRoutebookSegment) => segment.fromPointId === undefined && segment.toPointId === undefined && Number(segment.sortOrder || 0) === index)
}

function parsePolyline(polyline?: string): number[][] {
  if (!polyline) return []
  return polyline.split(/[;|]/).map(item => item.trim().split(',').map(Number)).filter(item => item.length >= 2 && Number.isFinite(item[0]) && Number.isFinite(item[1])).map(item => [item[0], item[1]])
}

function focusPoint(point: TripRoutebookPoint): void {
  selectedPoint.value = point
  if (!mapInstance || !hasCoordinates(point)) return
  mapInstance.setZoomAndCenter(Math.max(Number(mapInstance.getZoom()), 15), [Number(point.lng), Number(point.lat)], false, 300)
}

function showPoint(point: TripRoutebookPoint): void {
  focusPoint(point)
  detailOpen.value = true
  loadComments(point)
}

/**
 * 加载当前点位评论列表。
 */
async function loadComments(point: TripRoutebookPoint): Promise<void> {
  const routebookId = Number(props.routebook?.id)
  const pointId = Number(point.id)
  if (!routebookId || !pointId) return
  try {
    const result = await listPointComments(routebookId, pointId)
    comments.value = normalizeList<TripPointComment>(result)
  } catch (error) {
    comments.value = []
    console.warn('点位评论加载失败，请检查评论接口。', error)
  }
}

/** 判断评论是否属于当前登录用户（用于展示编辑/删除入口）。 */
function isMyComment(comment: TripPointComment): boolean {
  const currentId = userStore.id
  return Boolean(currentId) && String(comment.userId) === String(currentId)
}

/**
 * 新增点位评论：仅富文本内容，作者与时间由后端维护。
 */
async function addComment(): Promise<void> {
  const point = selectedPoint.value
  const routebookId = Number(props.routebook?.id)
  const pointId = Number(point?.id)
  const content = draftComment.value.trim()
  if (!routebookId || !pointId || !content) return
  commentSaving.value = true
  try {
    await addPointComment(routebookId, pointId, { commentContent: content })
    ElMessage.success('评论已发布')
    draftComment.value = ''
    await loadComments(point)
  } catch (error) {
    console.warn('评论发布失败，请检查评论接口和权限。', error)
  } finally {
    commentSaving.value = false
  }
}

/** 进入评论编辑态。 */
function startEditComment(comment: TripPointComment): void {
  editingCommentId.value = Number(comment.id)
  editingDraft.value = comment.commentContent || ''
}

/**
 * 保存评论修改：仅作者本人或管理员可操作，越权由后端拦截提示。
 */
async function saveEditComment(comment: TripPointComment): Promise<void> {
  const point = selectedPoint.value
  const routebookId = Number(props.routebook?.id)
  const pointId = Number(point?.id)
  const commentId = Number(comment.id)
  const content = editingDraft.value.trim()
  if (!routebookId || !pointId || !commentId || !content) return
  commentSaving.value = true
  try {
    await updatePointComment(routebookId, pointId, commentId, { commentContent: content })
    ElMessage.success('评论已更新')
    editingCommentId.value = undefined
    await loadComments(point)
  } catch (error) {
    console.warn('评论更新失败，请检查评论接口和权限。', error)
  } finally {
    commentSaving.value = false
  }
}

/**
 * 删除评论：仅作者本人或管理员可操作，越权由后端拦截提示。
 */
async function removeComment(comment: TripPointComment): Promise<void> {
  const point = selectedPoint.value
  const routebookId = Number(props.routebook?.id)
  const pointId = Number(point?.id)
  const commentId = Number(comment.id)
  if (!routebookId || !pointId || !commentId) return
  await ElMessageBox.confirm('确定删除这条评论吗？删除后不可恢复。', '删除评论', { type: 'warning' })
  commentSaving.value = true
  try {
    await deletePointComment(routebookId, pointId, commentId)
    ElMessage.success('评论已删除')
    await loadComments(point)
  } catch (error) {
    console.warn('评论删除失败，请检查评论接口和权限。', error)
  } finally {
    commentSaving.value = false
  }
}

/**
 * 打开每日行程安排弹窗：以当前点位顺序和天数快照初始化可编辑行。
 */
function openDayPlan(): void {
  dayPlanOpen.value = true
  initDayPlanRows()
}

/** 从点位列表重建可编辑行，天数缺省取点位已有值，未设置时按 1 处理。 */
function initDayPlanRows(): void {
  dayPlanRows.value = points.value.map((point: TripRoutebookPoint) => ({
    pointId: point.id ? Number(point.id) : undefined,
    pointName: point.pointName || '未命名点位',
    dayNo: point.dayNo && point.dayNo > 0 ? point.dayNo : 1
  }))
}

/** 按当前天数配置统计每天点位数量，用于弹窗顶部预览。 */
const dayPlanStats = computed(() => {
  const counts = new Map<number, number>()
  dayPlanRows.value.forEach((row: DayPlanRow) => {
    const day = row.dayNo || 1
    counts.set(day, (counts.get(day) || 0) + 1)
  })
  return Array.from(counts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([dayNo, count]) => ({ dayNo, count }))
})

/** 保存每日行程拆分：仅提交有效点位，成功后刷新点位列表展示最新天数标签。 */
async function saveDayPlan(): Promise<void> {
  const routebookId = Number(props.routebook?.id)
  const payload = dayPlanRows.value
    .filter((row: DayPlanRow) => row.pointId !== undefined)
    .map((row: DayPlanRow) => ({ pointId: row.pointId as number, dayNo: row.dayNo || 1 }))
  if (payload.length === 0 || !routebookId) {
    ElMessage.warning('没有可保存的点位')
    return
  }
  daySaving.value = true
  try {
    await assignRoutebookDayPlan(routebookId, payload)
    ElMessage.success('每日行程安排已保存')
    dayPlanOpen.value = false
    await loadRouteData()
  } catch (error) {
    console.warn('每日行程安排保存失败，请检查天数接口和权限。', error)
  } finally {
    daySaving.value = false
  }
}

async function removePoint(point: TripRoutebookPoint): Promise<void> {
  const routebookId = Number(props.routebook?.id)
  const pointId = Number(point.id)
  if (!routebookId || !pointId) return
  await ElMessageBox.confirm(`删除“${point.pointName || '该点位'}”后，路线将按剩余点位重新展示，确定继续吗？`, '删除点位', { type: 'warning' })
  deletingPointId.value = pointId
  try {
    await deleteRoutebookPoint(routebookId, pointId)
    ElMessage.success('点位已删除')
    if (selectedPoint.value?.id === point.id) selectedPoint.value = undefined
    await loadRouteData()
    emit('pointDeleted')
  } catch (error) {
    console.warn('路书点位删除失败，请检查点位权限和接口返回。', error)
  } finally {
    deletingPointId.value = undefined
  }
}

function destroyMap(): void {
  if (mapInstance) mapInstance.destroy()
  mapInstance = undefined
  mapOverlays = []
  markerByPointId.clear()
}

function formatDistance(value?: number): string {
  return value === undefined ? '--' : `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)} km`
}

function formatDuration(value?: number): string {
  if (value === undefined) return '--'
  const hours = Math.floor(value / 3600)
  const minutes = Math.round((value % 3600) / 60)
  return hours > 0 ? `${hours} 小时 ${minutes} 分` : `${minutes} 分钟`
}

onBeforeUnmount(destroyMap)
</script>

<style scoped lang="scss">
.route-summary { display: flex; min-height: 64px; margin-bottom: 16px; padding: 10px 16px; align-items: center; gap: 32px; border: 1px solid var(--roadbook-border); border-radius: 12px; background: var(--roadbook-panel-muted); }
.route-summary div small,.route-summary div strong { display: block; }.route-summary div small { color: var(--roadbook-text-secondary); font-size: 12px; }.route-summary div strong { margin-top: 4px; color: var(--roadbook-text-primary); font-size: 18px; }
.route-summary .el-tag { margin-left: auto; }.route-layout { display: grid; min-height: 620px; grid-template-columns: 390px minmax(0,1fr); gap: 16px; }.point-panel,.map-panel { min-width: 0; border: 1px solid var(--roadbook-border); border-radius: 12px; overflow: hidden; background: var(--roadbook-panel-bg); }
.point-panel { display: flex; max-height: 68vh; padding: 16px; flex-direction: column; }.panel-heading { display: flex; margin-bottom: 12px; justify-content: space-between; }.panel-heading h3 { margin: 0; color: var(--roadbook-text-primary); font-size: 16px; }.panel-heading p { margin: 5px 0 0; color: var(--roadbook-text-secondary); font-size: 12px; }.point-panel .el-alert { margin-bottom: 12px; }.point-list { min-height: 0; margin: 0; padding: 0; overflow-y: auto; list-style: none; }
.point-list li { display: grid; grid-template-columns: 32px minmax(0,1fr) auto; padding: 14px 8px; align-items: start; gap: 10px; border-bottom: 1px solid var(--roadbook-border); cursor: pointer; transition: background-color .18s ease; }.point-list li:hover,.point-list li.active { background: color-mix(in srgb,var(--roadbook-primary) 7%,transparent); }.point-order { display: grid; width: 28px; height: 28px; place-items: center; border-radius: 50%; color: white; background: var(--roadbook-primary); font-size: 12px; font-weight: 700; }.point-title { display: flex; align-items: center; gap: 8px; }.point-main strong { color: var(--roadbook-text-primary); font-size: 14px; }.point-main p { margin: 5px 0; color: var(--roadbook-text-secondary); font-size: 12px; line-height: 1.5; }.point-main small { color: var(--roadbook-text-secondary); }.point-actions { display: flex; flex-direction: column; }.dayplan-tip { margin: 0 0 12px; color: var(--roadbook-text-secondary); font-size: 13px; line-height: 1.6; }.dayplan-stats { display: flex; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }.comment-list { max-height: 260px; margin: 0; padding: 0; overflow-y: auto; list-style: none; }.comment-item { padding: 10px 0; border-bottom: 1px solid var(--roadbook-border); }.comment-item:last-child { border-bottom: 0; }.comment-head { display: flex; align-items: center; gap: 8px; }.comment-head strong { color: var(--roadbook-text-primary); font-size: 13px; }.comment-head small { color: var(--roadbook-text-secondary); font-size: 12px; }.comment-mine { padding: 0 6px; border-radius: 8px; color: var(--roadbook-primary); background: color-mix(in srgb,var(--roadbook-primary) 12%,transparent); font-size: 12px; }.comment-content { margin: 6px 0; color: var(--roadbook-text-primary); font-size: 13px; line-height: 1.7; white-space: pre-wrap; }.comment-actions { display: flex; justify-content: flex-end; }.comment-edit-actions,.comment-add-actions { display: flex; margin-top: 8px; justify-content: flex-end; }.comment-add { margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--roadbook-border); }.map-panel { position: relative; min-height: 620px; }.map-container,.map-state { position: absolute; inset: 0; }.map-container.hidden { visibility: hidden; }.map-state { display: grid; place-items: center; background: var(--roadbook-panel-bg); }
@media(max-width:900px){.route-layout{grid-template-columns:1fr}.point-panel{max-height:360px}.map-panel{min-height:460px}}
</style>
