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
      <template #footer><el-button @click="detailOpen = false">关闭</el-button></template>
    </el-dialog>

    <template #footer><el-button @click="model = false">关闭</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import PageState from '@/components/BusinessPage/PageState.vue'
import { deleteRoutebookPoint, listRoutebookPoints } from '@/api/trip/point'
import { getRoutebook } from '@/api/trip/routebook'
import { listRoutebookSegments } from '@/api/trip/segment'
import { loadAmap } from '@/utils/amapLoader'
import { getDictLabel } from '@/utils/dict'
import type { TripRoutebookPoint, TripRoutebookSegment } from '@/types/api/trip/point'
import type { TripRoutebook } from '@/types/api/trip/routebook'

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
.point-list li { display: grid; grid-template-columns: 32px minmax(0,1fr) auto; padding: 14px 8px; align-items: start; gap: 10px; border-bottom: 1px solid var(--roadbook-border); cursor: pointer; transition: background-color .18s ease; }.point-list li:hover,.point-list li.active { background: color-mix(in srgb,var(--roadbook-primary) 7%,transparent); }.point-order { display: grid; width: 28px; height: 28px; place-items: center; border-radius: 50%; color: white; background: var(--roadbook-primary); font-size: 12px; font-weight: 700; }.point-title { display: flex; align-items: center; gap: 8px; }.point-main strong { color: var(--roadbook-text-primary); font-size: 14px; }.point-main p { margin: 5px 0; color: var(--roadbook-text-secondary); font-size: 12px; line-height: 1.5; }.point-main small { color: var(--roadbook-text-secondary); }.point-actions { display: flex; flex-direction: column; }.map-panel { position: relative; min-height: 620px; }.map-container,.map-state { position: absolute; inset: 0; }.map-container.hidden { visibility: hidden; }.map-state { display: grid; place-items: center; background: var(--roadbook-panel-bg); }
@media(max-width:900px){.route-layout{grid-template-columns:1fr}.point-panel{max-height:360px}.map-panel{min-height:460px}}
</style>
