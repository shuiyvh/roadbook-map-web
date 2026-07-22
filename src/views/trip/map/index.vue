<template>
  <business-page title="地图服务" description="搜索高德 POI、规划驾车路线并生成导航唤醒链接。">
    <template #actions><el-button type="primary" icon="Search" :loading="searching" @click="runSearch">搜索点位</el-button></template>
    <section class="map-layout">
      <div class="business-panel search-card">
        <h2>POI 搜索</h2>
        <el-form label-position="top" :model="searchForm">
          <el-form-item label="关键词"><el-input v-model="searchForm.keywords" placeholder="景点、酒店、加油站…" @keyup.enter="runSearch" /></el-form-item>
          <el-form-item label="区域"><el-input v-model="searchForm.region" placeholder="城市名称或行政区编码" /></el-form-item>
          <el-form-item label="POI 类型"><el-input v-model="searchForm.types" placeholder="可选，高德 POI 类型编码" /></el-form-item>
          <el-form-item><el-checkbox v-model="searchForm.cityLimit">仅搜索当前区域</el-checkbox></el-form-item>
        </el-form>
        <el-divider />
        <div class="secondary-actions"><el-button icon="Guide" @click="routeOpen = true">路线规划</el-button><el-button icon="Location" @click="navigationOpen = true">生成导航链接</el-button></div>
      </div>
      <div class="business-panel result-card">
        <page-state v-if="searching" type="loading" description="正在调用地图服务搜索点位" />
        <page-state v-else-if="searchError" type="error" description="POI 搜索失败，请检查地图接口和搜索条件。" action-text="重试" @action="runSearch" />
        <page-state v-else-if="!searched" description="填写关键词后搜索，真实 POI 结果将在此展示。" />
        <page-state v-else-if="poiRows.length === 0" description="没有找到匹配点位，请尝试更换关键词或区域。" />
        <div v-else class="poi-grid"><article v-for="poi in poiRows" :key="String(poi.id || poi.name)"><div><strong>{{ poi.name || '未命名点位' }}</strong><p>{{ poi.address || '地址信息暂无' }}</p></div><el-button link type="primary" @click="showPoiDetail(poi)">查看详情</el-button><small>{{ poi.type || '类型未知' }}<span v-if="poi.distance"> · {{ poi.distance }} m</span></small></article></div>
      </div>
    </section>
    <el-dialog v-model="routeOpen" title="驾车路线规划" width="620px" append-to-body :close-on-click-modal="false"><el-form label-width="90px"><div class="coordinate-grid"><el-form-item label="起点经度"><el-input-number v-model="routeForm.originLng" :precision="6" /></el-form-item><el-form-item label="起点纬度"><el-input-number v-model="routeForm.originLat" :precision="6" /></el-form-item><el-form-item label="终点经度"><el-input-number v-model="routeForm.destinationLng" :precision="6" /></el-form-item><el-form-item label="终点纬度"><el-input-number v-model="routeForm.destinationLat" :precision="6" /></el-form-item></div><el-form-item label="规划策略"><el-input v-model="routeForm.strategy" placeholder="可选，高德路线策略" /></el-form-item></el-form><pre v-if="routeResult" class="result-json">{{ formatResult(routeResult) }}</pre><template #footer><el-button @click="routeOpen = false">关闭</el-button><el-button type="primary" :loading="planning" @click="runPlan">开始规划</el-button></template></el-dialog>
    <el-dialog v-model="navigationOpen" title="生成高德导航链接" width="620px" append-to-body :close-on-click-modal="false"><el-form label-width="90px"><div class="coordinate-grid"><el-form-item label="目标经度"><el-input-number v-model="navigationForm.toLng" :precision="6" /></el-form-item><el-form-item label="目标纬度"><el-input-number v-model="navigationForm.toLat" :precision="6" /></el-form-item></div><el-form-item label="目标名称"><el-input v-model="navigationForm.toName" /></el-form-item><el-form-item label="导航模式"><el-select v-model="navigationForm.mode"><el-option label="驾车" value="car" /><el-option label="骑行" value="ride" /><el-option label="步行" value="walk" /></el-select></el-form-item></el-form><el-input v-if="navigationResult" :model-value="navigationResult" readonly><template #append><el-button @click="copyNavigation">复制</el-button></template></el-input><template #footer><el-button @click="navigationOpen = false">关闭</el-button><el-button type="primary" :loading="navigating" @click="runNavigation">生成链接</el-button></template></el-dialog>
    <el-dialog v-model="detailOpen" title="POI 详情" width="680px" append-to-body><pre class="result-json">{{ formatResult(poiDetail) }}</pre><template #footer><el-button @click="detailOpen = false">关闭</el-button></template></el-dialog>
  </business-page>
</template>

<script setup lang="ts" name="TripMap">
import { ElMessage } from 'element-plus'
import BusinessPage from '@/components/BusinessPage/index.vue'; import PageState from '@/components/BusinessPage/PageState.vue'
import { createNavigationUri, getPoiDetail, planRoute, searchPoi } from '@/api/trip/map'
import type { AmapNavigationUriRequest, AmapRoutePlanRequest, PoiItem, PoiSearchQuery } from '@/types/api/trip/map'
const searchForm = reactive<PoiSearchQuery>({ keywords: '', pageNum: 1, pageSize: 20, cityLimit: false }); const searching = ref(false); const searchError = ref(false); const searched = ref(false); const poiRows = ref<PoiItem[]>([])
const routeOpen = ref(false); const planning = ref(false); const routeForm = reactive<AmapRoutePlanRequest>({ originLng: 0, originLat: 0, destinationLng: 0, destinationLat: 0 }); const routeResult = ref<unknown>()
const navigationOpen = ref(false); const navigating = ref(false); const navigationForm = reactive<AmapNavigationUriRequest>({ toLng: 0, toLat: 0, mode: 'car' }); const navigationResult = ref('')
const detailOpen = ref(false); const poiDetail = ref<unknown>()
async function runSearch(): Promise<void> { if (!searchForm.keywords.trim()) { ElMessage.warning('请先输入搜索关键词'); return } searching.value = true; searchError.value = false; try { const response: any = await searchPoi(searchForm); const payload = response.data || {}; poiRows.value = Array.isArray(payload) ? payload : payload.pois || payload.list || payload.rows || []; searched.value = true } catch (error) { searchError.value = true; console.warn('POI 搜索失败，请检查地图搜索接口。', error) } finally { searching.value = false } }
async function showPoiDetail(poi: PoiItem): Promise<void> { detailOpen.value = true; poiDetail.value = poi; if (!poi.id) return; try { const response = await getPoiDetail(String(poi.id)); poiDetail.value = response.data || poi } catch (error) { console.warn('POI 详情加载失败。', error) } }
async function runPlan(): Promise<void> { planning.value = true; try { const response = await planRoute(routeForm); routeResult.value = response.data || response; ElMessage.success('路线规划完成') } catch (error) { console.warn('路线规划失败，请检查坐标和接口返回。', error) } finally { planning.value = false } }
async function runNavigation(): Promise<void> { navigating.value = true; try { const response: any = await createNavigationUri(navigationForm); const data = response.data; navigationResult.value = typeof data === 'string' ? data : data?.uri || data?.url || ''; if (!navigationResult.value) navigationResult.value = formatResult(data); ElMessage.success('导航链接已生成') } catch (error) { console.warn('导航链接生成失败。', error) } finally { navigating.value = false } }
async function copyNavigation(): Promise<void> { await navigator.clipboard.writeText(navigationResult.value); ElMessage.success('导航链接已复制') }
function formatResult(value: unknown): string { return typeof value === 'string' ? value : JSON.stringify(value, null, 2) }
</script>

<style scoped lang="scss">
.map-layout { display: grid; grid-template-columns: 300px minmax(0,1fr); gap: 16px; }.business-panel { border: 1px solid var(--roadbook-border); border-radius: var(--roadbook-radius); background: var(--roadbook-panel-bg); box-shadow: var(--roadbook-shadow); }.search-card,.result-card { padding: 20px; }.search-card h2 { margin: 0 0 18px; font-size: 16px; }.secondary-actions { display: grid; gap: 8px; }.poi-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }.poi-grid article { display: grid; grid-template-columns: minmax(0,1fr) auto; padding: 16px; border: 1px solid var(--roadbook-border); border-radius: 10px; }.poi-grid p { margin: 6px 0; color: var(--roadbook-text-secondary); }.poi-grid small { grid-column: 1/-1; color: var(--roadbook-text-secondary); }.coordinate-grid { display:grid; grid-template-columns:1fr 1fr; gap:0 12px; }.result-json { max-height:300px; margin:12px 0 0; padding:14px; overflow:auto; border-radius:8px; color:var(--roadbook-text-regular); background:var(--roadbook-panel-muted); white-space:pre-wrap; word-break:break-all; } @media(max-width:900px){.map-layout{grid-template-columns:1fr}.poi-grid{grid-template-columns:1fr}}
</style>
