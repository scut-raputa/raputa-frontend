<template>
  <div class="monitor-container">
    <!-- 快速设置卡片 -->
    <el-card class="card" shadow="hover">
      <template #header>
        <div class="card-header-row">
          <div class="card-header">快速设置</div>
          <div class="header-actions">
            <!-- 开关在“开始检测”左边 -->
            <el-switch
              v-model="isFileMode"
              active-text="文件模式"
              inactive-text="实时模式"
              active-color="#1890ff"
              inactive-color="#ccc"
              size="small"
            />

            <el-divider direction="vertical" class="header-divider" />

            <!-- 开始/继续 -->
            <el-tooltip
              content="给定必填项后才能开始检测"
              placement="top"
              :disabled="canStart === true"
            >
              <el-button
                type="primary"
                size="small"
                :disabled="!canStart"
                @click="startDetection"
              >
                <el-icon style="margin-right: 4px"><VideoPlay /></el-icon>
                {{ isInitial ? '开始检测' : '继续检测' }}
              </el-button>
            </el-tooltip>

            <el-tooltip
              content="仅在检测过程中启用"
              placement="top"
              :disabled="isDetecting"
            >
              <el-button
                type="danger"
                size="small"
                :disabled="!isDetecting"
                @click="stopDetection"
              >
                <el-icon style="margin-right: 4px"><VideoPause /></el-icon>
                停止检测
              </el-button>
            </el-tooltip>

            <el-tooltip
              content="检测停止后才能复位"
              placement="top"
              :disabled="canReset"
            >
              <el-button
                type="warning"
                size="small"
                :disabled="!canReset"
                @click="resetDetection"
              >
                <el-icon style="margin-right: 4px"><Refresh /></el-icon>
                复位
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>

      <div class="setting-row">
        <el-input
          v-model="patientName"
          placeholder="请输入患者姓名"
          clearable
          size="small"
          class="setting-item"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="selectedSegModel"
          placeholder="请选择分割模型"
          size="small"
          class="setting-item"
          clearable
        >
          <template #prefix>
            <el-icon><DataLine /></el-icon>
          </template>
          <el-option label="吞咽分割模型A" value="segA" />
          <el-option label="吞咽分割模型B" value="segB" />
        </el-select>

        <el-select
          v-model="selectedDetModel"
          placeholder="请选择检测模型"
          size="small"
          class="setting-item"
          clearable
        >
          <template #prefix>
            <el-icon><DataAnalysis /></el-icon>
          </template>
          <el-option label="吞咽障碍筛查模型C" value="detC" />
          <el-option label="误吸检测模型D" value="detD" />
        </el-select>

        <!-- 任务在文件模式下非必填，保留选择 -->
        <el-select
          v-model="selectedTask"
          placeholder="请选择任务"
          size="small"
          class="setting-item"
          clearable
        >
          <template #prefix>
            <el-icon><Operation /></el-icon>
          </template>
          <el-option label="吞咽障碍筛查" value="taskX" />
          <el-option label="误吸检测" value="taskY" />
        </el-select>

        <!-- 设备仅用于实时模式；文件模式不必选，仍保留控件以便切换 -->
        <el-select-v2
          v-model="selectedDevice"
          class="setting-item device-select"
          size="small"
          :options="deviceOptions"
          :filterable="true"
          :remote="true"
          :filter-method="filterDevices"
          placeholder="请选择检测设备（实时模式）"
          multiple
          clearable
          teleported
          popper-class="device-select-popper"
          :item-height="80"
          collapse-tags
          :max-collapse-tags="1"
        >
          <template #prefix>
            <el-icon><Tools /></el-icon>
          </template>

          <template #header>
            <el-checkbox
              v-model="checkAllDevices"
              :indeterminate="indeterminateDevices"
              @change="handleCheckAllDevices"
            >
              全选设备（仅在线）
            </el-checkbox>
          </template>

          <!-- 选项行自定义渲染 -->
          <template #default="{ item }">
            <div class="device-option-row">
              <div class="device-main">
                <div class="device-line">
                  <span class="device-id">{{ item.id }}</span>
                  <span class="device-ip">{{ item.ip }}</span>
                  <el-tag
                    size="small"
                    :type="item.status === 'online' ? 'success' : 'info'"
                    effect="plain"
                    :class="{
                      'tag-no-bold':
                        item.status === 'online' &&
                        selectedDevice.includes(item.id),
                    }"
                  >
                    {{ item.status === 'online' ? '在线' : '离线' }}
                  </el-tag>
                </div>
                <span
                  class="device-desc"
                  :class="{ 'desc-offline': item.status === 'offline' }"
                >
                  {{ item.desc }}
                </span>
              </div>

              <el-button
                size="small"
                :type="item.status === 'online' ? 'danger' : 'success'"
                @click.stop="toggleDeviceConnection(item)"
              >
                {{ item.status === 'online' ? '断连' : '连接' }}
              </el-button>
            </div>
          </template>
        </el-select-v2>
      </div>
    </el-card>

    <!-- 信号数据卡片 -->
    <el-card class="card" shadow="hover">
      <template #header>
        <div class="card-header-row">
          <div class="card-header">信号数据</div>
          <div class="chart-header-actions">
            <el-upload
              class="upload-btn"
              :auto-upload="false"
              :show-file-list="false"
              :disabled="!isFileMode"
              accept=".csv"
              :on-change="handleCsvSelect"
            >
              <el-tooltip
                content="仅在文件模式下上传 CSV（服务器将临时保存）"
                placement="top"
              >
                <el-button type="primary" size="small">
                  <el-icon style="margin-right: 4px"><UploadFilled /></el-icon>
                  上传 CSV 文件
                </el-button>
              </el-tooltip>
            </el-upload>

            <!-- 检测报告下载（仍仅实时模式） -->
            <el-tooltip
              content="检测停止后才能导出报告"
              placement="top"
              :disabled="hasStopped || isFileMode"
            >
              <el-button
                type="success"
                size="small"
                dark
                :disabled="!hasStopped || isFileMode"
                @click="openReportDialog"
              >
                <el-icon style="margin-right: 4px"><Download /></el-icon>
                检测报告下载
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>

      <div class="charts-grid">
        <!-- 吞咽风险段图表（文件模式下也可播放“检测结果”） -->
        <div class="chart-box chart-span-all">
          <div ref="swallowRef" class="echart-container" />
        </div>

        <!-- 喉运动XYZ图表（清空=删除服务器临时文件） -->
        <div class="chart-box">
          <div ref="imuRef" class="echart-container" />
          <el-tooltip
            v-if="isFileMode"
            content="清空喉运动信号（将删除服务器临时文件）"
            placement="left"
          >
            <el-button
              link
              :class="['chart-tool-btn', { 'always-show': isFileMode }]"
              :disabled="!imuAxisUsed.X && !imuAxisUsed.Y && !imuAxisUsed.Z"
              @click="clearChartData('imu')"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>

        <!-- 呼吸信号图表（清空=删除服务器临时文件） -->
        <div class="chart-box">
          <div ref="gasRef" class="echart-container" />
          <el-tooltip
            v-if="isFileMode"
            content="清空呼吸信号（将删除服务器临时文件）"
            placement="left"
          >
            <el-button
              link
              :class="['chart-tool-btn', { 'always-show': isFileMode }]"
              :disabled="!gasSeries.length"
              @click="clearChartData('gas')"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>

        <!-- 声音信号图表（清空=删除服务器临时文件） -->
        <div class="chart-box">
          <div ref="audioRef" class="echart-container" />
          <el-tooltip
            v-if="isFileMode"
            content="清空声音信号（将删除服务器临时文件）"
            placement="left"
          >
            <el-button
              link
              :class="['chart-tool-btn', { 'always-show': isFileMode }]"
              :disabled="!audioSeries.length"
              @click="clearChartData('audio')"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </el-card>
  </div>

  <!-- 报告预览对话框（保留） -->
  <el-dialog
    v-model="reportDialogVisible"
    title="检测报告预览"
    width="850px"
    :close-on-click-modal="false"
  >
    <div style="display: flex; justify-content: center">
      <MedicalReport ref="reportRef" :report="reportData" />
    </div>

    <template #footer>
      <el-button @click="reportDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="downloadReport">下载报告</el-button>
    </template>
  </el-dialog>

  <!-- CSV 映射配置对话框 -->
  <el-dialog
    v-model="csvConfigDialogVisible"
    title="CSV 数据配置"
    width="700px"
    :close-on-click-modal="false"
  >
    <div class="csv-preview">
      <h4 class="preview-title">CSV 文件前 5 行预览</h4>
      <el-table :data="csvPreviewData" border size="small" max-height="200">
        <el-table-column
          v-for="(key, idx) in csvHeaders"
          :key="idx"
          :label="key || `列${idx + 1}`"
        >
          <template #default="scope">{{ scope.row[key] }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 配置表单 -->
    <el-form
      ref="csvConfigFormRef"
      :model="csvConfigForm"
      label-width="120px"
      class="csv-config-form"
      style="margin-top: 20px"
    >
      <!-- 采样频率 -->
      <el-form-item
        label="采样频率(Hz)"
        prop="sampleRate"
        :rules="[{ required: true, message: '请输入采样频率', type: 'number' }]"
      >
        <el-input
          v-model.number="csvConfigForm.sampleRate"
          placeholder="请填写正数，如 4000（每秒 4000 个数据点）"
          size="small"
        />
      </el-form-item>

      <!-- 列映射：喉XYZ -->
      <el-form-item label="喉运动信号映射">
        <div class="axis-map-row">
          <el-select
            v-model="csvConfigForm.imuAxisMap.X"
            placeholder="选择 X 轴对应列"
            size="small"
            :disabled="imuAxisUsed.X"
            class="axis-select"
          >
            <el-option
              v-for="(key, idx) in csvHeaders"
              :key="idx"
              :label="key || `列${idx + 1}`"
              :value="key"
            />
          </el-select>

          <el-select
            v-model="csvConfigForm.imuAxisMap.Y"
            placeholder="选择 Y 轴对应列"
            size="small"
            :disabled="imuAxisUsed.Y"
            class="axis-select"
          >
            <el-option
              v-for="(key, idx) in csvHeaders"
              :key="idx"
              :label="key || `列${idx + 1}`"
              :value="key"
            />
          </el-select>

          <el-select
            v-model="csvConfigForm.imuAxisMap.Z"
            placeholder="选择 Z 轴对应列"
            size="small"
            :disabled="imuAxisUsed.Z"
            class="axis-select"
          >
            <el-option
              v-for="(key, idx) in csvHeaders"
              :key="idx"
              :label="key || `列${idx + 1}`"
              :value="key"
            />
          </el-select>
        </div>

        <div class="form-hint">
          提示：已关联的轴会禁用选择，需清空后重新关联
        </div>
      </el-form-item>

      <!-- 列映射：呼吸信号 -->
      <el-form-item label="呼吸信号映射">
        <el-select
          v-model="csvConfigForm.gasCol"
          placeholder="选择呼吸信号对应列"
          size="small"
          :disabled="gasSeries.length > 0"
          style="width: 100%"
        >
          <el-option
            v-for="(key, idx) in csvHeaders"
            :key="idx"
            :label="key || `列${idx + 1}`"
            :value="key"
          />
        </el-select>
      </el-form-item>

      <!-- 列映射：声音信号 -->
      <el-form-item label="声音信号映射">
        <el-select
          v-model="csvConfigForm.audioCol"
          placeholder="选择声音信号对应列"
          size="small"
          :disabled="audioSeries.length > 0"
          style="width: 100%"
        >
          <el-option
            v-for="(key, idx) in csvHeaders"
            :key="idx"
            :label="key || `列${idx + 1}`"
            :value="key"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 弹窗底部按钮 -->
    <template #footer>
      <el-button @click="csvConfigDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitCsvConfig"
        >确认配置并渲染</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import {
  User,
  DataLine,
  DataAnalysis,
  Operation,
  VideoPlay,
  VideoPause,
  Refresh,
  Tools,
  UploadFilled,
  Delete,
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import Papa from 'papaparse'
import { Download } from '@element-plus/icons-vue'
import type { CheckboxValueType, UploadFile, FormInstance } from 'element-plus'
import { ElNotification, ElDialog, ElMessageBox, ElMessage } from 'element-plus'
import html2pdf from 'html2pdf.js'
import MedicalReport from '@/components/MedicalReport.vue'
import { reportData } from '@/mock/ReportData'
import {
  uploadTempFileApi,
  submitCsvMapping,
  deleteTempFileApi,
} from '@/api/tempFile'
import type { CsvMappingRequest } from '@/types/tempFile'

const durationShort = 5
const durationLong = 10

const modeGuard = ref(false)

// 图表 DOM ref
const imuRef = ref<HTMLDivElement>()
const gasRef = ref<HTMLDivElement>()
const audioRef = ref<HTMLDivElement>()
const swallowRef = ref<HTMLDivElement>()

// 图表实例
let imuChart: echarts.ECharts
let gasChart: echarts.ECharts
let audioChart: echarts.ECharts
let swallowChart: echarts.ECharts

// 数据变量
const imuSeries = { X: [], Y: [], Z: [] } as Record<string, [number, number][]>
const gasSeries = ref<[number, number][]>([])
const audioSeries = ref<[number, number][]>([])
let swallowSeries: [number, number][] = [] // 实时模式使用
let riskSeries: [number, number][] = []

// 文件模式“检测结果”渐进播放用
let swallowDisplaySeries: [number, number][] = []
let riskDisplaySeries: [number, number][] = []
let swallowPlaybackRows: { time: number; swallow: number; risk: number }[] = []
let swallowPlayTimer: number | null = null
let fileDetectTimer: number | null = null

let audioDataBuffer: Float32Array = new Float32Array()
const audioUrl = new URL('@/mock/signals/audio.wav', import.meta.url).href

// 控制变量
const patientName = ref('')
const selectedSegModel = ref('')
const selectedDetModel = ref('')
const selectedTask = ref('')
const selectedDevice = ref<string[]>([])
const isDetecting = ref(false)
const hasStopped = ref(false)
const canReset = ref(false)
const hasChartStarted = ref(false)

const reportDialogVisible = ref(false)
const reportRef = ref<HTMLElement | null>(null)

// 模式控制状态
const isFileMode = ref(false) // true=文件模式，false=实时模式

// 服务器端临时文件
const filePayloadReady = ref(false) // 映射完成后置 true 才能开始检测

// —— 每次上传得到一个 tempId，先放到 currentTempId；提交映射后把归属写进 owner ——
// 当前这次上传得到的临时文件 ID（只在本次配置用完前有效）
const currentTempId = ref<string | null>(null)

// 所有已创建过的临时文件 ID（用于批量删除）
const allTempIds = ref<Set<string>>(new Set())

// 哪个图表现在引用了哪个 tempId（避免误删被共用的文件）
const owner = reactive({
  imu: {
    X: null as string | null,
    Y: null as string | null,
    Z: null as string | null,
  },
  gas: null as string | null,
  audio: null as string | null,
})

// 计算“仍在被其他信号使用”的 ID 集合
const usingIds = () =>
  new Set(
    [owner.audio, owner.gas, owner.imu.X, owner.imu.Y, owner.imu.Z].filter(
      Boolean,
    ) as string[],
  )

// CSV上传相关状态
const csvConfigDialogVisible = ref(false)
const csvPreviewData = ref<any[]>([])
const csvHeaders = ref<string[]>([])
const rawCsvData = ref<any[]>([])

// CSV配置表单
const csvConfigForm = ref({
  sampleRate: 4000,
  imuAxisMap: { X: '', Y: '', Z: '' },
  gasCol: '',
  audioCol: '',
})
const csvConfigFormRef = ref<FormInstance | null>(null)

// 图表数据占用状态（防止重复关联）
const imuAxisUsed = ref({ X: false, Y: false, Z: false })

const isInitial = ref(true)

// 设备列表（示例）
type DeviceItem = {
  id: string
  ip: string
  status: 'online' | 'offline'
  desc: string
}
const deviceList = ref<DeviceItem[]>([
  {
    id: 'DEV-001',
    ip: '192.168.1.10',
    status: 'online',
    desc: '实验室 | 三轴加速度计传感器',
  },
  {
    id: 'DEV-002',
    ip: '192.168.1.23',
    status: 'offline',
    desc: '门诊房间 A | 气体流量传感器',
  },
  {
    id: 'DEV-003',
    ip: '192.168.1.45',
    status: 'online',
    desc: '门诊房间 B | 接触式麦克风',
  },
  {
    id: 'DEV-004',
    ip: '192.168.1.60',
    status: 'offline',
    desc: '门诊房间 C | 鼻套管式流量传感器',
  },
])

// ✅ 仅用 inside 交互：支持拖动/滚轮缩放
const INSIDE_ZOOM: echarts.DataZoomComponentOption = {
  type: 'inside',
  xAxisIndex: 0,
  filterMode: 'none',
  zoomOnMouseWheel: true,
  moveOnMouseMove: true,
  throttle: 50,
}

function bindInsideZoomReset(chart: echarts.ECharts, maxTime: number) {
  chart.off('dblclick')
  chart.on('dblclick', () => {
    chart.dispatchAction({
      type: 'dataZoom',
      dataZoomIndex: 0,
      startValue: 0,
      endValue: maxTime,
    })
  })
}

// 过滤关键词（用于自定义 filter-method）
const deviceQuery = ref('')

// 下拉选项（el-select-v2 需要 { value, label, disabled, ... }）
const deviceOptions = computed(() =>
  deviceList.value
    .filter((d) => {
      if (!deviceQuery.value) return true
      const q = deviceQuery.value.toLowerCase()
      return (
        d.id.toLowerCase().includes(q) ||
        d.ip.toLowerCase().includes(q) ||
        d.desc.toLowerCase().includes(q)
      )
    })
    .map((d) => ({
      value: d.id,
      label: `${d.id} (${d.ip})`,
      disabled: d.status !== 'online',
      ...d,
    })),
)

// 全选（仅在线）控制
const checkAllDevices = ref(false)
const indeterminateDevices = ref(false)

const matchedEnabledDevices = computed(() =>
  deviceOptions.value.filter((opt) => !opt.disabled),
)

watch([selectedDevice, matchedEnabledDevices], () => {
  const selectedInView = matchedEnabledDevices.value.filter((opt) =>
    selectedDevice.value.includes(opt.value),
  )
  if (selectedInView.length === 0) {
    checkAllDevices.value = false
    indeterminateDevices.value = false
  } else if (selectedInView.length === matchedEnabledDevices.value.length) {
    checkAllDevices.value = true
    indeterminateDevices.value = false
  } else {
    checkAllDevices.value = false
    indeterminateDevices.value = true
  }
})

function handleCheckAllDevices(val: CheckboxValueType) {
  indeterminateDevices.value = false
  const idsInView = matchedEnabledDevices.value.map(
    (opt) => opt.value as string,
  )
  if (val) {
    selectedDevice.value = Array.from(
      new Set([...selectedDevice.value, ...idsInView]),
    )
  } else {
    selectedDevice.value = selectedDevice.value.filter(
      (id) => !idsInView.includes(id),
    )
  }
}

function filterDevices(query: string) {
  const q = (query ?? '')
    .trim()
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
  deviceQuery.value = q
}

function toggleDeviceConnection(item: DeviceItem) {
  const target = deviceList.value.find((d) => d.id === item.id)
  if (!target) return
  if (target.status === 'offline') target.status = 'online'
  else {
    target.status = 'offline'
    if (selectedDevice.value.includes(target.id)) {
      selectedDevice.value = selectedDevice.value.filter(
        (id) => id !== target.id,
      )
    }
  }
}

function formatDateTime(date: Date): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}年${m}月${d}日 ${hh}:${mm}:${ss}`
}

function getBeijingTimestamp(includeTime = true) {
  const now = new Date()
  const offset = 8 * 60 * 60 * 1000
  const beijingDate = new Date(now.getTime() + offset)
  const yyyy = beijingDate.getUTCFullYear()
  const mm = String(beijingDate.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(beijingDate.getUTCDate()).padStart(2, '0')
  if (!includeTime) return `${yyyy}-${mm}-${dd}`
  const hh = String(beijingDate.getUTCHours()).padStart(2, '0')
  const min = String(beijingDate.getUTCMinutes()).padStart(2, '0')
  const ss = String(beijingDate.getUTCSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`
}

function openReportDialog() {
  reportDialogVisible.value = true
}

function downloadReport() {
  reportData.value.time = formatDateTime(new Date())
  const content = (reportRef.value as any)?.reportContent
  if (!content) return
  const textarea = content.querySelector(
    '.suggestion-text',
  ) as HTMLTextAreaElement
  if (!textarea) return
  const text = textarea.value
  const pre = document.createElement('pre')
  pre.className = 'suggestion-plain'
  pre.textContent = text
  Object.assign(pre.style, {
    fontFamily: '"Microsoft YaHei", sans-serif',
    fontSize: '13px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    border: 'none',
    background: 'none',
    padding: '0',
    margin: '0',
    width: '100%',
    flex: '1',
  })
  const parent = textarea.parentNode
  if (!parent) return
  parent.replaceChild(pre, textarea)
  const filename = `吞咽报告_${reportData.value.name}_${getBeijingTimestamp(true)}.pdf`
  html2pdf()
    .set({
      margin: 0,
      filename,
      html2canvas: { scale: 10 },
      jsPDF: { unit: 'px', format: [794, 1123] },
    })
    .from(content)
    .save()
    .then(() => parent.replaceChild(textarea, pre))
}

//==================== 核心可用性：开始按钮条件 ====================
const canStart = computed(() => {
  if (isFileMode.value) {
    // 文件模式下：只需患者姓名、模型选择 + CSV 已上传并映射就绪
    return !!(
      patientName.value &&
      selectedSegModel.value &&
      selectedDetModel.value &&
      filePayloadReady.value &&
      !isDetecting.value
    )
  }
  // 实时模式：沿用原逻辑（任务必填 + 至少 1 个设备）
  return !!(
    !isFileMode.value &&
    patientName.value &&
    selectedSegModel.value &&
    selectedDetModel.value &&
    selectedTask.value &&
    selectedDevice.value.length > 0 &&
    !isDetecting.value
  )
})

//==================== 实时模式相关（保留） ====================
let totalElapsed = 0
let startTime = 0
let sampleRate = 44100
let imuIdx = 0
let gasIdx = 0
let swallowIdx = 0
let imuRows: any[] = []
let gasRows: any[] = []
let swallowRows: any[] = []
let inSwallow = false
let hasAlertedThisSwallow = false

let animationId: number | null = null
let lastRender = 0
const FPS = 20
const FRAME_GAP = 1000 / FPS
const AUDIO_PLOT_HZ = 200

const AXIS_UPDATE_ANIM = {
  animation: true,
  animationDurationUpdate: 80,
  animationEasingUpdate: 'linear',
} as const
const AXIS_UPDATE_SETOPTION: echarts.SetOptionOpts = {
  notMerge: true,
  replaceMerge: ['xAxis', 'yAxis', 'series'],
  silent: true,
}

function pruneSeries(series: [number, number][], minTime: number) {
  let l = 0,
    r = series.length - 1,
    idx = series.length
  while (l <= r) {
    const m = (l + r) >> 1
    if (series[m][0] >= minTime) {
      idx = m
      r = m - 1
    } else l = m + 1
  }
  if (idx > 0) series.splice(0, idx)
}
function capSeries(series: [number, number][], maxLen: number) {
  if (series.length > maxLen) series.splice(0, series.length - maxLen)
}

function resetUiInputs() {
  patientName.value = ''
  selectedSegModel.value = ''
  selectedDetModel.value = ''
  selectedTask.value = ''
  selectedDevice.value = []
}

function resetCsvState() {
  csvConfigDialogVisible.value = false
  csvPreviewData.value = []
  csvHeaders.value = []
  rawCsvData.value = []
  csvConfigForm.value = {
    sampleRate: 4000,
    imuAxisMap: { X: '', Y: '', Z: '' },
    gasCol: '',
    audioCol: '',
  }
  imuAxisUsed.value = { X: false, Y: false, Z: false }
  filePayloadReady.value = false
}

function resetChartAndData() {
  if (animationId != null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (swallowPlayTimer != null) {
    clearInterval(swallowPlayTimer)
    swallowPlayTimer = null
  }
  if (fileDetectTimer != null) {
    clearTimeout(fileDetectTimer)
    fileDetectTimer = null
  }

  isDetecting.value = false
  totalElapsed = 0
  startTime = 0
  lastRender = 0

  imuSeries.X.length = 0
  imuSeries.Y.length = 0
  imuSeries.Z.length = 0
  gasSeries.value.length = 0
  audioSeries.value.length = 0

  swallowSeries.length = 0
  riskSeries.length = 0
  swallowDisplaySeries = []
  riskDisplaySeries = []
  swallowPlaybackRows = []

  imuIdx = 0
  gasIdx = 0
  swallowIdx = 0
  inSwallow = false
  hasAlertedThisSwallow = false

  hasStopped.value = false
  canReset.value = false
  isInitial.value = true
  reportDialogVisible.value = false

  renderEmptyCharts()
}

async function resetAllState() {
  await deleteAllServerTempFiles()
  resetUiInputs()
  resetCsvState()
  resetChartAndData()
}

function createImuXYZOption(
  dataX: [number, number][],
  dataY: [number, number][],
  dataZ: [number, number][],
  start: number,
  end: number,
): echarts.EChartsOption {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: {
      data: ['喉运动信号 X', '喉运动信号 Y', '喉运动信号 Z'],
      top: 8,
      itemGap: 4,
    },
    grid: { top: 40, bottom: 24, left: 40, right: 20 },
    xAxis: createXAxis(start, end),
    yAxis: { type: 'value' },
    series: [
      {
        name: '喉运动信号 X',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#5470C6' },
        data: dataX,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
      {
        name: '喉运动信号 Y',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#91CC75' },
        data: dataY,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
      {
        name: '喉运动信号 Z',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#EE6666' },
        data: dataZ,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
    ],
  }
}

function startDetection() {
  reportData.value.date = formatDateTime(new Date())
  hasStopped.value = false
  canReset.value = false
  isInitial.value = false

  if (isFileMode.value) {
    startFileModeDetection()
    return
  }

  // 实时模式
  isDetecting.value = true
  startTime = performance.now()
  lastRender = 0
  if (animationId == null) animationId = requestAnimationFrame(frame)
}

function stopDetection() {
  if (isFileMode.value) {
    // 文件模式：停止“结果播放”
    isDetecting.value = false
    if (swallowPlayTimer != null) {
      clearInterval(swallowPlayTimer)
      swallowPlayTimer = null
    }
    if (fileDetectTimer != null) {
      clearTimeout(fileDetectTimer)
      fileDetectTimer = null
    }
    hasStopped.value = true
    canReset.value = true
    return
  }
  // 实时模式
  isDetecting.value = false
  hasStopped.value = true
  canReset.value = true
  totalElapsed += performance.now() - startTime
  if (animationId != null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

function resetDetection() {
  ElMessageBox.confirm(
    '复位将删除相关监测数据和（文件模式）临时文件，是否继续？',
    '确认复位',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    },
  )
    .then(async () => {
      await resetAllState()
    })
    .catch(() => {})
}

function renderEmptyCharts() {
  const sShort = 0,
    eShort = durationShort
  const sLong = 0,
    eLong = durationLong

  // IMU/GAS/Audio：固定窗口（实时）或空-自动（文件）都无所谓，这里复用固定窗口空图
  imuChart.setOption(
    {
      ...(createImuXYZOption(
        [],
        [],
        [],
        sShort,
        eShort,
      ) as echarts.EChartsOption),
      dataZoom: [],
    },
    { notMerge: true },
  )
  gasChart.setOption(
    {
      ...(createSingleOption(
        '呼吸信号',
        [],
        sShort,
        eShort,
      ) as echarts.EChartsOption),
      dataZoom: [],
    },
    { notMerge: true },
  )
  audioChart.setOption(
    {
      ...(createSingleOption(
        '吞咽声音信号',
        [],
        sShort,
        eShort,
      ) as echarts.EChartsOption),
      dataZoom: [],
    },
    { notMerge: true },
  )

  if (isFileMode.value) {
    // 文件模式：吞咽图使用 Auto 轴 + inside 缩放
    const base = createSwallowOptionFile([], [])
    swallowChart.setOption(
      { ...base, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true },
    )
  } else {
    swallowChart.setOption(createSwallowOption([], [], sLong, eLong), {
      notMerge: true,
    })
  }
}

// 文件模式：不固定 min/max
function createXAxisAuto(): echarts.XAXisComponentOption {
  return {
    type: 'value',
    boundaryGap: [0, 0],
    axisLabel: {
      showMinLabel: true,
      showMaxLabel: true,
      formatter: (val: number) => `${val.toFixed(2)}s`,
    },
  }
}

function createXAxis(start: number, end: number): echarts.XAXisComponentOption {
  return {
    type: 'value',
    min: start,
    max: end,
    axisLabel: {
      formatter: (val: number) => {
        if (Math.abs(val - start) < 0.01) return `${start.toFixed(2)}s`
        if (Math.abs(val - end) < 0.01) return `${end.toFixed(2)}s`
        return ''
      },
    },
  }
}

function createSingleOption(
  title: string,
  data: [number, number][],
  start: number,
  end: number,
): echarts.EChartsOption {
  const colorMap: Record<string, string> = {
    '喉运动信号 X': '#5470C6',
    '喉运动信号 Y': '#91CC75',
    '喉运动信号 Z': '#EE6666',
    呼吸信号: '#FAC858',
    吞咽声音信号: '#73C0DE',
  }
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: [title], top: 8, itemGap: 4 },
    grid: { top: 40, bottom: 24, left: 40, right: 20 },
    xAxis: createXAxis(start, end),
    yAxis: { type: 'value' },
    series: [
      {
        name: title,
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: colorMap[title] || '#000' },
        data,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
    ],
  }
}

function createSwallowOption(
  swallow: [number, number][],
  risk: [number, number][],
  start: number,
  end: number,
): echarts.EChartsOption {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['吞咽段识别', '吞咽风险概率'], top: 8, itemGap: 4 },
    grid: { top: 40, bottom: 24, left: 40, right: 20 },
    xAxis: createXAxis(start, end),
    yAxis: { type: 'value', min: 0, max: 1 },
    series: [
      {
        name: '吞咽段识别',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#9B59B6' },
        data: swallow,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
      {
        name: '吞咽风险概率',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#E67E22' },
        data: risk,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
    ],
  }
}

// 文件模式版：Auto 轴
function createSwallowOptionFile(
  swallow: [number, number][],
  risk: [number, number][],
): echarts.EChartsOption {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['吞咽段识别', '吞咽风险概率'], top: 8, itemGap: 4 },
    grid: { top: 40, bottom: 24, left: 40, right: 20 },
    xAxis: createXAxisAuto(),
    yAxis: { type: 'value', min: 0, max: 1 },
    series: [
      {
        name: '吞咽段识别',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#9B59B6' },
        data: swallow,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
      {
        name: '吞咽风险概率',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#E67E22' },
        data: risk,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
    ],
  }
}

function createImuXYZOptionFile(
  dataX: [number, number][],
  dataY: [number, number][],
  dataZ: [number, number][],
): echarts.EChartsOption {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: {
      data: ['喉运动信号 X', '喉运动信号 Y', '喉运动信号 Z'],
      top: 8,
      itemGap: 4,
    },
    grid: { top: 40, bottom: 24, left: 40, right: 20 },
    xAxis: createXAxisAuto(),
    yAxis: { type: 'value' },
    series: [
      {
        name: '喉运动信号 X',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#5470C6' },
        data: dataX,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
      {
        name: '喉运动信号 Y',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#91CC75' },
        data: dataY,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
      {
        name: '喉运动信号 Z',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#EE6666' },
        data: dataZ,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
    ],
  }
}

function createSingleOptionFile(
  title: string,
  data: [number, number][],
): echarts.EChartsOption {
  const colorMap: Record<string, string> = {
    '喉运动信号 X': '#5470C6',
    '喉运动信号 Y': '#91CC75',
    '喉运动信号 Z': '#EE6666',
    呼吸信号: '#FAC858',
    吞咽声音信号: '#73C0DE',
  }
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: [title], top: 8, itemGap: 4 },
    grid: { top: 40, bottom: 24, left: 40, right: 20 },
    xAxis: createXAxisAuto(),
    yAxis: { type: 'value' },
    series: [
      {
        name: title,
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: colorMap[title] || '#000' },
        data,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
    ],
  }
}

function showRiskAlert(risk: number) {
  let message = '' as string
  let type: 'info' | 'warning' | 'error' = 'info'
  if (risk >= 0.7) {
    message = '出现高风险吞咽段，请立即关注'
    type = 'error'
  } else if (risk >= 0.3) {
    message = '出现中风险吞咽段，请留意'
    type = 'warning'
  } else if (risk >= 0.1) {
    message = '出现低风险吞咽段，可适当关注'
    type = 'info'
  }
  if (message) {
    ElNotification({
      title: '风险提示',
      message,
      type,
      position: 'top-right',
      duration: 3000,
      showClose: false,
      customClass:
        type === 'error'
          ? 'risk-high'
          : type === 'warning'
            ? 'risk-mid'
            : 'risk-low',
    })
  }
}

//==================== 实时模式渲染帧 ====================
function frame(now: number = performance.now()) {
  if (!isDetecting.value) {
    animationId = null
    return
  }
  if (now - lastRender < FRAME_GAP) {
    animationId = requestAnimationFrame(frame)
    return
  }
  lastRender = now

  const logicalElapsed = totalElapsed + (now - startTime)
  const tSec = +(logicalElapsed / 1000).toFixed(3)
  const startShort = +Math.max(0, tSec - durationShort).toFixed(3)
  const endShort = +(startShort + durationShort).toFixed(3)
  const startLong = +Math.max(0, tSec - durationLong).toFixed(3)
  const endLong = +(startLong + durationLong).toFixed(3)

  pruneSeries(imuSeries.X, startShort)
  pruneSeries(imuSeries.Y, startShort)
  pruneSeries(imuSeries.Z, startShort)
  pruneSeries(gasSeries.value, startShort)
  pruneSeries(audioSeries.value, startShort)
  pruneSeries(swallowSeries, startLong)
  pruneSeries(riskSeries, startLong)

  const imuBase = Number(imuRows[0]?.time || 0)
  while (
    imuIdx < imuRows.length &&
    Number(imuRows[imuIdx].time) - imuBase <= logicalElapsed
  ) {
    const t = +(Number(imuRows[imuIdx].time) - imuBase) / 1000
    const row = imuRows[imuIdx]
    imuSeries.X.push([t, +row.X])
    imuSeries.Y.push([t, +row.Y])
    imuSeries.Z.push([t, +row.Z])
    imuIdx++
  }

  const gasBase = Number(gasRows[0]?.time || 0)
  while (
    gasIdx < gasRows.length &&
    Number(gasRows[gasIdx].time) - gasBase <= logicalElapsed
  ) {
    const t = +(Number(gasRows[gasIdx].time) - gasBase) / 1000
    gasSeries.value.push([t, +gasRows[gasIdx].value])
    gasIdx++
  }

  const audioEndIdx = Math.floor((logicalElapsed / 1000) * sampleRate)
  const audioStartIdx = Math.max(0, audioEndIdx - sampleRate * durationShort)
  const lastIdx = audioSeries.value.length
    ? Math.floor(audioSeries.value.at(-1)![0] * sampleRate) + 1
    : audioStartIdx
  const audioStride = Math.max(1, Math.floor(sampleRate / AUDIO_PLOT_HZ))
  for (let i = lastIdx; i <= audioEndIdx; i += audioStride) {
    if (i >= audioDataBuffer.length) break
    const t = i / sampleRate
    audioSeries.value.push([t, audioDataBuffer[i] * 5])
  }

  while (
    swallowIdx < swallowRows.length &&
    swallowRows[swallowIdx].time <= tSec
  ) {
    const row = swallowRows[swallowIdx]
    swallowSeries.push([row.time, row.swallow])
    riskSeries.push([row.time, row.risk])
    if (row.swallow === 1) {
      if (!inSwallow) {
        inSwallow = true
        hasAlertedThisSwallow = false
      }
      if (!hasAlertedThisSwallow && row.risk > 0.1) {
        hasAlertedThisSwallow = true
        showRiskAlert(row.risk)
      }
    } else inSwallow = false
    swallowIdx++
  }

  capSeries(imuSeries.X, 10000)
  capSeries(imuSeries.Y, 10000)
  capSeries(imuSeries.Z, 10000)
  capSeries(gasSeries.value, 10000)
  capSeries(audioSeries.value, 10000)
  capSeries(swallowSeries, 4000)
  capSeries(riskSeries, 4000)

  imuChart.setOption(
    {
      ...createImuXYZOption(
        imuSeries.X,
        imuSeries.Y,
        imuSeries.Z,
        startShort,
        endShort,
      ),
      ...AXIS_UPDATE_ANIM,
    },
    AXIS_UPDATE_SETOPTION,
  )
  gasChart.setOption(
    {
      ...createSingleOption('呼吸信号', gasSeries.value, startShort, endShort),
      ...AXIS_UPDATE_ANIM,
    },
    AXIS_UPDATE_SETOPTION,
  )
  audioChart.setOption(
    {
      ...createSingleOption(
        '吞咽声音信号',
        audioSeries.value,
        startShort,
        endShort,
      ),
      ...AXIS_UPDATE_ANIM,
    },
    AXIS_UPDATE_SETOPTION,
  )
  swallowChart.setOption(
    {
      ...createSwallowOption(swallowSeries, riskSeries, startLong, endLong),
      ...AXIS_UPDATE_ANIM,
    },
    AXIS_UPDATE_SETOPTION,
  )

  animationId = requestAnimationFrame(frame)
}

//==================== 文件模式：“检测”模拟 ====================
function startFileModeDetection() {
  if (!filePayloadReady.value) {
    ElMessage.warning('请先上传 CSV 并完成列映射')
    return
  }
  isDetecting.value = true
  ElMessage.info('正在检测中，请稍后…')

  // 模拟服务端推理耗时：稍后生成假数据并开始“播放”
  const delay = 1200 + Math.floor(Math.random() * 800)
  fileDetectTimer = window.setTimeout(() => {
    // 基于已有数据长度估计总时长
    const maxTime = Math.max(
      imuSeries.X.at(-1)?.[0] || 0,
      imuSeries.Y.at(-1)?.[0] || 0,
      imuSeries.Z.at(-1)?.[0] || 0,
      gasSeries.value.at(-1)?.[0] || 0,
      audioSeries.value.at(-1)?.[0] || 0,
      10,
    )

    // 生成 3 段吞咽片段（假数据）
    const segs = [0.2, 0.46, 0.73].map((p) => {
      const center = Math.max(1.2, Math.min(maxTime - 1.2, p * maxTime))
      const half = 0.4 + Math.random() * 0.35 // 0.4~0.75s
      return [center - half, center + half]
    }) as [number, number][]

    swallowPlaybackRows = []
    const step = 0.05
    for (let t = 0; t <= maxTime; t = +(t + step).toFixed(2)) {
      const inSeg = segs.some(([s, e]) => t >= s && t <= e)
      const risk = inSeg ? +(0.2 + Math.random() * 0.7).toFixed(2) : 0
      swallowPlaybackRows.push({ time: t, swallow: inSeg ? 1 : 0, risk })
    }

    // 初始化文件模式的吞咽图（Auto 轴 + inside）
    const base = createSwallowOptionFile([], [])
    swallowChart.setOption(
      { ...base, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true },
    )
    swallowDisplaySeries = []
    riskDisplaySeries = []

    // 以 50ms 一批追加点，模拟曲线缓慢出现
    let idx = 0
    const batch = 5 // 每次追加 5 个点
    swallowPlayTimer = window.setInterval(() => {
      const end = Math.min(idx + batch, swallowPlaybackRows.length)
      for (; idx < end; idx++) {
        const row = swallowPlaybackRows[idx]
        swallowDisplaySeries.push([row.time, row.swallow])
        riskDisplaySeries.push([row.time, row.risk])
      }
      const opt = createSwallowOptionFile(
        swallowDisplaySeries,
        riskDisplaySeries,
      )
      swallowChart.setOption(opt, { notMerge: true })

      if (idx >= swallowPlaybackRows.length) {
        if (swallowPlayTimer != null) {
          clearInterval(swallowPlayTimer)
          swallowPlayTimer = null
        }
        isDetecting.value = false
        hasStopped.value = true
        canReset.value = true
      }
    }, 50)
  }, delay)
}

function initCharts() {
  swallowChart = echarts.init(swallowRef.value!)
  imuChart = echarts.init(imuRef.value!)
  gasChart = echarts.init(gasRef.value!)
  audioChart = echarts.init(audioRef.value!)
  renderEmptyCharts()

  // 实时模式资源（文件模式不会用到）
  fetch(audioUrl)
    .then((res) => res.arrayBuffer())
    .then((buffer) =>
      new (window.AudioContext || (window as any).webkitAudioContext)()
        .decodeAudioData(buffer)
        .then((decoded) => {
          audioDataBuffer = decoded.getChannelData(0)
          sampleRate = decoded.sampleRate
        }),
    )

  Papa.parse('/src/mock/signals/imu.csv', {
    download: true,
    header: true,
    complete: (res) => {
      imuRows = res.data as any[]
    },
  })
  Papa.parse('/src/mock/signals/gas.csv', {
    download: true,
    header: true,
    complete: (res) => {
      gasRows = res.data as any[]
    },
  })
  fetch('/src/mock/signals/swallow.json')
    .then((res) => res.json())
    .then((json) => {
      swallowRows = json
    })
}

onMounted(() => {
  if (!hasChartStarted.value) {
    initCharts()
    hasChartStarted.value = true
  }
})

//==================== 与服务器交互 ====================
// 批量删掉所有已上传过的临时文件（用于复位/模式切换）
async function deleteAllServerTempFiles() {
  for (const id of Array.from(allTempIds.value)) {
    try {
      await deleteTempFileApi(id)
    } catch {
      /* 忽略单个删除失败 */
    }
  }
  allTempIds.value.clear()
  currentTempId.value = null
  owner.audio = owner.gas = null
  owner.imu.X = owner.imu.Y = owner.imu.Z = null
}

// 如果某个 id 已经不再被任何图表引用，才去后端真正删除，避免误删共用文件
async function maybeDeleteServerFile(id: string | null) {
  if (!id) return
  const still = usingIds()
  if (still.has(id)) {
    // 仍被其他信号使用 ⇒ 不删
    ElNotification({
      title: '提示',
      message: '该 CSV 仍被其他信号使用，仅清空当前图表',
      type: 'info',
    })
    return
  }
  try {
    await deleteTempFileApi(id)
    allTempIds.value.delete(id)
  } catch (e: any) {
    ElNotification({
      title: '删除失败',
      message: e?.message || '删除临时文件失败',
      type: 'warning',
    })
  }
}
async function uploadTempCsvToServer(file: File) {
  try {
    const vo = await uploadTempFileApi(file)
    if (!vo?.tempId) throw new Error('服务器未返回临时文件 ID')
    currentTempId.value = vo.tempId
    allTempIds.value.add(vo.tempId)
    ElMessage.success('CSV 已上传至服务器（临时存储）')
  } catch (e: any) {
    currentTempId.value = null
    ElMessage.error(e?.message || 'CSV 上传失败')
    throw e
  }
}

async function submitCsvMappingToServer() {
  if (!currentTempId.value) return
  const payload: CsvMappingRequest = {
    sampleRate: csvConfigForm.value.sampleRate,
    imuAxisMap: csvConfigForm.value.imuAxisMap,
    gasCol: csvConfigForm.value.gasCol,
    audioCol: csvConfigForm.value.audioCol,
  }
  await submitCsvMapping(currentTempId.value, payload)
  // 用完就清掉本次“待提交映射”的 id
  currentTempId.value = null
}

//==================== 上传 & 映射 ====================
const handleCsvSelect = async (file: UploadFile) => {
  const raw = file.raw
  if (!raw) return
  const isCsv = raw.type === 'text/csv' || /\.csv$/i.test(raw.name)
  if (!isCsv) {
    ElNotification({
      title: '格式错误',
      message: '请上传 CSV 格式的文件',
      type: 'error',
    })
    return
  }

  // 先上传到服务器做临时保存
  try {
    await uploadTempCsvToServer(raw)
  } catch {
    return
  }

  // 前端预览
  const reader = new FileReader()
  reader.onload = (e) => {
    const csvText = e.target?.result as string
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
    rawCsvData.value = parsed.data as any[]
    csvHeaders.value = parsed.meta.fields || []
    csvPreviewData.value = (parsed.data as any[]).slice(0, 5)
    csvConfigDialogVisible.value = true
  }
  reader.readAsText(raw)
}

const submitCsvConfig = async () => {
  if (!csvConfigFormRef.value) return
  const valid = await csvConfigFormRef.value.validate()
  if (!valid) return

  const { sampleRate, imuAxisMap, gasCol, audioCol } = csvConfigForm.value
  const timeStep = 1 / sampleRate

  // 喉 XYZ
  Object.entries(imuAxisMap).forEach(([axis, col]) => {
    if (!col) return
    const axisKey = axis as 'X' | 'Y' | 'Z'
    const seriesData = rawCsvData.value.map((row, idx) => [
      +(idx * timeStep).toFixed(3),
      +row[col],
    ]) as [number, number][]
    imuSeries[axisKey] = seriesData
    imuAxisUsed.value[axisKey] = true
  })

  // 呼吸
  gasSeries.value = gasCol
    ? rawCsvData.value.map((row, idx) => [
        +(idx * timeStep).toFixed(3),
        +row[gasCol],
      ])
    : []
  // 声音
  audioSeries.value = audioCol
    ? rawCsvData.value.map((row, idx) => [
        +(idx * timeStep).toFixed(3),
        +row[audioCol],
      ])
    : []

  // 全量渲染（文件模式）
  renderFileModeCharts()

  // 把本次上传得到的 tempId 归属到对应信号（后续清空/删除时才能按引用删除）
  if (currentTempId.value) {
    const cid = currentTempId.value
    if (imuAxisMap.X) owner.imu.X = cid
    if (imuAxisMap.Y) owner.imu.Y = cid
    if (imuAxisMap.Z) owner.imu.Z = cid
    if (gasCol) owner.gas = cid
    if (audioCol) owner.audio = cid
  }

  // 通知服务器保存映射
  await submitCsvMappingToServer()
  filePayloadReady.value = true
  csvConfigDialogVisible.value = false
  csvConfigFormRef.value?.clearValidate()
}

const renderFileModeCharts = () => {
  const maxTime = Math.max(
    imuSeries.X.length ? imuSeries.X.at(-1)![0] : 0,
    gasSeries.value.length ? gasSeries.value.at(-1)![0] : 0,
    audioSeries.value.length ? audioSeries.value.at(-1)![0] : 0,
    1,
  )

  // IMU
  {
    const base = createImuXYZOptionFile(imuSeries.X, imuSeries.Y, imuSeries.Z)
    imuChart.setOption(
      { ...base, grid: base.grid, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true },
    )
    bindInsideZoomReset(imuChart, maxTime)
  }
  // GAS
  {
    const base = createSingleOptionFile('呼吸信号', gasSeries.value)
    gasChart.setOption(
      { ...base, grid: base.grid, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true },
    )
    bindInsideZoomReset(gasChart, maxTime)
  }
  // AUDIO
  {
    const base = createSingleOptionFile('吞咽声音信号', audioSeries.value)
    audioChart.setOption(
      { ...base, grid: base.grid, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true },
    )
    bindInsideZoomReset(audioChart, maxTime)
  }
}

// 清空图表数据（文件模式下会删除服务器临时文件并清空全部数据）
const clearChartData = async (chartType: 'imu' | 'gas' | 'audio') => {
  const label =
    chartType === 'imu' ? '喉运动' : chartType === 'gas' ? '呼吸' : '声音'
  try {
    await ElMessageBox.confirm(`确定要清空${label}信号数据吗？`, '确认清空', {
      type: 'warning',
    })
  } catch {
    return
  }

  if (chartType === 'imu') {
    // 记录当前 XYZ 归属的 id（可能是同一个，也可能不同）
    const idsToCheck = new Set<string>()
    if (imuSeries.X.length && owner.imu.X) idsToCheck.add(owner.imu.X)
    if (imuSeries.Y.length && owner.imu.Y) idsToCheck.add(owner.imu.Y)
    if (imuSeries.Z.length && owner.imu.Z) idsToCheck.add(owner.imu.Z)

    // 清掉前端曲线与占用标识
    imuSeries.X = []
    imuSeries.Y = []
    imuSeries.Z = []
    imuAxisUsed.value = { X: false, Y: false, Z: false }

    owner.imu.X = owner.imu.Y = owner.imu.Z = null

    // 对每个可能的 id 尝试“按引用删除”
    for (const id of idsToCheck) await maybeDeleteServerFile(id)
  } else if (chartType === 'gas') {
    const id = owner.gas
    gasSeries.value = []
    owner.gas = null
    await maybeDeleteServerFile(id)
  } else {
    const id = owner.audio
    audioSeries.value = []
    owner.audio = null
    await maybeDeleteServerFile(id)
  }

  // 图表刷新
  renderFileModeCharts()
}

// 模式切换：清空当前模式数据 +（文件模式）删除临时文件
watch(isFileMode, async (newVal, oldVal) => {
  if (modeGuard.value) return
  try {
    await ElMessageBox.confirm(
      '切换模式会清空当前页面的所有数据，是否继续？',
      '确认切换',
      { confirmButtonText: '继续', cancelButtonText: '取消', type: 'warning' },
    )
    await resetAllState()
    if (!newVal && hasChartStarted.value) initCharts() // 切回实时模式才初始化实时资源
  } catch {
    modeGuard.value = true
    isFileMode.value = oldVal
    await nextTick()
    modeGuard.value = false
  }
})
</script>

<style scoped>
.monitor-container {
  width: 1304px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  width: 100%;
  min-width: 0;
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
.header-actions .el-divider--vertical.header-divider {
  align-self: stretch;
  height: auto;
  margin: 0 6px;
}

.setting-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
}
.setting-item {
  flex: 1 1 0;
  min-width: 0;
}
.setting-button {
  width: 80px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.chart-box {
  width: 100%;
  height: 240px;
  position: relative;
}
.chart-span-all {
  grid-column: 1 / -1;
}
.echart-container {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header-row > div:last-child {
  display: flex;
  gap: 8px;
}
.el-button .el-icon {
  margin-right: 4px;
}

.device-select {
  flex: 2 1 0;
  min-width: 0;
}
.device-option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 2px;
}
.device-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.device-line {
  display: flex;
  align-items: center;
  gap: 8px;
}
.device-id {
  font-weight: 600;
}
.device-ip {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.tag-no-bold {
  font-weight: normal !important;
}
.device-desc {
  display: flex;
  color: #666;
  font-size: 12px;
  min-width: 0;
}
.desc-offline {
  color: #aaa !important;
}
.device-option-row .el-button {
  flex-shrink: 0;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}
.csv-preview {
  margin-bottom: 16px;
}
.preview-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}
.csv-config-form {
  margin-top: 20px;
}
.form-hint {
  font-size: 12px;
  color: #999;
}
.chart-header-actions {
  display: flex;
  gap: 8px;
}
.upload-btn {
  margin-right: 8px;
}

.chart-tool-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 30;
  pointer-events: auto;
}
.chart-box:hover .chart-tool-btn {
  opacity: 1;
}
.chart-tool-btn.is-disabled {
  opacity: 0.35;
  pointer-events: none;
}
.chart-tool-btn.always-show {
  opacity: 1;
}

.axis-map-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
}
.axis-select {
  width: 100%;
}
</style>

<style>
.risk-high,
.risk-mid,
.risk-low {
  font-weight: bold;
  font-size: 16px;
  padding: 12px 16px;
  border: none !important;
}
.risk-high .el-notification__group,
.risk-mid .el-notification__group,
.risk-low .el-notification__group {
  background-color: inherit !important;
}
.risk-high .el-icon,
.risk-high .el-notification__title,
.risk-high .el-notification__content,
.risk-high .el-notification__closeBtn {
  color: #fff5f5 !important;
}
.risk-mid .el-icon,
.risk-mid .el-notification__title,
.risk-mid .el-notification__content,
.risk-mid .el-notification__closeBtn {
  color: #fffaf0 !important;
}
.risk-low .el-icon,
.risk-low .el-notification__title,
.risk-low .el-notification__content,
.risk-low .el-notification__closeBtn {
  color: #f0f8ff !important;
}
.risk-high {
  background-color: #ff4d4f !important;
  border-left: 6px solid #a8071a !important;
}
.risk-mid {
  background-color: #fa8c16 !important;
  border-left: 6px solid #ad4e00 !important;
}
.risk-low {
  background-color: #1890ff !important;
  border-left: 6px solid #003a8c !important;
}
</style>
