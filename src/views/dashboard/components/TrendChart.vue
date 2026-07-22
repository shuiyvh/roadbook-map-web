<template>
  <div ref="chartRef" class="trend-chart" role="img" aria-label="路书活跃趋势折线图"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { useResizeObserver } from '@vueuse/core'
import type { DashboardTrendItem } from '@/types/api/trip/dashboard'

const props = defineProps<{
  data: DashboardTrendItem[]
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | undefined
let themeObserver: MutationObserver | undefined

function renderChart(): void {
  if (!chartRef.value) {
    return
  }
  chart ||= echarts.init(chartRef.value)
  const dark = document.documentElement.classList.contains('dark')
  const textColor = dark ? '#a8adbd' : '#7a8499'
  const lineColor = dark ? '#353a4a' : '#edf0f5'

  chart.setOption({
    animationDuration: 500,
    color: ['#5b7cfa', '#a56be2', '#36aec1'],
    aria: { enabled: true, decal: { show: false } },
    tooltip: { trigger: 'axis', confine: true },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: textColor, fontSize: 12 },
      data: ['新建路书', '发布路书', '启动出行']
    },
    grid: { left: 8, right: 10, top: 48, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.map((item: DashboardTrendItem) => item.date.slice(5)),
      axisLine: { lineStyle: { color: lineColor } },
      axisTick: { show: false },
      axisLabel: { color: textColor, formatter: (value: string) => value.replace('-', '/') }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: lineColor } }
    },
    series: [
      createSeries('新建路书', props.data.map((item: DashboardTrendItem) => item.newRoutebookCount)),
      createSeries('发布路书', props.data.map((item: DashboardTrendItem) => item.publishedRoutebookCount)),
      createSeries('启动出行', props.data.map((item: DashboardTrendItem) => item.startedJourneyCount))
    ]
  }, true)
}

function createSeries(name: string, data: number[]): echarts.LineSeriesOption {
  return {
    name,
    type: 'line',
    data,
    smooth: 0.35,
    symbol: 'circle',
    symbolSize: 7,
    lineStyle: { width: 2 },
    emphasis: { focus: 'series' }
  }
}

useResizeObserver(chartRef, () => chart?.resize())
watch(() => props.data, renderChart, { deep: true })

onMounted(() => {
  renderChart()
  // 主题切换不会重新挂载组件，需要监听根节点 class 并刷新图表配色。
  themeObserver = new MutationObserver(renderChart)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  chart?.dispose()
})
</script>

<style scoped>
.trend-chart {
  width: 100%;
  height: 300px;
  margin-top: 8px;
}
</style>
