<template>
  <div class="home-container">
    <div class="grid-wrapper">
      <!-- 折线图 -->
      <el-card shadow="hover" class="card chart-card">
        <template #header>
          <div class="card-header">每日检测患者数量</div>
        </template>
        <v-chart
          :option="lineOption"
          class="chart"
          renderer="svg"
          style="width: 100%; height: 240px"
        />
      </el-card>

      <!-- 柱形图 -->
      <el-card shadow="hover" class="card chart-card">
        <template #header>
          <div class="card-header">每日患者检测结果情况</div>
        </template>
        <v-chart
          :option="barOption"
          class="chart"
          renderer="svg"
          style="width: 100%; height: 240px"
        />
      </el-card>

      <!-- 饼图 -->
      <el-card shadow="hover" class="card chart-card">
        <template #header>
          <div class="card-header">各科室吞咽相关疾病人群占比</div>
        </template>
        <v-chart
          :option="pieOption"
          class="chart"
          renderer="svg"
          style="width: 100%; height: 240px"
        />
      </el-card>

      <!-- 设备状态 -->
      <el-card shadow="hover" class="card chart-card">
        <template #header>
          <div class="card-header">每日设备使用时长</div>
        </template>
        <v-chart
          :option="riverOption"
          class="chart"
          renderer="svg"
          style="width: 100%; height: 240px"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { lineData, barData, pieData } from '@/mock/StatsData'
import { use } from 'echarts/core'
import { BarChart, LineChart, PieChart, SunburstChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

use([
  LineChart,
  BarChart,
  PieChart,
  SunburstChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  SVGRenderer,
])

// 图表配置
const lineOption = {
  grid: { top: 8, bottom: 8, containLabel: true },
  xAxis: {
    type: 'category',
    data: lineData.map((d) => d.category),
    boundaryGap: ['5%', '5%'],
  },
  yAxis: {
    type: 'value',
    name: '人数',
    nameLocation: 'middle',
    nameGap: 40,
    axisLine: { show: true },
    axisTick: { show: true },
    splitLine: { show: true },
  },
  tooltip: { trigger: 'axis' },
  series: [
    {
      type: 'line',
      data: lineData.map((d) => d.value),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color: '#3b82f6' },
      itemStyle: { color: '#3b82f6' },
      areaStyle: { opacity: 0.08 },
    },
  ],
}
const barOption = {
  // 为了避免 legend 和 x 轴重叠，把 bottom 提高一些
  grid: { top: 8, bottom: 40, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  // 让图例离 x 轴有空隙
  legend: { bottom: 0 },
  xAxis: {
    type: 'category',
    data: barData.map((d) => d.category),
    axisTick: { alignWithLabel: true },
    boundaryGap: true,
  },
  yAxis: {
    type: 'value',
    name: '人数',
    nameLocation: 'middle',
    nameGap: 40,
    axisLine: { show: true },
    axisTick: { show: true },
    splitLine: { show: true },
  },
  series: [
    {
      name: '正常',
      type: 'bar',
      stack: 'total', // ★ 开启堆叠
      data: barData.map((d) => d.normal),
      // barWidth 不指定也可，指定能更稳一些
      barMaxWidth: 24,
      itemStyle: { color: '#91CC75' },
    },
    {
      name: '吞咽障碍',
      type: 'bar',
      stack: 'total', // ★ 同一 stack 名称
      data: barData.map((d) => d.dysphagia),
      barMaxWidth: 24,
      itemStyle: { color: '#5470C6' },
    },
    {
      name: '误吸',
      type: 'bar',
      stack: 'total',
      data: barData.map((d) => d.overt),
      barMaxWidth: 24,
      itemStyle: { color: '#EE6666' },
    },
    // {
    //   name: '隐性误吸',
    //   type: 'bar',
    //   stack: 'total',
    //   data: barData.map((d) => d.silent),
    //   barMaxWidth: 24,
    //   itemStyle: { color: '#FAC858' },
    // },
  ],
  // 堆叠时这两个间距不再重要，但保留也无妨
  barCategoryGap: '30%',
  barGap: '20%',
}
const pieOption = {
  tooltip: { trigger: 'item' },
  series: [
    {
      name: '各科室吞咽障碍人群占比',
      type: 'pie',
      radius: [25, '75%'],
      center: ['50%', '50%'],
      roseType: 'radius',
      data: pieData,
      label: {
        formatter: '{b}\n{c} ({d}%)',
        fontSize: 12,
      },
      labelLine: { smooth: true, length: 10, length2: 8 },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
      },
    },
  ],
}

// —— 假数据：设备列表与近 7 天（与折线图同源的 7 个横轴刻度）——
const deviceIds = ['DEV-001', 'DEV-002', 'DEV-003', 'DEV-004']
const days = lineData.map((d) => d.category) // ['周日','周一',...,'周六']

// 每台设备 7 天的使用时长（小时）
const deviceUsage: Record<string, number[]> = {
  'DEV-001': [3.5, 4, 5, 4.5, 6, 5.5, 4.2],
  'DEV-002': [2, 2.5, 3, 3.2, 3.8, 3.5, 2.8],
  'DEV-003': [1.5, 2, 2.2, 2.8, 3, 2.5, 2],
  'DEV-004': [0.8, 1, 1.2, 1.5, 1.6, 1.4, 1.1],
}

// 为不同设备准备一组柔和但可区分的配色（可按需调整）
const DEVICE_COLORS = ['#60A5FA', '#34D399', '#A78BFA', '#F472B6']

// —— 河流图（堆叠面积流式效果）——
const riverOption = {
  grid: { top: 8, bottom: 40, containLabel: true },

  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'line' },
    formatter: (params: any) => {
      const day = params?.[0]?.axisValueLabel ?? ''
      const lines = params
        .map((p: any) => `${p.marker} ${p.seriesName}：${p.data} 小时`)
        .join('<br/>')
      const total = params.reduce(
        (s: number, p: any) => s + (Number(p.data) || 0),
        0,
      )
      return `${day}<br/>${lines}<br/><b>总计：${total.toFixed(1)} 小时</b>`
    },
    confine: true,
  },

  // ↓ 图例放在底部，并且如果设备多可用 scroll 避免挤压
  legend: { bottom: 0 },

  xAxis: {
    type: 'category',
    data: days,
    boundaryGap: false,
    axisTick: { alignWithLabel: true },
  },
  yAxis: {
    type: 'value',
    name: '小时',
    nameLocation: 'middle',
    nameGap: 40,
    min: 0,
    axisLine: { show: true },
    axisTick: { show: true },
    splitLine: { show: true },
  },

  series: deviceIds.map((devId, i) => ({
    name: devId,
    type: 'line',
    stack: 'usage',
    smooth: true,
    symbol: 'none',
    areaStyle: { opacity: 0.9 },
    lineStyle: { width: 0.5, opacity: 0.6 },
    itemStyle: { color: DEVICE_COLORS[i % DEVICE_COLORS.length] },
    emphasis: { focus: 'series' },
    data: deviceUsage[devId],
    z: 1,
  })),
}
</script>

<style scoped>
.home-container {
  width: 100%;
  display: flex;
  justify-content: center;
}
.grid-wrapper {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  min-width: 1200px;
}
.card {
  min-width: 580px;
  max-width: 640px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}
.card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}
.card-header {
  font-size: 1.2rem;
  font-weight: 600;
}
:deep(.el-card__header) {
  padding: 6px 0px;
}
:deep(.chart-card .el-card__body) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 0px 20px;
}
.chart {
  max-width: 100%;
}
.table {
  width: 100%;
  min-height: 180px;
}
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}
.bell-icon {
  margin-right: 8px;
  cursor: pointer;
}
.bell-icon.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}
</style>
