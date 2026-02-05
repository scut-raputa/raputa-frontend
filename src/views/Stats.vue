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
import { ref, onMounted, computed } from 'vue'
import { getStats } from '@/api/stats'
import type {
  DailyPatientCount,
  DailyCheckResult,
  DeptPatientCount,
  DeviceUsage,
} from '@/api/stats'
import { ElMessage } from 'element-plus'
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

const lineData = ref<DailyPatientCount[]>([])
const barData = ref<DailyCheckResult[]>([])
const pieData = ref<DeptPatientCount[]>([])
const deviceUsageData = ref<DeviceUsage[]>([])
const loading = ref(false)

function formatDateMMDD(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

function generateDateLabels(days: number): string[] {
  const labels: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    labels.push(formatDateMMDD(date))
  }
  
  return labels
}

const loadStats = async () => {
  loading.value = true
  try {
    const days = 7
    const response = await getStats({ days })
    if (response.code === 0 && response.data) {
      const data = response.data
      
      const dateLabels = generateDateLabels(days)
      
      lineData.value = (data.dailyPatientCount || []).map((item, index) => ({
        ...item,
        category: dateLabels[index] || item.category,
      }))
      
      barData.value = (data.dailyCheckResult || []).map((item, index) => ({
        ...item,
        category: dateLabels[index] || item.category,
      }))
      
      pieData.value = data.deptPatientCount || []
      deviceUsageData.value = data.deviceUsage || []
    } else {
      ElMessage.error(response.message || '获取统计数据失败')
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
const lineOption = computed(() => ({
  grid: { top: 8, bottom: 8, containLabel: true },
  xAxis: {
    type: 'category',
    data: lineData.value.map((d) => d.category),
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
      data: lineData.value.map((d) => d.value),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color: '#3b82f6' },
      itemStyle: { color: '#3b82f6' },
      areaStyle: { opacity: 0.08 },
    },
  ],
}))

const barOption = computed(() => ({
  grid: { top: 8, bottom: 40, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { bottom: 0 },
  xAxis: {
    type: 'category',
    data: barData.value.map((d) => d.category),
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
      stack: 'total',
      data: barData.value.map((d) => d.normal),
      barMaxWidth: 24,
      itemStyle: { color: '#91CC75' },
    },
    {
      name: '吞咽障碍',
      type: 'bar',
      stack: 'total',
      data: barData.value.map((d) => d.dysphagia),
      barMaxWidth: 24,
      itemStyle: { color: '#5470C6' },
    },
    {
      name: '误吸',
      type: 'bar',
      stack: 'total',
      data: barData.value.map((d) => d.overt),
      barMaxWidth: 24,
      itemStyle: { color: '#EE6666' },
    },
  ],
  barCategoryGap: '30%',
  barGap: '20%',
}))

const pieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [
    {
      name: '各科室吞咽障碍人群占比',
      type: 'pie',
      radius: '75%',
      center: ['50%', '50%'],
      data: pieData.value,
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
}))

const deviceIds = computed(() => deviceUsageData.value.map((d) => d.deviceId))
const days = computed(() => lineData.value.map((d) => d.category))

const DEVICE_COLORS = ['#60A5FA', '#34D399', '#A78BFA', '#F472B6']

const riverOption = computed(() => ({
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
  legend: { bottom: 0 },
  xAxis: {
    type: 'category',
    data: days.value,
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
  series: deviceUsageData.value.map((device, i) => ({
    name: device.deviceId,
    type: 'line',
    stack: 'usage',
    smooth: true,
    symbol: 'none',
    areaStyle: { opacity: 0.9 },
    lineStyle: { width: 0.5, opacity: 0.6 },
    itemStyle: { color: DEVICE_COLORS[i % DEVICE_COLORS.length] },
    emphasis: { focus: 'series' },
    data: device.usageHours,
    z: 1,
  })),
}))
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