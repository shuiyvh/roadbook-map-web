<template>
  <div class="dashboard-page">
    <section class="dashboard-hero">
      <div>
        <p class="eyebrow">Roadbook Map Console</p>
        <h1>智能路书工作台</h1>
        <p class="summary">
          聚合路书规划、点位编排、推荐搜索、出行打卡与分享协作数据，后续可直接接入
          `/trip/screen` 与 `/trip/admin` 系列接口。
        </p>
      </div>
      <div class="hero-status">
        <span class="status-dot"></span>
        <span>前端占位数据</span>
      </div>
    </section>

    <section class="metric-grid">
      <div v-for="item in metrics" :key="item.label" class="metric-card">
        <span class="metric-label">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.trend }}</small>
      </div>
    </section>

    <section class="workspace-grid">
      <div class="chart-panel">
        <div class="panel-header">
          <div>
            <h2>路书活跃趋势</h2>
            <p>展示近 7 天路书创建、发布与出行启动的占位趋势。</p>
          </div>
        </div>
        <div ref="trendChartRef" class="trend-chart"></div>
      </div>

      <div class="side-panel">
        <h2>近期工作重点</h2>
        <ul>
          <li v-for="item in focusItems" :key="item.title">
            <span>{{ item.title }}</span>
            <small>{{ item.desc }}</small>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts" name="Index">
import * as echarts from 'echarts'

const trendChartRef = ref<HTMLDivElement>()
let trendChart: echarts.ECharts | undefined

const metrics = [
  { label: '路书总数', value: '128', trend: '待接入 routebooks/page' },
  { label: '规划点位', value: '864', trend: '待接入 points 列表' },
  { label: '推荐结果', value: '342', trend: '待接入 recommend/list' },
  { label: '出行中', value: '19', trend: '待接入 journey 数据' }
]

const focusItems = [
  { title: 'PC 路书地图工作台', desc: '路书 CRUD、地图点位、分段路线与 POI 搜索。' },
  { title: '推荐与 AI 摘要', desc: 'Tavily 搜索结果、AI 摘要重生成与加入路书。' },
  { title: '分享与邀请', desc: '公开分享页、邀请链接、成员协作与访问统计。' },
  { title: '出行打卡链路', desc: '开始出行、定位匹配、导航唤起与打卡进度。' }
]

function renderTrendChart(): void {
  if (!trendChartRef.value) {
    return
  }
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    color: ['#2563eb', '#16a34a', '#f59e0b'],
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      top: 0,
      right: 8,
      data: ['新建路书', '发布路书', '启动出行']
    },
    grid: {
      left: 8,
      right: 16,
      top: 48,
      bottom: 8,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      }
    },
    series: [
      {
        name: '新建路书',
        type: 'line',
        smooth: true,
        data: [12, 18, 16, 24, 28, 31, 36]
      },
      {
        name: '发布路书',
        type: 'line',
        smooth: true,
        data: [5, 9, 8, 13, 16, 18, 22]
      },
      {
        name: '启动出行',
        type: 'bar',
        barWidth: 18,
        data: [3, 6, 7, 9, 11, 14, 16]
      }
    ]
  })
}

function resizeTrendChart(): void {
  trendChart?.resize()
}

onMounted(() => {
  renderTrendChart()
  window.addEventListener('resize', resizeTrendChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeTrendChart)
  trendChart?.dispose()
})
</script>

<style scoped lang="scss">
.dashboard-page {
  min-height: calc(100vh - 84px);
  padding: 24px;
  background: #f6f7fb;
  color: #111827;
}

.dashboard-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.eyebrow {
  margin: 0 0 8px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}

h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.summary {
  max-width: 760px;
  margin: 12px 0 0;
  color: #4b5563;
  line-height: 1.7;
}

.hero-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  white-space: nowrap;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16a34a;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.metric-card,
.chart-panel,
.side-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.metric-card {
  padding: 18px;

  strong {
    display: block;
    margin-top: 10px;
    font-size: 30px;
    line-height: 1;
  }

  small {
    display: block;
    margin-top: 10px;
    color: #6b7280;
  }
}

.metric-label {
  color: #374151;
  font-weight: 600;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  margin-top: 16px;
}

.chart-panel,
.side-panel {
  padding: 20px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

h2 {
  margin: 0;
  font-size: 18px;
}

.panel-header p {
  margin: 8px 0 0;
  color: #6b7280;
}

.trend-chart {
  width: 100%;
  height: 360px;
}

.side-panel {
  ul {
    display: grid;
    gap: 12px;
    padding: 0;
    margin: 16px 0 0;
    list-style: none;
  }

  li {
    padding: 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
  }

  span {
    display: block;
    font-weight: 700;
  }

  small {
    display: block;
    margin-top: 6px;
    color: #6b7280;
    line-height: 1.6;
  }
}

html.dark {
  .dashboard-page {
    background: #101418;
    color: #e5e7eb;
  }

  .dashboard-hero,
  .metric-card,
  .chart-panel,
  .side-panel {
    border-color: #27313a;
    background: #171d23;
  }

  .summary,
  .metric-card small,
  .panel-header p,
  .side-panel small {
    color: #9ca3af;
  }

  .side-panel li {
    border-color: #27313a;
    background: #111827;
  }
}

@media (max-width: 1100px) {
  .metric-grid,
  .workspace-grid {
    grid-template-columns: 1fr 1fr;
  }

  .chart-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .dashboard-page {
    padding: 16px;
  }

  .dashboard-hero {
    display: block;
    padding: 22px;
  }

  .hero-status {
    margin-top: 16px;
  }

  .metric-grid,
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .trend-chart {
    height: 300px;
  }
}
</style>
