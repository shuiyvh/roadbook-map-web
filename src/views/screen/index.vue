<template>
  <main class="roadbook-screen">
    <header class="screen-header">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48"><path d="M5 39 17 14l7 13 7-21 12 33H5Z"/><path d="m14 31 5-6 5 5 5-8 7 9"/></svg>
        </span>
        <div><strong>ROADBOOK</strong><small>摩旅智能路书</small></div>
      </div>

      <label class="global-search">
        <el-icon><Search /></el-icon>
        <input v-model="keyword" placeholder="搜索地点、景点、美食、路线" @keyup.enter="handleSearch" />
        <kbd>⌘ K</kbd>
      </label>

      <nav class="header-actions" aria-label="路书操作">
        <button type="button"><el-icon><Collection /></el-icon><span>我的路书</span></button>
        <button type="button" :class="{ active: collected }" @click="collected = !collected">
          <el-icon><Star /></el-icon><span>{{ collected ? '已收藏' : '收藏' }}</span>
        </button>
        <button type="button" @click="showPlaceholder('分享功能')"><el-icon><Share /></el-icon><span>分享</span></button>
        <button type="button" class="outlined" @click="showPlaceholder('保存功能')"><el-icon><FolderChecked /></el-icon><span>保存</span></button>
        <button type="button" class="publish" @click="showPlaceholder('发布功能')"><el-icon><Promotion /></el-icon><span>发布路书</span></button>
        <img class="avatar" src="@/assets/images/profile.jpg" alt="用户头像" />
      </nav>
    </header>

    <section class="screen-workspace">
      <aside class="route-panel glass-panel">
        <div class="route-heading">
          <div>
            <div class="route-title-row">
              <h1>川西小环线 5日摩旅</h1>
              <button type="button" aria-label="编辑标题"><el-icon><EditPen /></el-icon></button>
            </div>
            <p>草稿 <i></i> 更新于 2026-07-23 14:30</p>
          </div>
          <button type="button" aria-label="展开面板"><el-icon><FullScreen /></el-icon></button>
        </div>

        <div class="route-summary">
          <div><strong>5天</strong><span>行程天数</span></div>
          <div><strong>10个</strong><span>途经地点</span></div>
          <div><strong>860km</strong><span>总里程</span></div>
        </div>

        <div class="route-tabs">
          <button type="button" :class="{ active: leftTab === 'nodes' }" @click="leftTab = 'nodes'">路线节点</button>
          <button type="button" :class="{ active: leftTab === 'overview' }" @click="leftTab = 'overview'">行程概览</button>
        </div>

        <div v-if="leftTab === 'nodes'" class="route-list-wrap">
          <ol class="route-list">
            <li
              v-for="(point, index) in routePoints"
              :key="point.name"
              :class="{ selected: selectedPoint === index }"
              @click="selectedPoint = index"
            >
              <span class="order">{{ index + 1 }}</span>
              <span class="node-icon" :class="`node-icon--${point.tone}`"><component :is="point.icon" /></span>
              <div class="node-copy">
                <strong>{{ point.name }}</strong>
                <small><b :class="`text-${point.tone}`">{{ point.type }}</b>{{ point.distance }}</small>
              </div>
              <el-icon class="drag-handle"><MoreFilled /></el-icon>
            </li>
          </ol>
        </div>
        <div v-else class="overview-copy">
          <span>DAY 01—05</span>
          <h2>从成都出发，穿越雪山与高原湖泊</h2>
          <p>沿雅安、泸定、康定、新都桥、理塘、丹巴组成 860 公里的川西环线。</p>
        </div>

        <div class="route-footer">
          <button type="button" class="primary-soft" @click="showPlaceholder('新增地点')"><el-icon><Plus /></el-icon>添加地点</button>
          <button type="button" @click="showPlaceholder('路线优化')"><el-icon><MagicStick /></el-icon>优化路线</button>
        </div>
      </aside>

      <aside class="map-toolbar glass-panel" aria-label="地图工具">
        <button
          v-for="(tool, index) in mapTools"
          :key="tool.label"
          type="button"
          :class="{ active: activeTool === index }"
          @click="activeTool = index"
        >
          <el-icon><component :is="tool.icon" /></el-icon>
          <span>{{ tool.label }}</span>
        </button>
      </aside>

      <section class="map-stage" aria-label="川西小环线路线地图">
        <svg class="route-line" viewBox="0 0 900 760" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="routeGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <path class="route-shadow" d="M700 315 C650 370 620 450 580 520 C530 610 420 635 300 605 C210 583 150 535 160 450 C170 370 275 380 330 335 C395 283 392 210 355 154 C430 165 505 210 493 285 C480 362 550 330 590 287 C635 238 690 236 700 315Z"/>
          <path class="route-path" d="M700 315 C650 370 620 450 580 520 C530 610 420 635 300 605 C210 583 150 535 160 450 C170 370 275 380 330 335 C395 283 392 210 355 154 C430 165 505 210 493 285 C480 362 550 330 590 287 C635 238 690 236 700 315Z"/>
          <g v-for="(dot, index) in routeDots" :key="index">
            <circle :cx="dot[0]" :cy="dot[1]" r="4" class="route-dot"/>
          </g>
        </svg>

        <button
          v-for="(marker, index) in mapMarkers"
          :key="marker.name"
          type="button"
          class="map-marker"
          :class="[`marker-${marker.tone}`, { active: selectedPoint === marker.pointIndex }]"
          :style="{ left: `${marker.x}%`, top: `${marker.y}%` }"
          @click="selectedPoint = marker.pointIndex"
        >
          <span class="marker-pin"><el-icon><component :is="marker.icon" /></el-icon></span>
          <strong>{{ marker.name }}</strong>
        </button>

        <div class="map-controls glass-panel">
          <button type="button" aria-label="放大地图" @click="zoom = Math.min(18, zoom + 1)"><el-icon><Plus /></el-icon></button>
          <span>{{ zoom }}</span>
          <button type="button" aria-label="缩小地图" @click="zoom = Math.max(6, zoom - 1)"><el-icon><Minus /></el-icon></button>
        </div>
        <button class="locate-button glass-panel" type="button" aria-label="定位当前位置" @click="showPlaceholder('定位功能')">
          <el-icon><Position /></el-icon>
        </button>
        <div class="map-scale"><span>20km</span><i></i></div>
      </section>

      <aside class="recommend-panel glass-panel">
        <div class="recommend-heading">
          <h2><span>🤖</span> AI 智能推荐</h2>
          <button type="button" aria-label="刷新推荐" @click="rotateRecommendations"><el-icon><Refresh /></el-icon></button>
        </div>
        <div class="recommend-tabs" role="tablist">
          <button
            v-for="(tab, index) in recommendTabs"
            :key="tab.label"
            type="button"
            :class="{ active: recommendTab === index }"
            @click="recommendTab = index"
          >
            <el-icon><component :is="tab.icon" /></el-icon>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <div class="recommend-list">
          <article v-for="item in visibleRecommendations" :key="item.title">
            <div class="recommend-image" :style="{ backgroundPosition: item.imagePosition }"><span>{{ item.kind }}</span></div>
            <div class="recommend-copy">
              <h3>{{ item.title }}</h3>
              <p>距当前路线 {{ item.distance }}</p>
              <div class="rating"><strong>★ {{ item.rating }}</strong><span>{{ item.reviews }}条评价</span></div>
              <small>{{ item.tag }}</small>
            </div>
            <button type="button" @click="addRecommendation(item.title)">加入路线</button>
          </article>
        </div>
        <button class="change-batch" type="button" @click="rotateRecommendations"><el-icon><Refresh /></el-icon>换一批</button>
      </aside>

      <section class="trip-metrics glass-panel" aria-label="行程数据">
        <article v-for="metric in metrics" :key="metric.label">
          <span class="metric-icon" :class="`metric-${metric.tone}`"><el-icon><component :is="metric.icon" /></el-icon></span>
          <div><small>{{ metric.label }}</small><strong>{{ metric.value }} <em>{{ metric.unit }}</em></strong><p>{{ metric.note }}</p></div>
        </article>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts" name="RoadbookScreen">
import { ElMessage } from 'element-plus'
import {
  Aim, Camera, Collection, EditPen, Food, FolderChecked, FullScreen, Guide, Histogram,
  House, Location, MagicStick, Menu, Minus, MoreFilled, OfficeBuilding, Picture,
  Plus, Position, Promotion, Refresh, Search, Setting, Share, Star, Stopwatch, Sunny, TrendCharts
} from '@element-plus/icons-vue'

interface RecommendationItem {
  title: string
  distance: string
  rating: string
  reviews: number
  tag: string
  kind: string
  imagePosition: string
}

const keyword = ref('')
const collected = ref(false)
const leftTab = ref<'nodes' | 'overview'>('nodes')
const selectedPoint = ref(0)
const activeTool = ref(0)
const recommendTab = ref(0)
const recommendationOffset = ref(0)
const zoom = ref(12)

const routePoints = [
  { name: '成都', type: '起点', distance: '', tone: 'green', icon: Promotion },
  { name: '雅安', type: '途经点', distance: '134km · 2h', tone: 'blue', icon: Location },
  { name: '泸定', type: '途经点', distance: '101km · 1.5h', tone: 'blue', icon: Location },
  { name: '康定', type: '住宿点', distance: '86km · 1.2h', tone: 'purple', icon: House },
  { name: '新都桥', type: '拍照点', distance: '78km · 1.1h', tone: 'orange', icon: Camera },
  { name: '稻城亚丁', type: '景点', distance: '286km · 5.2h', tone: 'yellow', icon: Picture },
  { name: '理塘', type: '途经点', distance: '128km · 4h', tone: 'blue', icon: Location },
  { name: '丹巴', type: '住宿点', distance: '98km · 1.6h', tone: 'purple', icon: House },
  { name: '四姑娘山', type: '景点', distance: '128km · 2.3h', tone: 'green', icon: Picture },
  { name: '成都', type: '终点', distance: '', tone: 'red', icon: Promotion }
]

const mapTools = [
  { label: '编辑', icon: EditPen },
  { label: '搜索', icon: Search },
  { label: '添加点', icon: Plus },
  { label: '路线规划', icon: Guide },
  { label: '图层', icon: Menu },
  { label: '设置', icon: Setting }
]

const mapMarkers = [
  { name: '成都', x: 76, y: 35, tone: 'green', icon: Promotion, pointIndex: 0 },
  { name: '雅安', x: 68, y: 57, tone: 'blue', icon: Location, pointIndex: 1 },
  { name: '泸定', x: 61, y: 45, tone: 'blue', icon: Location, pointIndex: 2 },
  { name: '康定', x: 35, y: 35, tone: 'purple', icon: House, pointIndex: 3 },
  { name: '新都桥', x: 49, y: 27, tone: 'orange', icon: Camera, pointIndex: 4 },
  { name: '稻城亚丁', x: 35, y: 70, tone: 'yellow', icon: Picture, pointIndex: 5 },
  { name: '理塘', x: 44, y: 63, tone: 'blue', icon: Location, pointIndex: 6 },
  { name: '丹巴', x: 35, y: 17, tone: 'purple', icon: House, pointIndex: 7 },
  { name: '四姑娘山', x: 55, y: 8, tone: 'yellow', icon: Picture, pointIndex: 8 }
]

const routeDots = [[700, 315], [650, 375], [600, 468], [550, 560], [475, 620], [360, 624], [255, 590], [168, 520], [164, 438], [245, 378], [330, 335], [390, 260], [355, 154], [430, 170], [490, 230], [493, 285], [555, 322], [625, 255], [690, 278]]

const recommendTabs = [
  { label: '景点', icon: Picture },
  { label: '美食', icon: Food },
  { label: '住宿', icon: House },
  { label: '补给', icon: OfficeBuilding },
  { label: '拍照', icon: Camera }
]

const recommendations: RecommendationItem[] = [
  { title: '天空之城观景台', distance: '12km', rating: '4.9分', reviews: 328, tag: '适合拍照', kind: '绝景', imagePosition: '0% center' },
  { title: '藏式牦牛肉火锅', distance: '18km', rating: '4.8分', reviews: 256, tag: '当地美食', kind: '锅盔寨', imagePosition: '50% center' },
  { title: '云端观景民宿', distance: '22km', rating: '4.9分', reviews: 199, tag: '风景悠美', kind: '舒适宿', imagePosition: '100% center' }
]

const visibleRecommendations = computed(() => {
  return recommendations.map((_, index) => recommendations[(index + recommendationOffset.value) % recommendations.length])
})

const metrics = [
  { label: '总里程', value: '860', unit: 'km', note: '预计行驶里程', tone: 'slate', icon: Guide },
  { label: '预计用时', value: '18', unit: 'h 36m', note: '不含休息时间', tone: 'orange', icon: Stopwatch },
  { label: '累计爬升', value: '12,850', unit: 'm', note: '累计爬升高度', tone: 'green', icon: TrendCharts },
  { label: '预计油耗', value: '68', unit: 'L', note: '按当前车型估算', tone: 'orange', icon: Histogram },
  { label: '最佳季节', value: '5月–10月', unit: '', note: '气候适宜', tone: 'purple', icon: Sunny },
  { label: '平均气温', value: '8°–20°', unit: '', note: '建议携带外套', tone: 'blue', icon: Aim }
]

function showPlaceholder(feature: string): void {
  ElMessage.info(`${feature}将在接口联调阶段接入`)
}

function handleSearch(): void {
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入地点或路线关键词')
    return
  }
  ElMessage.info(`“${keyword.value.trim()}”搜索将在接口联调阶段接入`)
}

function rotateRecommendations(): void {
  recommendationOffset.value = (recommendationOffset.value + 1) % recommendations.length
}

function addRecommendation(title: string): void {
  ElMessage.success(`已将“${title}”加入静态路线预览`)
}
</script>

<style scoped lang="scss">
.roadbook-screen {
  --screen-orange: #ff6a16;
  --screen-panel: rgba(10, 22, 31, 0.92);
  --screen-panel-soft: rgba(15, 29, 39, 0.9);
  --screen-border: rgba(134, 159, 174, 0.2);
  --screen-text: #f4f7f9;
  --screen-muted: #8393a0;
  width: 100vw;
  min-width: 1180px;
  height: 100vh;
  min-height: 760px;
  overflow: hidden;
  color: var(--screen-text);
  background: #061019;
  font-family: "DIN Alternate", "Bahnschrift", "PingFang SC", "Microsoft YaHei", sans-serif;
}

button,
input {
  font: inherit;
}

button {
  color: inherit;
}

.screen-header {
  position: relative;
  z-index: 20;
  display: grid;
  height: 72px;
  padding: 0 22px;
  grid-template-columns: 250px minmax(320px, 420px) minmax(590px, 1fr);
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  background: linear-gradient(180deg, #0c1821 0%, #09151e 100%);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.28);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-mark {
  width: 35px;
  color: var(--screen-orange);
}

.brand-mark svg {
  display: block;
  width: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  letter-spacing: 1.4px;
  font-size: 18px;
  line-height: 1.1;
}

.brand small {
  margin-top: 3px;
  color: #8998a3;
  font-size: 11px;
  letter-spacing: 0.6px;
}

.global-search {
  display: grid;
  height: 43px;
  padding: 0 12px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 9px;
  border: 1px solid var(--screen-border);
  border-radius: 13px;
  color: #6f808d;
  background: rgba(255, 255, 255, 0.035);
}

.global-search input {
  width: 100%;
  border: 0;
  outline: 0;
  color: #dce4e8;
  background: transparent;
}

.global-search input::placeholder {
  color: #6f7f8b;
}

.global-search kbd {
  padding: 2px 5px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 5px;
  color: #667783;
  font-size: 10px;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 5px;
}

.header-actions button,
.route-heading button,
.recommend-heading button {
  display: inline-flex;
  border: 0;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
}

.header-actions button {
  height: 42px;
  padding: 0 13px;
  gap: 7px;
  border-radius: 12px;
  color: #e8edef;
  font-size: 13px;
  transition: 0.2s ease;
}

.header-actions button:hover,
.header-actions button.active {
  background: rgba(255, 255, 255, 0.06);
}

.header-actions button.active {
  color: #ffb084;
}

.header-actions .outlined {
  margin-left: 9px;
  padding-inline: 20px;
  border: 1px solid var(--screen-border);
}

.header-actions .publish {
  margin-left: 9px;
  padding-inline: 20px;
  color: #16100c;
  background: var(--screen-orange);
  font-weight: 700;
}

.header-actions .publish:hover {
  background: #ff7c35;
}

.avatar {
  width: 39px;
  height: 39px;
  margin-left: 10px;
  border: 2px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  object-fit: cover;
}

.screen-workspace {
  position: relative;
  height: calc(100vh - 72px);
  min-height: 688px;
  overflow: hidden;
  background: #08131c url("@/assets/screen/western-sichuan-map.png") center / cover no-repeat;
}

.screen-workspace::before {
  position: absolute;
  inset: 0;
  content: "";
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(4, 13, 20, 0.5), transparent 28%, transparent 72%, rgba(4, 13, 20, 0.45)),
    linear-gradient(180deg, transparent 55%, rgba(3, 11, 17, 0.5));
}

.glass-panel {
  border: 1px solid var(--screen-border);
  background: linear-gradient(145deg, rgba(12, 26, 36, 0.96), rgba(8, 19, 27, 0.92));
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(14px);
}

.route-panel {
  position: absolute;
  z-index: 8;
  top: 28px;
  bottom: 172px;
  left: 16px;
  display: flex;
  width: 275px;
  min-height: 510px;
  border-radius: 15px;
  flex-direction: column;
  overflow: hidden;
}

.route-heading {
  display: flex;
  padding: 20px 20px 14px;
  justify-content: space-between;
  gap: 10px;
}

.route-title-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.route-heading h1 {
  margin: 0;
  font-size: 17px;
  line-height: 1.35;
}

.route-heading button {
  padding: 4px;
  color: #718390;
}

.route-heading p {
  display: flex;
  margin: 9px 0 0;
  align-items: center;
  gap: 7px;
  color: #758691;
  font-size: 11px;
}

.route-heading p i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #53636e;
}

.route-summary {
  display: grid;
  padding: 10px 12px 16px;
  grid-template-columns: repeat(3, 1fr);
}

.route-summary div {
  text-align: center;
}

.route-summary div + div {
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.route-summary strong,
.route-summary span {
  display: block;
}

.route-summary strong {
  font-size: 15px;
}

.route-summary span {
  margin-top: 7px;
  color: #687985;
  font-size: 11px;
}

.route-tabs {
  display: grid;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  grid-template-columns: 1fr 1fr;
}

.route-tabs button {
  height: 47px;
  border: 0;
  border-bottom: 2px solid transparent;
  color: #7e8c96;
  cursor: pointer;
  background: transparent;
  font-size: 12px;
}

.route-tabs button.active {
  border-bottom-color: var(--screen-orange);
  color: var(--screen-orange);
  font-weight: 700;
}

.route-list-wrap {
  min-height: 0;
  padding: 7px 10px 5px 18px;
  flex: 1;
  overflow: hidden;
}

.route-list {
  height: 100%;
  margin: 0;
  padding: 0 4px 0 0;
  overflow-y: auto;
  list-style: none;
}

.route-list::-webkit-scrollbar {
  width: 3px;
}

.route-list::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: #344652;
}

.route-list li {
  position: relative;
  display: grid;
  min-height: 53px;
  padding: 7px 5px 7px 0;
  grid-template-columns: 20px 28px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.055);
  cursor: pointer;
  transition: 0.18s ease;
}

.route-list li:hover,
.route-list li.selected {
  background: linear-gradient(90deg, rgba(255, 106, 22, 0.09), transparent);
}

.route-list li:not(:last-child)::before {
  position: absolute;
  top: 35px;
  bottom: -18px;
  left: 10px;
  width: 1px;
  content: "";
  background: #31414c;
}

.order {
  position: relative;
  z-index: 1;
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border-radius: 50%;
  color: #d5dde1;
  background: #43515c;
  font-size: 9px;
}

.node-icon {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 9px 9px 9px 3px;
  color: #fff;
}

.node-icon svg {
  width: 14px;
}

.node-icon--green { background: #35b957; }
.node-icon--blue { background: #2788ec; }
.node-icon--purple { background: #a44ce5; }
.node-icon--orange { background: #ff8517; }
.node-icon--yellow { background: #e8b82c; }
.node-icon--red { background: #df4752; }

.node-copy strong,
.node-copy small {
  display: block;
}

.node-copy strong {
  font-size: 13px;
  line-height: 1.2;
}

.node-copy small {
  margin-top: 5px;
  color: #7b8b95;
  font-size: 10px;
}

.node-copy small b {
  margin-right: 8px;
  font-weight: 600;
}

.text-green { color: #5ed471; }
.text-blue { color: #59a7ee; }
.text-purple { color: #c472f1; }
.text-orange { color: #ff9a46; }
.text-yellow { color: #e1c553; }
.text-red { color: #ef7279; }

.drag-handle {
  color: #6a7c87;
}

.overview-copy {
  padding: 30px 22px;
  flex: 1;
}

.overview-copy span {
  color: var(--screen-orange);
  font-size: 11px;
  letter-spacing: 2px;
}

.overview-copy h2 {
  margin: 13px 0;
  font-size: 18px;
  line-height: 1.55;
}

.overview-copy p {
  margin: 0;
  color: #82929d;
  font-size: 12px;
  line-height: 1.8;
}

.route-footer {
  display: grid;
  padding: 12px;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.route-footer button {
  display: flex;
  height: 37px;
  border: 1px solid #2d3c46;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #c4ced3;
  cursor: pointer;
  background: transparent;
  font-size: 11px;
}

.route-footer .primary-soft {
  border-color: var(--screen-orange);
  color: #fff;
  background: var(--screen-orange);
}

.map-toolbar {
  position: absolute;
  z-index: 7;
  top: 45px;
  left: 308px;
  width: 67px;
  padding: 8px 6px;
  border-radius: 13px;
}

.map-toolbar button {
  position: relative;
  display: flex;
  width: 100%;
  height: 65px;
  border: 0;
  border-radius: 9px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #c9d1d5;
  cursor: pointer;
  background: transparent;
  font-size: 10px;
}

.map-toolbar button:hover {
  background: rgba(255, 255, 255, 0.04);
}

.map-toolbar button.active {
  border: 1px solid var(--screen-orange);
  color: var(--screen-orange);
  background: rgba(255, 106, 22, 0.08);
}

.map-toolbar button:not(:last-child)::after {
  position: absolute;
  right: 9px;
  bottom: 0;
  left: 9px;
  height: 1px;
  content: "";
  background: rgba(255, 255, 255, 0.04);
}

.map-toolbar .el-icon {
  font-size: 21px;
}

.map-stage {
  position: absolute;
  z-index: 2;
  inset: 0;
}

.route-line {
  position: absolute;
  top: 7%;
  right: 22%;
  bottom: 15%;
  left: 27%;
  width: 51%;
  height: 77%;
  overflow: visible;
  pointer-events: none;
}

.route-shadow {
  fill: none;
  stroke: rgba(255, 102, 0, 0.22);
  stroke-width: 9;
  filter: url(#routeGlow);
}

.route-path {
  fill: none;
  stroke: #ff680b;
  stroke-width: 3.3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.route-dot {
  fill: #fff0dd;
  stroke: #ff6a10;
  stroke-width: 2;
}

.map-marker {
  position: absolute;
  z-index: 4;
  display: flex;
  border: 0;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  background: transparent;
  transform: translate(-16px, -30px);
  filter: drop-shadow(0 3px 7px rgba(0, 0, 0, 0.45));
}

.map-marker strong {
  color: #fff;
  font-size: 14px;
  text-shadow: 0 2px 5px #000;
  white-space: nowrap;
}

.marker-pin {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border: 2px solid rgba(255, 255, 255, 0.75);
  border-radius: 50% 50% 50% 8px;
  color: #fff;
  background: #2689ee;
  transform: rotate(-45deg);
  transition: 0.2s ease;
}

.marker-pin .el-icon {
  transform: rotate(45deg);
}

.map-marker.active .marker-pin {
  box-shadow: 0 0 0 7px rgba(255, 106, 22, 0.2);
  transform: rotate(-45deg) scale(1.14);
}

.marker-green .marker-pin { background: #2fae50; }
.marker-purple .marker-pin { background: #9b3dde; }
.marker-orange .marker-pin { background: #ff8618; }
.marker-yellow .marker-pin { background: #e3b626; }

.map-controls {
  position: absolute;
  z-index: 6;
  bottom: 178px;
  left: 317px;
  display: flex;
  width: 52px;
  border-radius: 12px;
  flex-direction: column;
  overflow: hidden;
}

.map-controls button {
  height: 42px;
  border: 0;
  color: #dce4e8;
  cursor: pointer;
  background: transparent;
  font-size: 18px;
}

.map-controls span {
  color: #6f808b;
  font-size: 9px;
  text-align: center;
}

.locate-button {
  position: absolute;
  z-index: 6;
  bottom: 124px;
  left: 317px;
  display: grid;
  width: 52px;
  height: 46px;
  border-radius: 12px;
  place-items: center;
  color: #e5eaed;
  cursor: pointer;
  font-size: 20px;
}

.map-scale {
  position: absolute;
  z-index: 5;
  right: 348px;
  bottom: 142px;
  width: 55px;
  color: #d9e0e4;
  font-size: 10px;
  text-align: center;
  text-shadow: 0 1px 4px #000;
}

.map-scale i {
  display: block;
  height: 7px;
  margin-top: 4px;
  border-right: 1px solid #e7ecee;
  border-bottom: 2px solid #e7ecee;
  border-left: 1px solid #e7ecee;
}

.recommend-panel {
  position: absolute;
  z-index: 8;
  top: 28px;
  right: 16px;
  bottom: 172px;
  display: flex;
  width: 312px;
  min-height: 510px;
  border-radius: 15px;
  flex-direction: column;
  overflow: hidden;
}

.recommend-heading {
  display: flex;
  height: 62px;
  padding: 0 18px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.recommend-heading h2 {
  margin: 0;
  font-size: 16px;
}

.recommend-heading h2 span {
  margin-right: 5px;
}

.recommend-heading button {
  color: #91a0aa;
  cursor: pointer;
  font-size: 17px;
}

.recommend-tabs {
  display: grid;
  height: 64px;
  padding: 0 8px;
  grid-template-columns: repeat(5, 1fr);
}

.recommend-tabs button {
  position: relative;
  display: flex;
  border: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #768791;
  cursor: pointer;
  background: transparent;
  font-size: 10px;
}

.recommend-tabs button.active {
  color: var(--screen-orange);
}

.recommend-tabs button.active::after {
  position: absolute;
  right: 13px;
  bottom: 0;
  left: 13px;
  height: 2px;
  border-radius: 2px;
  content: "";
  background: var(--screen-orange);
}

.recommend-tabs .el-icon {
  font-size: 18px;
}

.recommend-list {
  display: grid;
  min-height: 0;
  padding: 7px 11px 0;
  gap: 9px;
  flex: 1;
  overflow: auto;
}

.recommend-list article {
  position: relative;
  display: grid;
  min-height: 146px;
  padding: 9px;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 11px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.045);
}

.recommend-image {
  position: relative;
  border-radius: 7px;
  overflow: hidden;
  background-image: url("@/assets/screen/recommendation-sprite.png");
  background-repeat: no-repeat;
  background-size: 300% 100%;
}

.recommend-image::after {
  position: absolute;
  inset: 50% 0 0;
  content: "";
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
}

.recommend-image span {
  position: absolute;
  z-index: 1;
  bottom: 7px;
  left: 8px;
  font-size: 10px;
}

.recommend-copy h3 {
  margin: 6px 0 7px;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-copy p {
  margin: 0;
  color: #71828e;
  font-size: 10px;
}

.rating {
  display: flex;
  margin-top: 11px;
  gap: 8px;
  align-items: center;
}

.rating strong {
  color: #f2f5f6;
  font-size: 11px;
}

.rating span {
  color: #80909b;
  font-size: 9px;
}

.recommend-copy small {
  display: inline-block;
  margin-top: 8px;
  padding: 3px 6px;
  border-radius: 4px;
  color: #9aa8b1;
  background: rgba(255, 255, 255, 0.06);
  font-size: 9px;
}

.recommend-list article > button {
  position: absolute;
  right: 9px;
  bottom: 10px;
  height: 29px;
  padding: 0 9px;
  border: 1px solid rgba(255, 106, 22, 0.75);
  border-radius: 7px;
  color: var(--screen-orange);
  cursor: pointer;
  background: transparent;
  font-size: 10px;
}

.recommend-list article > button:hover {
  color: #fff;
  background: var(--screen-orange);
}

.change-batch {
  display: flex;
  height: 50px;
  border: 0;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #cbd4d9;
  cursor: pointer;
  background: transparent;
  font-size: 12px;
}

.trip-metrics {
  position: absolute;
  z-index: 9;
  right: 116px;
  bottom: 28px;
  left: 116px;
  display: grid;
  height: 116px;
  padding: 15px 20px;
  border-radius: 15px;
  grid-template-columns: repeat(6, 1fr);
}

.trip-metrics article {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.trip-metrics article + article {
  border-left: 1px solid rgba(255, 255, 255, 0.09);
}

.metric-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 50%;
  font-size: 23px;
  background: rgba(255, 255, 255, 0.04);
}

.metric-slate { color: #a9b2b9; }
.metric-orange { color: #ff8a18; }
.metric-green { color: #64c873; }
.metric-purple { color: #b36ee8; }
.metric-blue { color: #8ea8dd; }

.trip-metrics small,
.trip-metrics strong,
.trip-metrics p {
  display: block;
}

.trip-metrics small {
  color: #98a6af;
  font-size: 10px;
}

.trip-metrics strong {
  margin-top: 7px;
  font-size: 20px;
  line-height: 1;
  white-space: nowrap;
}

.trip-metrics em {
  font-size: 11px;
  font-style: normal;
  font-weight: 500;
}

.trip-metrics p {
  margin: 8px 0 0;
  color: #71818c;
  font-size: 9px;
}

@media (max-width: 1360px) {
  .screen-header {
    grid-template-columns: 225px minmax(280px, 360px) 1fr;
  }

  .header-actions button {
    padding-inline: 9px;
  }

  .trip-metrics {
    right: 60px;
    left: 60px;
  }

  .trip-metrics article {
    gap: 8px;
  }

  .metric-icon {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
    font-size: 19px;
  }
}

@media (max-height: 870px) {
  .route-panel,
  .recommend-panel {
    bottom: 142px;
  }

  .trip-metrics {
    bottom: 16px;
    height: 102px;
  }

  .route-list li {
    min-height: 48px;
  }

  .recommend-list article {
    min-height: 125px;
  }

  .map-controls {
    bottom: 150px;
  }

  .locate-button {
    bottom: 96px;
  }
}
</style>
