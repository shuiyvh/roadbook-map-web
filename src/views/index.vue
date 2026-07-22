<template>
  <div class="dashboard-page">
    <section class="welcome-banner">
      <div class="welcome-copy">
        <h1>欢迎回来，{{ displayName }} <span aria-hidden="true">👋</span></h1>
        <p>智能路书工作台 · 让旅行规划更简单</p>
      </div>
      <div class="mountain-scene" aria-hidden="true">
        <span class="mountain mountain-back"></span>
        <span class="mountain mountain-front"></span>
        <span class="lake-line"></span>
      </div>
    </section>

    <el-alert
      v-if="dashboardWarnings.length > 0"
      class="dashboard-warning"
      type="warning"
      show-icon
      :closable="false"
      :title="dashboardWarnings.join('；')"
    />

    <section class="metric-grid" aria-label="业务数据概览">
      <article v-for="item in metrics" :key="item.key" class="metric-card">
        <div class="metric-icon" :class="`metric-icon--${item.tone}`">
          <svg-icon :icon-class="item.icon" />
        </div>
        <div>
          <span class="metric-label">{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small :class="[`metric-note--${item.noteTone}`, { 'metric-error': item.status === 'error' }]">{{ item.note }}</small>
        </div>
      </article>
    </section>

    <section class="dashboard-grid">
      <div class="dashboard-primary">
        <article class="dashboard-card trend-card">
          <header class="card-header">
            <div>
              <h2>路书活跃趋势</h2>
              <p>展示近 7 天新建、发布与出行启动趋势</p>
            </div>
            <span class="period-chip">近 7 天</span>
          </header>
          <page-state v-if="dashboardLoading" type="loading" description="正在读取路书趋势" />
          <page-state
            v-else-if="dashboardStatus === 'error'"
            type="error"
            description="路书趋势加载失败，请检查首页统计接口后重试。"
            action-text="重新加载"
            @action="loadDashboard"
          />
          <page-state v-else-if="dashboardStatus === 'forbidden'" description="当前账号没有首页统计查看权限，请联系管理员授权。" />
          <page-state v-else-if="trend === undefined" description="当前模块暂无可用统计数据或查看权限。" />
          <page-state v-else-if="trend.length === 0" description="所选周期内暂无路书活跃数据。" />
          <trend-chart v-else :data="trend" />
        </article>

        <div class="dashboard-bottom-grid">
          <article class="dashboard-card recent-card">
            <header class="card-header compact">
              <h2>热门路书 TOP5</h2>
              <span>近期热度</span>
            </header>
            <page-state v-if="dashboardLoading" type="loading" description="正在读取热门路书" />
            <page-state
              v-else-if="dashboardStatus === 'error'"
              type="error"
              description="热门路书加载失败，请检查首页统计接口后重试。"
              action-text="重新加载"
              @action="loadDashboard"
            />
            <page-state v-else-if="dashboardStatus === 'forbidden'" description="当前账号没有首页统计查看权限，请联系管理员授权。" />
            <page-state v-else-if="popularRoutebooks === undefined" description="当前模块暂无可用统计数据或查看权限。" />
            <page-state v-else-if="popularRoutebooks.length === 0" description="当前暂无热门路书，产生访问或出行数据后将在此展示。" />
            <ol v-else class="routebook-list">
              <li v-for="(routebook, index) in popularRoutebooks" :key="routebook.routebookId">
                <span class="routebook-rank">{{ index + 1 }}</span>
                <div class="routebook-cover" :style="coverStyle(routebook.coverUrl)"></div>
                <div class="routebook-info">
                  <strong>{{ routebook.title || '未命名路书' }}</strong>
                  <small>{{ routeSummary(routebook) }}</small>
                </div>
                <span class="routebook-heat">{{ routebook.heatValue ?? 0 }}</span>
              </li>
            </ol>
          </article>

          <article class="dashboard-card distribution-card">
            <header class="card-header compact"><h2>点位类型分布</h2></header>
            <page-state v-if="dashboardLoading" type="loading" description="正在统计点位类型" />
            <page-state v-else-if="dashboardStatus === 'error'" type="error" description="点位分布加载失败。" action-text="重试" @action="loadDashboard" />
            <page-state v-else-if="dashboardStatus === 'forbidden'" description="当前账号没有首页统计查看权限。" />
            <page-state v-else-if="pointTypeDistribution === undefined" description="当前模块暂无可用统计数据或查看权限。" />
            <page-state v-else-if="pointTypeDistribution.length === 0" description="当前暂无点位分类数据。" />
            <distribution-chart v-else name="点位类型" :data="pointTypeChartData" />
          </article>

          <article class="dashboard-card distribution-card">
            <header class="card-header compact"><h2>出行状态分布</h2></header>
            <page-state v-if="dashboardLoading" type="loading" description="正在统计出行状态" />
            <page-state v-else-if="dashboardStatus === 'error'" type="error" description="出行分布加载失败。" action-text="重试" @action="loadDashboard" />
            <page-state v-else-if="dashboardStatus === 'forbidden'" description="当前账号没有首页统计查看权限。" />
            <page-state v-else-if="journeyStatusDistribution === undefined" description="当前模块暂无可用统计数据或查看权限。" />
            <page-state v-else-if="journeyStatusDistribution.length === 0" description="当前暂无出行状态数据。" />
            <distribution-chart v-else name="出行状态" :data="journeyStatusChartData" />
          </article>
        </div>
      </div>

      <aside class="dashboard-aside">
        <article class="dashboard-card focus-card">
          <header class="card-header compact"><h2>近期工作重点</h2></header>
          <ul>
            <li v-for="item in focusItems" :key="item.title">
              <span class="focus-icon" :class="`focus-icon--${item.tone}`">
                <svg-icon :icon-class="item.icon" />
              </span>
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.description }}</p>
              </div>
            </li>
          </ul>
        </article>

        <article class="dashboard-card notice-card">
          <header class="card-header compact">
            <h2>系统通知</h2>
            <span v-if="unreadCount > 0">{{ unreadCount }} 条未读</span>
          </header>
          <page-state v-if="noticeLoading" type="loading" description="正在读取系统通知" />
          <page-state v-else-if="noticeStatus === 'error'" type="error" description="系统通知加载失败，请稍后重试。" action-text="重试" @action="loadNotices" />
          <page-state v-else-if="notices.length === 0" description="当前没有新的系统通知。" />
          <ul v-else class="notice-list">
            <li v-for="notice in notices" :key="notice.noticeId">
              <span class="notice-dot" :class="{ unread: !notice.isRead }"></span>
              <div>
                <strong>{{ notice.noticeTitle }}</strong>
                <small>{{ notice.createTime || '刚刚' }}</small>
              </div>
            </li>
          </ul>
        </article>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts" name="Index">
import { getDashboardOverview } from '@/api/trip/dashboard'
import { listNoticeTop } from '@/api/system/notice'
import auth from '@/plugins/auth'
import useUserStore from '@/store/modules/user'
import type {
  DashboardJourneyStatusDistribution,
  DashboardPointTypeDistribution,
  DashboardPopularRoutebook,
  DashboardSummary,
  DashboardTrendItem
} from '@/types/api/trip/dashboard'
import type { SysNotice } from '@/types/api/system/notice'
import PageState from '@/components/BusinessPage/PageState.vue'
import DistributionChart from '@/views/dashboard/components/DistributionChart.vue'
import TrendChart from '@/views/dashboard/components/TrendChart.vue'

type MetricStatus = 'ready' | 'loading' | 'error' | 'unavailable' | 'forbidden'

interface MetricItem {
  key: string
  label: string
  value: string | number
  note: string
  icon: string
  tone: 'blue' | 'purple' | 'cyan' | 'orange'
  noteTone: 'default' | 'up' | 'down'
  status: MetricStatus
}

const userStore = useUserStore()
const { trip_point_type, trip_journey_status } = useDict('trip_point_type', 'trip_journey_status')
const displayName = computed(() => userStore.nickName || userStore.name || '旅行者')
const notices = ref<SysNotice[]>([])
const unreadCount = ref(0)
const summary = ref<DashboardSummary>({})
const trend = ref<DashboardTrendItem[]>()
const popularRoutebooks = ref<DashboardPopularRoutebook[]>()
const pointTypeDistribution = ref<DashboardPointTypeDistribution[]>()
const journeyStatusDistribution = ref<DashboardJourneyStatusDistribution[]>()
const dashboardWarnings = ref<string[]>([])
const dashboardStatus = ref<MetricStatus>(auth.hasPermi('trip:dashboard:view') ? 'loading' : 'forbidden')
const noticeStatus = ref<MetricStatus>('loading')
const dashboardLoading = computed(() => dashboardStatus.value === 'loading')
const noticeLoading = computed(() => noticeStatus.value === 'loading')
const pointTypeChartData = computed(() => (pointTypeDistribution.value || []).map((item: DashboardPointTypeDistribution) => ({ name: trip_point_type.value.find((option: { value: string | number; label: string }) => String(option.value) === String(item.typeCode))?.label || item.typeName || item.typeCode, value: item.count })))
const journeyStatusChartData = computed(() => (journeyStatusDistribution.value || []).map((item: DashboardJourneyStatusDistribution) => ({ name: trip_journey_status.value.find((option: { value: string | number; label: string }) => String(option.value) === String(item.status))?.label || item.statusName || item.status, value: item.count })))

const metrics = computed<MetricItem[]>(() => [
  createMetric('routebooks', '路书总数', summary.value.routebookTotal, summary.value.routebookChange, 'guide', 'blue'),
  createMetric('points', '规划点位', summary.value.pointTotal, summary.value.pointChange, 'location', 'purple'),
  createMetric('recommendations', '推荐结果', summary.value.recommendationTotal, summary.value.recommendationChange, 'star', 'cyan'),
  createMetric('journeys', '出行中', summary.value.activeJourneyTotal, summary.value.activeJourneyChange, 'guide', 'orange')
])

const focusItems = [
  { title: 'PC 路书地图工作台', description: '路书 CRUD、地图点位、分段路线与 POI 搜索。', icon: 'guide', tone: 'blue' },
  { title: '推荐与 AI 摘要', description: 'Tavily 搜索结果、AI 摘要生成并加入路书。', icon: 'star', tone: 'purple' },
  { title: '分享与邀请', description: '公开分享页、邀请链接、成员协作与访问统计。', icon: 'peoples', tone: 'cyan' },
  { title: '出行打卡链路', description: '开始出行、定位匹配、导航唤起与打卡进度。', icon: 'location', tone: 'orange' }
]

function metricNote(status: MetricStatus): string {
  const notes: Record<MetricStatus, string> = {
    ready: '较上期暂无变化',
    loading: '数据加载中',
    error: '加载失败，请重试',
    unavailable: '暂无可用统计数据',
    forbidden: '当前账号暂无查看权限'
  }
  return notes[status]
}

/**
 * 将统计值和上期变化统一转换成指标卡片，字段缺失按无模块权限处理。
 * 变化百分比使用“变化量 / 上期数量”计算；上期为 0 时只展示数量，避免产生无意义百分比。
 */
function createMetric(
  key: string,
  label: string,
  total: number | undefined,
  change: number | null | undefined,
  icon: string,
  tone: MetricItem['tone']
): MetricItem {
  const status = dashboardStatus.value !== 'ready'
    ? dashboardStatus.value
    : total === undefined ? 'forbidden' : 'ready'
  if (status !== 'ready') {
    return { key, label, value: '--', note: metricNote(status), icon, tone, noteTone: 'default', status }
  }
  if (change === null || change === undefined) {
    return { key, label, value: total!, note: '暂无上期对比数据', icon, tone, noteTone: 'default', status }
  }
  const previousTotal = total! - change
  const percentage = previousTotal > 0 ? ` (${Math.abs(change / previousTotal * 100).toFixed(1)}%)` : ''
  const direction = change > 0 ? '↑' : change < 0 ? '↓' : ''
  const note = change === 0 ? metricNote(status) : `较上期 ${direction} ${Math.abs(change)}${percentage}`
  return { key, label, value: total!, note, icon, tone, noteTone: change > 0 ? 'up' : change < 0 ? 'down' : 'default', status }
}

async function loadDashboard(): Promise<void> {
  if (!auth.hasPermi('trip:dashboard:view')) {
    dashboardStatus.value = 'forbidden'
    return
  }
  dashboardStatus.value = 'loading'
  dashboardWarnings.value = []
  try {
    const response = await getDashboardOverview({ days: 7 })
    const data = response.data || {}
    summary.value = data.summary || {}
    trend.value = data.trend
    popularRoutebooks.value = data.popularRoutebooks?.slice(0, 5)
    pointTypeDistribution.value = data.pointTypeDistribution
    journeyStatusDistribution.value = data.journeyStatusDistribution
    dashboardWarnings.value = data.warnings || response.warnings || []
    dashboardStatus.value = 'ready'
  } catch (error) {
    dashboardStatus.value = 'error'
    console.warn('首页聚合统计加载失败，请检查首页统计接口。', error)
  }
}

async function loadNotices(): Promise<void> {
  noticeStatus.value = 'loading'
  try {
    const response = await listNoticeTop()
    notices.value = (response.data || []).slice(0, 4)
    unreadCount.value = response.unreadCount || 0
    noticeStatus.value = 'ready'
  } catch (error) {
    noticeStatus.value = 'error'
    console.warn('首页系统通知加载失败，请检查通知接口。', error)
  }
}

function routeSummary(routebook: DashboardPopularRoutebook): string {
  const distance = routebook.totalDistanceM ? `${Math.round(routebook.totalDistanceM / 1000)} km` : ''
  const points = routebook.pointCount !== undefined ? `${routebook.pointCount} 个点位` : ''
  return [distance, points].filter(Boolean).join(' · ') || '路线信息待完善'
}

function coverStyle(coverUrl?: string): Record<string, string> {
  if (!coverUrl) {
    return {}
  }
  const safeUrl = encodeURI(coverUrl).replace(/"/g, '%22')
  return { backgroundImage: `url("${safeUrl}")` }
}

onMounted(() => {
  loadDashboard()
  loadNotices()
})
</script>

<style scoped lang="scss">
.dashboard-page {
  min-height: calc(100vh - var(--roadbook-header-height));
  padding: 16px;
  color: var(--roadbook-text-regular);
  background: var(--roadbook-page-bg);
}

.welcome-banner,
.metric-card,
.dashboard-card {
  border: 1px solid var(--roadbook-border);
  border-radius: var(--roadbook-radius);
  background: var(--roadbook-panel-bg);
  box-shadow: var(--roadbook-shadow);
}

.welcome-banner {
  position: relative;
  display: flex;
  min-height: 146px;
  padding: 32px 36px;
  align-items: center;
  overflow: hidden;
  background: linear-gradient(105deg, var(--roadbook-panel-bg) 0%, var(--roadbook-panel-bg) 43%, #f3f2ff 100%);
}

.welcome-copy {
  position: relative;
  z-index: 2;
}

.welcome-copy h1 {
  margin: 0;
  color: var(--roadbook-text-primary);
  font-size: clamp(24px, 2.4vw, 30px);
  line-height: 1.3;
  font-weight: 750;
}

.welcome-copy p {
  margin: 12px 0 0;
  color: var(--roadbook-text-secondary);
  font-size: 15px;
}

.mountain-scene {
  position: absolute;
  inset: 0 0 0 40%;
  overflow: hidden;
  opacity: 0.82;
}

.mountain {
  position: absolute;
  right: -6%;
  bottom: -45%;
  width: 92%;
  height: 115%;
  clip-path: polygon(0 100%, 15% 64%, 28% 77%, 43% 40%, 55% 67%, 72% 25%, 82% 56%, 100% 18%, 100% 100%);
}

.mountain-back {
  background: linear-gradient(145deg, rgba(203, 213, 255, 0.25), rgba(131, 158, 235, 0.36));
  transform: translate(4%, -12%) scale(1.03);
}

.mountain-front {
  background: linear-gradient(145deg, rgba(217, 219, 255, 0.25), rgba(91, 124, 250, 0.5));
}

.lake-line {
  position: absolute;
  right: 0;
  bottom: 18%;
  width: 88%;
  height: 22%;
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(140, 191, 243, 0.28));
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.dashboard-warning {
  margin-top: 12px;
  border-radius: var(--roadbook-radius);
}

.metric-card {
  display: flex;
  min-height: 126px;
  padding: 22px;
  align-items: center;
  gap: 18px;
}

.metric-icon {
  display: grid;
  width: 56px;
  height: 56px;
  flex: 0 0 56px;
  place-items: center;
  border-radius: 50%;
  font-size: 25px;
}

.metric-icon--blue { color: #5278f5; background: #edf2ff; }
.metric-icon--purple { color: #a56be2; background: #f5edff; }
.metric-icon--cyan { color: #36aec1; background: #eaf9fc; }
.metric-icon--orange { color: #f39a61; background: #fff3eb; }

.metric-label {
  display: block;
  color: var(--roadbook-text-regular);
  font-size: 13px;
  font-weight: 600;
}

.metric-card strong {
  display: block;
  margin-top: 6px;
  color: var(--roadbook-text-primary);
  font-size: 27px;
  line-height: 1;
}

.metric-card small {
  display: block;
  margin-top: 10px;
  color: var(--roadbook-text-secondary);
  font-size: 12px;
}

.metric-card small.metric-error {
  color: var(--roadbook-danger);
}

.metric-card small.metric-note--up {
  color: #36aec1;
}

.metric-card small.metric-note--down {
  color: var(--roadbook-danger);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 12px;
  margin-top: 12px;
  align-items: start;
}

.dashboard-primary,
.dashboard-aside {
  display: grid;
  gap: 12px;
}

.dashboard-card {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-header h2 {
  margin: 0;
  color: var(--roadbook-text-primary);
  font-size: 16px;
  line-height: 1.4;
}

.card-header p,
.card-header span {
  color: var(--roadbook-text-secondary);
  font-size: 12px;
}

.card-header p {
  margin: 8px 0 0;
}

.card-header.compact {
  align-items: center;
}

.period-chip {
  padding: 7px 12px;
  border: 1px solid var(--roadbook-border);
  border-radius: 6px;
  background: var(--roadbook-panel-muted);
}

.trend-card :deep(.page-state) {
  min-height: 280px;
}

.dashboard-bottom-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr 1fr;
  gap: 12px;
}

.routebook-list,
.focus-card ul,
.notice-list {
  padding: 0;
  margin: 16px 0 0;
  list-style: none;
}

.routebook-list {
  display: grid;
  gap: 10px;
}

.routebook-list li {
  display: grid;
  grid-template-columns: 18px 42px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
}

.routebook-heat {
  color: #f39a61;
  font-size: 11px;
  font-weight: 650;
}

.routebook-heat::before {
  content: '◆';
  margin-right: 3px;
  font-size: 8px;
}

.routebook-rank {
  color: var(--roadbook-text-secondary);
  font-size: 12px;
  text-align: center;
}

.routebook-cover {
  width: 42px;
  height: 34px;
  border-radius: 5px;
  background-color: #edf2ff;
  background-image: linear-gradient(145deg, #d9e2ff, #8ba7ef);
  background-position: center;
  background-size: cover;
}

.routebook-info {
  min-width: 0;
}

.routebook-info strong,
.routebook-info small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.routebook-info strong {
  color: var(--roadbook-text-primary);
  font-size: 12px;
}

.routebook-info small {
  margin-top: 4px;
  color: var(--roadbook-text-secondary);
  font-size: 11px;
}

.recent-card :deep(.page-state),
.distribution-card :deep(.page-state),
.notice-card :deep(.page-state) {
  min-height: 210px;
  padding: 16px 8px;
}

.recent-card :deep(.page-state h2),
.distribution-card :deep(.page-state h2),
.notice-card :deep(.page-state h2) {
  font-size: 14px;
}

.focus-card ul {
  display: grid;
  gap: 18px;
}

.focus-card li {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.focus-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 8px;
  font-size: 18px;
}

.focus-icon--blue { color: #5278f5; background: #edf2ff; }
.focus-icon--purple { color: #a56be2; background: #f5edff; }
.focus-icon--cyan { color: #36aec1; background: #eaf9fc; }
.focus-icon--orange { color: #f39a61; background: #fff3eb; }

.focus-card strong,
.notice-list strong {
  display: block;
  color: var(--roadbook-text-primary);
  font-size: 13px;
  line-height: 1.45;
}

.focus-card p {
  margin: 5px 0 0;
  color: var(--roadbook-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.notice-list {
  display: grid;
  gap: 12px;
}

.notice-list li {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr);
  gap: 10px;
  padding: 12px;
  border-radius: 7px;
  background: var(--roadbook-panel-muted);
}

.notice-dot {
  width: 7px;
  height: 7px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--roadbook-border);
}

.notice-dot.unread {
  background: var(--roadbook-primary);
}

.notice-list small {
  display: block;
  margin-top: 5px;
  color: var(--roadbook-text-secondary);
  font-size: 11px;
}

html.dark .welcome-banner {
  background: linear-gradient(105deg, var(--roadbook-panel-bg) 0%, var(--roadbook-panel-bg) 43%, #202439 100%);
}

html.dark .metric-icon--blue,
html.dark .focus-icon--blue { background: rgba(82, 120, 245, 0.14); }
html.dark .metric-icon--purple,
html.dark .focus-icon--purple { background: rgba(165, 107, 226, 0.14); }
html.dark .metric-icon--cyan,
html.dark .focus-icon--cyan { background: rgba(54, 174, 193, 0.14); }
html.dark .metric-icon--orange,
html.dark .focus-icon--orange { background: rgba(243, 154, 97, 0.14); }

@media (max-width: 1200px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-aside {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 860px) {
  .dashboard-bottom-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-aside {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-page {
    padding: 12px;
  }

  .welcome-banner {
    min-height: 132px;
    padding: 24px;
  }

  .mountain-scene {
    left: 25%;
    opacity: 0.45;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .metric-card {
    min-height: 108px;
    padding: 18px;
  }
}
</style>
