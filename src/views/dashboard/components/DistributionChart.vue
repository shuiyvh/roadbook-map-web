<template>
  <div ref="chartRef" class="distribution-chart" role="img" :aria-label="`${name}环形分布图`"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { useResizeObserver } from '@vueuse/core'

export interface DistributionItem {
  name: string
  value: number
}

const props = defineProps<{
  data: DistributionItem[]
  name: string
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
  const primaryText = dark ? '#e7e9ef' : '#202536'
  const secondaryText = dark ? '#a8adbd' : '#7a8499'
  const total = props.data.reduce((sum: number, item: DistributionItem) => sum + item.value, 0)

  chart.setOption({
    animationDuration: 500,
    color: ['#5b7cfa', '#36aec1', '#7cc6b9', '#f3a66f', '#a56be2', '#aab4c5'],
    aria: { enabled: true, decal: { show: false } },
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: '{b}<br/>{c}（{d}%）'
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      top: 'middle',
      right: 0,
      width: '48%',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: secondaryText, fontSize: 11 },
      formatter: (name: string) => {
        const item = props.data.find((candidate: DistributionItem) => candidate.name === name)
        const percentage = total > 0 && item ? ` ${((item.value / total) * 100).toFixed(1)}%` : ''
        return `${name}  ${item?.value ?? 0}${percentage}`
      }
    },
    graphic: [
      {
        type: 'text', left: '24%', top: '43%', style: {
          text: String(total), fill: primaryText, fontSize: 22, fontWeight: 700, textAlign: 'center'
        }
      },
      {
        type: 'text', left: '24%', top: '56%', style: {
          text: '总计', fill: secondaryText, fontSize: 11, textAlign: 'center'
        }
      }
    ],
    series: [{
      name: props.name,
      type: 'pie',
      center: ['25%', '50%'],
      radius: ['48%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderWidth: 2, borderColor: dark ? '#252936' : '#ffffff' },
      label: { show: false },
      emphasis: { scaleSize: 6 },
      data: props.data
    }]
  }, true)
}

useResizeObserver(chartRef, () => chart?.resize())
watch(() => props.data, renderChart, { deep: true })

onMounted(() => {
  renderChart()
  // 与趋势图保持一致，在深浅主题切换后同步重绘文字和分隔色。
  themeObserver = new MutationObserver(renderChart)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  chart?.dispose()
})
</script>

<style scoped>
.distribution-chart {
  width: 100%;
  height: 230px;
}
</style>
