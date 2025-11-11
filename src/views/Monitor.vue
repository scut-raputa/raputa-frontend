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
        <!-- <el-input
          v-model="patientName"
          placeholder="请输入患者姓名"
          clearable
          size="small"
          class="setting-item"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input> -->
        <el-select-v2
          v-model="selectedPatientId"
          :options="patientOptions"
          :remote="true"
          :loading="patientLoading"
          :remote-method="remotePatientQuery"
          size="small"
          filterable
          clearable
          placeholder="请选择患者"
          @visible-change="onPatientSelectVisible"
          @clear="() => { patientOptions = []; fetchPatients('') }"
          style="width: 360px"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-select-v2>

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
          <el-option label="吞咽障碍筛查" value="dys" />
          <el-option label="误吸检测" value="asp" />
          <el-option label="吞咽障碍筛查+误吸检测" value="both" />
        </el-select>

        <!-- 设备仅用于实时模式；文件模式不必选，仍保留控件以便切换 -->
        <el-select-v2
          v-model="selectedDevice"
          multiple
          class="setting-item device-select"
          size="small"
          :loading="loading"
          :options="loading ? [] : deviceOptions"
          :filterable="true"
          :remote="true"
          :disabled="isFileMode"
          :filter-method="filterDevices"
          placeholder="请选择检测设备（实时模式）"
          clearable
          teleported
          popper-class="device-select-popper"
          :item-height="80"
          collapse-tags
          :max-collapse-tags="1"
          @visible-change="handleSelectVisibleChange"
        >
          <template #prefix>
            <el-icon><Tools /></el-icon>
          </template>

          <template #empty>
            <div v-if="loading" class="loading-container">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <div class="loading-text">
                正在发现设备中……
                <br />
                请确保设备已开机并连接到同一网络
              </div>
            </div>
            <div v-else class="empty-container">
              <span>暂无设备，点击下拉框发现设备</span>
            </div>
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
                  <div>MAC: {{ item.mac }}</div>
                  <strong>
                    {{ item.desc }}
                  </strong>
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
              ref="imuUploadRef"
              class="upload-btn"
              :auto-upload="false"
              :show-file-list="false"
              :disabled="!isFileMode"
              accept=".csv"
              :on-change="(file) => handleCsvSelect(file, 'imu')"
            >
              <el-tooltip
                content="仅在文件模式下上传，格式为.csv（服务器将临时保存）"
                placement="top"
              >
                <el-button v-if="isFileMode" type="primary" size="small">
                  <el-icon style="margin-right: 4px"><DataLine /></el-icon>
                  上传三轴信号文件
                </el-button>
              </el-tooltip>
            </el-upload>

            <el-upload
              ref="gasUploadRef"
              class="upload-btn"
              :auto-upload="false"
              :show-file-list="false"
              :disabled="!isFileMode"
              accept=".csv"
              :on-change="(file) => handleCsvSelect(file, 'gas')"
            >
              <el-tooltip
                content="仅在文件模式下上传，格式为.csv（服务器将临时保存）"
                placement="top"
              >
                <el-button v-if="isFileMode" type="primary" size="small">
                  <el-icon style="margin-right: 4px"><Histogram /></el-icon>
                  上传鼻气流信号文件
                </el-button>
              </el-tooltip>
            </el-upload>

            <el-upload
              ref="audioUploadRef"
              class="upload-btn"
              :auto-upload="false"
              :show-file-list="false"
              :disabled="!isFileMode"
              accept=".wav"
              :on-change="handleAudioSelect"
            >
              <el-tooltip
                content="仅在文件模式下上传，格式为.wav"
                placement="top"
              >
                <el-button v-if="isFileMode" type="primary" size="small">
                  <el-icon style="margin-right: 4px"><Headset /></el-icon>
                  上传音频信号文件
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
    :title="getConfigDialogTitle()"
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
      <el-form-item v-if="currentSignalType === 'imu'" label="喉运动信号映射">
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
      <el-form-item v-if="currentSignalType === 'gas'" label="呼吸信号映射">
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
      <el-form-item v-if="currentSignalType === 'audio'" label="声音信号映射">
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
  Loading,
  Histogram,
  Headset,
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
import {
  quickDeviceDiscovery,
  connectRealtimeDevice,
  disconnectRealtimeDevice,
} from '@/api/device'
import { uploadAndPredict, type DetectionResponse } from '@/api/detect'
import SockJS from 'sockjs-client'
import { Client, type Frame } from '@stomp/stompjs'
import axios from 'axios'

type PatientOption = { value: string; label: string; id: string; name: string }

const patientLoading = ref(false)
const patientOptions = ref<PatientOption[]>([])
const selectedPatientId = ref<string>('')

const selectedPatientName = computed(() => {
  const hit = patientOptions.value.find(o => o.value === selectedPatientId.value)
  return hit?.name ?? ''
})

// 合并并按 id 去重
function mergeById(a: any[], b: any[]) {
  const map = new Map<string, any>()
  ;[...a, ...b].forEach(p => map.set(p.id, p))
  return Array.from(map.values())
}

// —— 稳妥版：分别按 id 和 name 搜，合并结果 ——
// keyword 为空时只拉最近一页（按 admit desc, id desc）
async function fetchPatients(keyword = '') {
  patientLoading.value = true
  try {
    const base = { page: 1, size: 100 }

    // 空关键字：拉一页最近入院的
    if (!keyword.trim()) {
      const { data } = await axios.get('/api/patient', { params: base })
      const items = data?.data?.items ?? []
      patientOptions.value = items.map((p: any) => ({
        value: p.id,
        label: `${p.id} - ${p.name}`,
        id: p.id,
        name: p.name,
      }))
      return
    }

    // 非空：并行两次请求（按 id 和按 name）
    const kw = keyword.trim()
    const [byId, byName] = await Promise.all([
      axios.get('/api/patient', { params: { ...base, id: kw } }),
      axios.get('/api/patient', { params: { ...base, name: kw } }),
    ])

    const itemsId = byId?.data?.data?.items ?? []
    const itemsName = byName?.data?.data?.items ?? []
    const merged = mergeById(itemsId, itemsName)

    patientOptions.value = merged.map((p: any) => ({
      value: p.id,
      label: `${p.id} - ${p.name}`,
      id: p.id,
      name: p.name,
    }))
  } catch (e: any) {
    ElMessage.error(e?.message || '患者列表加载失败')
    patientOptions.value = []
  } finally {
    patientLoading.value = false
  }
}

// 远程搜索（带微小防抖）
const remotePatientQuery = (q: string) => {
  if ((remotePatientQuery as any)._t) clearTimeout((remotePatientQuery as any)._t)
  ;(remotePatientQuery as any)._t = setTimeout(() => fetchPatients(q), 200)
}

// 首次展开下拉时拉一页
function onPatientSelectVisible(visible: boolean) {
  if (visible && patientOptions.value.length === 0) {
    fetchPatients('')
  }
}

// === 从“已选设备ID列表”中取“第一个设备”的完整对象（若未选则为 null）
const firstSelectedDevice = computed(() => {
  const firstId = selectedDevice.value?.[0]
  if (!firstId) return null
  return deviceList.value.find((d) => d.id === firstId) || null
})

// === 动态派生当前设备三要素（用于发后端，不需要额外状态）
const currentDeviceId = computed(() => firstSelectedDevice.value?.id ?? '')
const pickedDeviceIp = computed(() => firstSelectedDevice.value?.ip ?? '')
const currentDeviceName = computed(() => firstSelectedDevice.value?.id ?? '')

const durationShort = 5
const durationLong = 10

const modeGuard = ref(false)

const loading = ref(true)

const deviceip = ref('')

// WebSocket 客户端
let stompClient: Client | null = null
const wsConnected = ref(false)

// 实时数据基准时间戳 - 用于计算相对时间
let realtimeBaseTimestamp = 0

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
let dysphagiaDisplaySeries: [number, number][] = [] // 吞咽障碍概率
let aspirationDisplaySeries: [number, number][] = [] // 误吸概率
let swallowPlaybackRows: {
  time: number
  dysphagia: number
  aspiration: number
}[] = []
let swallowPlayTimer: number | null = null
let fileDetectTimer: number | null = null
let swallowSegments: [number, number][] = [] // 存储吞咽时间段（用于遮罩）
let aspirationSegments: [number, number][] = [] // 存储误吸时间段（用于红色遮罩）

let audioDataBuffer: Float32Array = new Float32Array()
const audioUrl = new URL('@/mock/signals/audio.wav', import.meta.url).href

// 控制变量
const selectedSegModel = ref('segA') // 默认选择第一个分割模型
const selectedDetModel = ref('detC') // 默认选择第一个检测模型
const selectedTask = ref('both') // 默认选择第一个任务
const selectedDevice = ref<string[]>([])
const isDetecting = ref(false)
const hasStopped = ref(false)
const canReset = ref(false)
const hasChartStarted = ref(false)

const reportDialogVisible = ref(false)
const reportRef = ref<HTMLElement | null>(null)

// 上传组件ref
const imuUploadRef = ref<any>(null)
const gasUploadRef = ref<any>(null)
const audioUploadRef = ref<any>(null)

// 存储上传的原始文件（用于发送到检测接口）
const uploadedFiles = reactive({
  audio: null as File | null,
  imu: null as File | null,
  gas: null as File | null,
})

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
      Boolean
    ) as string[]
  )

// CSV上传相关状态
const csvConfigDialogVisible = ref(false)
const csvPreviewData = ref<any[]>([])
const csvHeaders = ref<string[]>([])
const rawCsvData = ref<any[]>([])
const currentSignalType = ref<'imu' | 'gas'>('imu') // 当前上传的信号类型

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
  mac: string
  status: 'online' | 'offline'
  desc: string
}
const deviceList = ref<DeviceItem[]>([
  // {
  //   id: 'DEV-001',
  //   ip: '192.168.1.10',
  //   status: 'online',
  //   desc: '实验室 | 三轴加速度计传感器',
  // },
  // {
  //   id: 'DEV-002',
  //   ip: '192.168.1.23',
  //   status: 'offline',
  //   desc: '门诊房间 A | 气体流量传感器',
  // },
  // {
  //   id: 'DEV-003',
  //   ip: '192.168.1.45',
  //   status: 'online',
  //   desc: '门诊房间 B | 接触式麦克风',
  // },
  // {
  //   id: 'DEV-004',
  //   ip: '192.168.1.60',
  //   status: 'offline',
  //   desc: '门诊房间 C | 鼻套管式流量传感器',
  // },
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
    }))
)

// 全选（仅在线）控制
const checkAllDevices = ref(false)
const indeterminateDevices = ref(false)

const matchedEnabledDevices = computed(() =>
  deviceOptions.value.filter((opt) => !opt.disabled)
)

watch([selectedDevice, matchedEnabledDevices], () => {
  const selectedInView = matchedEnabledDevices.value.filter((opt) =>
    selectedDevice.value.includes(opt.value)
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
    (opt) => opt.value as string
  )
  if (val) {
    selectedDevice.value = Array.from(
      new Set([...selectedDevice.value, ...idsInView])
    )
  } else {
    selectedDevice.value = selectedDevice.value.filter(
      (id) => !idsInView.includes(id)
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

// 处理设备发现
async function handleDeviceDiscovery() {
  if (loading.value) return // 如果正在加载中，不重复发送请求

  loading.value = true
  try {
    const deviceData = await quickDeviceDiscovery()

    if (!deviceData) {
      throw new Error('未收到设备数据')
    }

    // 创建新的设备项
    const newDevice: DeviceItem = {
      id: `树莓派-01`, // 生成唯一ID
      ip: deviceData.deviceIp,
      mac: JSON.parse(deviceData.deviceInfo).mac,
      status: deviceData.status === 'ONLINE' ? 'online' : 'offline',
      desc: `发现时间: ${new Date(
        deviceData.discoveryTime
      ).toLocaleTimeString()}`,
    }

    // 检查是否已存在相同IP的设备
    const existingIndex = deviceList.value.findIndex(
      (d) => d.ip === newDevice.ip
    )
    if (existingIndex >= 0) {
      // 更新现有设备
      deviceList.value[existingIndex] = newDevice
      ElMessage.success(`设备 ${newDevice.ip} 状态已更新`)
    } else {
      // 添加新设备
      deviceList.value.push(newDevice)
      ElMessage.success(`发现新设备: ${newDevice.ip}`)
      deviceip.value = newDevice.ip
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '设备发现失败')
  } finally {
    loading.value = false
  }
}

// 处理下拉框显示/隐藏事件
function handleSelectVisibleChange(visible: boolean) {
  if (visible && !isFileMode.value) {
    // 当下拉框打开且不是文件模式时，触发设备发现
    handleDeviceDiscovery()
  }
}

function toggleDeviceConnection(item: DeviceItem) {
  const target = deviceList.value.find((d) => d.id === item.id)
  if (!target) return
  if (target.status === 'offline') target.status = 'online'
  else {
    target.status = 'offline'
    if (selectedDevice.value.includes(target.id)) {
      selectedDevice.value = selectedDevice.value.filter(
        (id) => id !== target.id
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
    '.suggestion-text'
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
  const filename = `吞咽报告_${reportData.value.name}_${getBeijingTimestamp(
    true
  )}.pdf`
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
  const hasPatient = !!selectedPatientId.value
  if (isFileMode.value) {
    return !!(
      hasPatient &&
      selectedSegModel.value &&
      selectedDetModel.value &&
      filePayloadReady.value &&
      !isDetecting.value
    )
  }
  // 实时模式：患者+模型+任务+至少一个设备
  return !!(
    !isFileMode.value &&
    hasPatient &&
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
  selectedPatientId.value = ''
  selectedSegModel.value = 'segA'
  selectedDetModel.value = 'detC'
  selectedTask.value = 'both'
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
  currentSignalType.value = 'imu'
}

// 获取配置对话框标题
function getConfigDialogTitle() {
  const titles = {
    imu: '三轴信号配置',
    gas: '鼻气流信号配置',
  }
  return titles[currentSignalType.value]
}

// 验证CSV文件列数
function validateColumnCount(
  signalType: 'imu' | 'gas',
  headers: string[]
): boolean {
  const columnCount = headers.length

  if (signalType === 'imu') {
    if (columnCount !== 4) {
      ElNotification({
        title: '文件格式错误',
        message: `IMU信号文件应包含4列数据（时间戳 + X、Y、Z轴），当前文件包含${columnCount}列，请重新选择正确的文件`,
        type: 'error',
        duration: 5000,
      })
      return false
    }
  } else if (signalType === 'gas') {
    if (columnCount !== 2) {
      ElNotification({
        title: '文件格式错误',
        message: `鼻气流信号文件应包含2列数据（时间戳 + 气流值），当前文件包含${columnCount}列，请重新选择正确的文件`,
        type: 'error',
        duration: 5000,
      })
      return false
    }
  }

  return true
}

// 根据信号类型设置默认映射
function setDefaultMapping(signalType: 'imu' | 'gas') {
  // 重置表单
  csvConfigForm.value = {
    sampleRate: 4000,
    imuAxisMap: { X: '', Y: '', Z: '' },
    gasCol: '',
    audioCol: '',
  }

  if (signalType === 'imu') {
    csvConfigForm.value.sampleRate = 2000
    // IMU信号默认映射X、Y、Z列
    const headers = csvHeaders.value
    if (headers.includes('X')) csvConfigForm.value.imuAxisMap.X = 'X'
    if (headers.includes('Y')) csvConfigForm.value.imuAxisMap.Y = 'Y'
    if (headers.includes('Z')) csvConfigForm.value.imuAxisMap.Z = 'Z'
  } else if (signalType === 'gas') {
    csvConfigForm.value.sampleRate = 100
    // 鼻气流信号默认映射value列
    const headers = csvHeaders.value
    if (headers.includes('value')) csvConfigForm.value.gasCol = 'value'
    else if (headers.includes('flow')) csvConfigForm.value.gasCol = 'flow'
    else if (headers.includes('gas')) csvConfigForm.value.gasCol = 'gas'
    else if (headers.length >= 2) csvConfigForm.value.gasCol = headers[1] // 默认选择第二列
  }
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

  // 重置实时数据基准时间戳
  realtimeBaseTimestamp = 0

  imuSeries.X.length = 0
  imuSeries.Y.length = 0
  imuSeries.Z.length = 0
  gasSeries.value.length = 0
  audioSeries.value.length = 0

  swallowSeries.length = 0
  riskSeries.length = 0
  dysphagiaDisplaySeries = []
  aspirationDisplaySeries = []
  swallowPlaybackRows = []
  swallowSegments = []
  aspirationSegments = []

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
  end: number
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

async function startDetection() {
  reportData.value.date = formatDateTime(new Date())
  hasStopped.value = false
  canReset.value = false
  isInitial.value = false

  // === 计算主设备（取已选列表的第一个）+ IP（从 deviceList 里找）
  const primaryId = selectedDevice.value?.[0] || ''
  const primaryIp = deviceList.value.find((d) => d.id === primaryId)?.ip || ''

  if (!primaryId || !primaryIp) {
    // ✅ 新增兜底
    ElMessage.error('请先选择在线设备（deviceId/deviceIp 不能为空）')
    return
  }

  if (isFileMode.value) {
    startFileModeDetection()
    return
  }

  // 实时模式 - 连接设备并启动WebSocket
  try {
    if (selectedDevice.value.length === 0) {
      ElMessage.error('请先选择设备')
      return
    }
    console.log('已选设备列表:', selectedDevice.value)

    // 获取第一个选中的设备ID（selectedDevice.value 是数组）
    const firstDeviceId = selectedDevice.value[0]
    console.log('第一个设备ID:', firstDeviceId)

    const device = deviceList.value.find((d) => d.id === firstDeviceId)
    if (!device) {
      console.log('设备列表:', deviceList.value)
      ElMessage.error(`设备不存在: ${firstDeviceId}`)
      return
    }
    console.log('找到设备:', device)

    ElMessage.info('正在连接设备...')

    // 如果是初次启动，清空之前的数据
    if (isInitial.value) {
      imuSeries.X.length = 0
      imuSeries.Y.length = 0
      imuSeries.Z.length = 0
      gasSeries.value.length = 0
      audioSeries.value.length = 0
      realtimeBaseTimestamp = 0
    }

    // 连接设备（注意：这里 primaryId 必须是字符串）
    await connectRealtimeDevice(
      primaryIp, // 设备IP
      primaryId, // 设备ID
      primaryId,
      selectedPatientId.value, // 患者编号
      selectedPatientName.value // 患者姓名
    )

    // 建立 WebSocket
    await connectWebSocket(primaryId)

    // 启动渲染
    isDetecting.value = true
    startTime = performance.now()
    lastRender = 0
    if (animationId == null) animationId = requestAnimationFrame(frame)

    ElMessage.success('设备连接成功,正在接收数据...')
  } catch (error: any) {
    ElMessage.error(error?.message || '连接设备失败')
    isDetecting.value = false
  }
}

async function stopDetection() {
  // === 计算主设备（取已选列表的第一个）+ IP（从 deviceList 里找）
  const primaryId = selectedDevice.value?.[0] || ''
  const primaryIp = deviceList.value.find((d) => d.id === primaryId)?.ip || ''

  if (isFileMode.value) {
    // 文件模式：停止"结果播放"
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

  // 实时模式 - 断开WebSocket和设备连接
  isDetecting.value = false
  hasStopped.value = true
  canReset.value = true
  totalElapsed += performance.now() - startTime
  if (animationId != null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  // 断开WebSocket
  disconnectWebSocket()

  // 断开设备连接
  if (selectedDevice.value.length > 0) {
    try {
      const primaryId = selectedDevice.value?.[0] || ''
      if (primaryId) {
        await disconnectRealtimeDevice(primaryId)
      }
      // ElMessage.success(`设备已断开连接,文件已保存至:${csvPath}`)
    } catch (error: any) {
      console.error('断开设备失败:', error)
    }
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
    }
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
        eShort
      ) as echarts.EChartsOption),
      dataZoom: [],
    },
    { notMerge: true }
  )
  gasChart.setOption(
    {
      ...(createSingleOption(
        '呼吸信号',
        [],
        sShort,
        eShort
      ) as echarts.EChartsOption),
      dataZoom: [],
    },
    { notMerge: true }
  )
  audioChart.setOption(
    {
      ...(createSingleOption(
        '吞咽声音信号',
        [],
        sShort,
        eShort
      ) as echarts.EChartsOption),
      dataZoom: [],
    },
    { notMerge: true }
  )

  if (isFileMode.value) {
    // 文件模式：吞咽图使用 Auto 轴 + inside 缩放
    const base = createSwallowOptionFile([], [])
    swallowChart.setOption(
      { ...base, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true }
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
  end: number
): echarts.EChartsOption {
  const colorMap: Record<string, string> = {
    '喉运动信号 X': '#5470C6',
    '喉运动信号 Y': '#91CC75',
    '喉运动信号 Z': '#8672c4',
    呼吸信号: '#58c1fa',
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
  end: number
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
  risk: [number, number][]
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

// 创建两个模型风险概率图表配置（文件模式，带吞咽段遮罩）
function createSwallowRiskOptionFile(
  dysphagia: [number, number][],
  aspiration: [number, number][],
  swallowSegments: [number, number][]
): echarts.EChartsOption {
  // 生成吞咽段遮罩数据
  const markAreas = swallowSegments.map(([start, end]) => [
    { xAxis: start, itemStyle: { color: 'rgba(128, 128, 128, 0.15)' } },
    { xAxis: end },
  ])

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        let result = `时间: ${params[0].axisValue.toFixed(2)}s<br/>`
        params.forEach((item: any) => {
          const value = (item.value[1] * 100).toFixed(1)
          result += `${item.marker}${item.seriesName}: ${value}%<br/>`
        })
        return result
      },
    },
    legend: { data: ['吞咽障碍概率', '误吸概率'], top: 8, itemGap: 4 },
    grid: { top: 40, bottom: 24, left: 40, right: 20 },
    xAxis: createXAxisAuto(),
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      axisLabel: {
        formatter: (value: number) => `${(value * 100).toFixed(0)}%`,
      },
    },
    series: [
      {
        name: '吞咽障碍概率',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#E67E22' },
        data: dysphagia,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
        markArea: {
          silent: true,
          data: markAreas,
          label: { show: false },
        },
      },
      {
        name: '误吸概率',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: '#FF4D4F' },
        data: aspiration,
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
  dataZ: [number, number][]
): echarts.EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        snap: true,
        axis: 'x',
      },
    },
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
        lineStyle: { width: 2, color: '#b0a3d7' },
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
  data: [number, number][]
): echarts.EChartsOption {
  const colorMap: Record<string, string> = {
    '喉运动信号 X': '#5470C6',
    '喉运动信号 Y': '#91CC75',
    '喉运动信号 Z': '#b0a3d7',
    呼吸信号: '#FAC858',
    吞咽声音信号: '#73C0DE',
  }
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        snap: true,
        axis: 'x',
      },
      // 只显示最近的一个数据点
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        const param = params[0]
        return `时间: ${param.axisValue.toFixed(3)}s<br/>${param.marker}${
          param.seriesName
        }: ${param.value[1].toFixed(4)}`
      },
    },
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

  // WebSocket 实时数据已经在接收时限制了数量,这里不需要 prune
  // 只 prune 音频和吞咽相关数据(这些还是使用模拟数据)
  pruneSeries(audioSeries.value, startShort)
  pruneSeries(swallowSeries, startLong)
  pruneSeries(riskSeries, startLong)

  // WebSocket 实时模式下不使用模拟数据
  // 实时数据由 handleRealtimeImuData 和 handleRealtimeGasData 直接添加到序列中
  // 这里只处理音频数据（音频还是使用模拟数据）

  // 注释掉模拟的 IMU、GAS 和 AUDIO 数据推送,避免干扰 WebSocket 实时数据
  /*
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
  */

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

  // WebSocket 实时数据已经在接收时限制了数量,这里不需要 cap
  // 只 cap 音频和吞咽相关数据
  capSeries(audioSeries.value, 10000)
  capSeries(swallowSeries, 4000)
  capSeries(riskSeries, 4000)

  // 实时模式: 禁用动画,固定坐标轴范围
  imuChart.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: {
        data: ['喉运动信号 X', '喉运动信号 Y', '喉运动信号 Z'],
        top: 8,
        itemGap: 4,
      },
      grid: { top: 40, bottom: 24, left: 40, right: 20 },
      xAxis: {
        type: 'value',
        min: startShort,
        max: endShort,
        axisLabel: {
          showMinLabel: true,
          showMaxLabel: true,
          formatter: (val: number) => {
            if (Math.abs(val - startShort) < 0.01)
              return `${startShort.toFixed(1)}s`
            if (Math.abs(val - endShort) < 0.01)
              return `${endShort.toFixed(1)}s`
            return ''
          },
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false, // 隐藏X轴线
        },
        splitLine: {
          show: false, // 隐藏网格线
        },
      },
      yAxis: {
        type: 'value',
        min: -400, // 调整为-300到300
        max: 400,
        splitLine: {
          show: true,
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: '喉运动信号 X',
          type: 'line',
          showSymbol: false,
          lineStyle: { width: 2, color: '#5470C6' },
          data: imuSeries.X,
          animation: false,
          sampling: 'lttb',
        },
        {
          name: '喉运动信号 Y',
          type: 'line',
          showSymbol: false,
          lineStyle: { width: 2, color: '#91CC75' },
          data: imuSeries.Y,
          animation: false,
          sampling: 'lttb',
        },
        {
          name: '喉运动信号 Z',
          type: 'line',
          showSymbol: false,
          lineStyle: { width: 2, color: '#EE6666' },
          data: imuSeries.Z,
          animation: false,
          sampling: 'lttb',
        },
      ],
    },
    { notMerge: false, replaceMerge: ['series'], silent: true }
  )
  // GAS 图表: 禁用动画,固定坐标轴范围
  gasChart.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: ['呼吸信号'], top: 8, itemGap: 4 },
      grid: { top: 40, bottom: 24, left: 40, right: 20 },
      xAxis: {
        type: 'value',
        min: startShort,
        max: endShort,
        axisLabel: {
          showMinLabel: true,
          showMaxLabel: true,
          formatter: (val: number) => {
            if (Math.abs(val - startShort) < 0.01)
              return `${startShort.toFixed(1)}s`
            if (Math.abs(val - endShort) < 0.01)
              return `${endShort.toFixed(1)}s`
            return ''
          },
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false, // 隐藏X轴线
        },
        splitLine: {
          show: false, // 隐藏网格线
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100, // 根据实际GAS数据范围调整
        splitLine: {
          show: true,
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: '呼吸信号',
          type: 'line',
          showSymbol: false,
          lineStyle: { width: 2, color: '#FAC858' },
          data: gasSeries.value,
          animation: false,
          sampling: 'lttb',
        },
      ],
    },
    { notMerge: false, replaceMerge: ['series'], silent: true }
  )
  audioChart.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          snap: true,
          axis: 'x',
        },
        formatter: (params: any) => {
          if (!params || params.length === 0) return ''
          const param = params[0]
          return `时间: ${param.axisValue.toFixed(3)}s<br/>${param.marker}${
            param.seriesName
          }: ${param.value[1].toFixed(4)}`
        },
      },
      legend: { data: ['吞咽声音信号'], top: 8, itemGap: 4 },
      grid: { top: 40, bottom: 24, left: 40, right: 20 },
      xAxis: {
        type: 'value',
        min: startShort,
        max: endShort,
        axisLabel: {
          showMinLabel: true,
          showMaxLabel: true,
          formatter: (val: number) => {
            if (Math.abs(val - startShort) < 0.01)
              return `${startShort.toFixed(1)}s`
            if (Math.abs(val - endShort) < 0.01)
              return `${endShort.toFixed(1)}s`
            return ''
          },
        },
        axisTick: { show: false },
        axisLine: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: -0.6,
        max: 0.6,
        splitLine: {
          show: true,
          lineStyle: { color: '#f0f0f0', type: 'dashed' },
        },
      },
      series: [
        {
          name: '吞咽声音信号',
          type: 'line',
          showSymbol: false,
          lineStyle: { width: 2, color: '#73C0DE' },
          data: audioSeries.value,
          animation: false,
          sampling: 'lttb',
        },
      ],
    },
    { notMerge: false, replaceMerge: ['series'], silent: true }
  )
  swallowChart.setOption(
    {
      ...createSwallowOption(swallowSeries, riskSeries, startLong, endLong),
      ...AXIS_UPDATE_ANIM,
    },
    AXIS_UPDATE_SETOPTION
  )

  animationId = requestAnimationFrame(frame)
}

//==================== 文件模式：“检测”模拟 ====================
async function startFileModeDetection() {
  if (!filePayloadReady.value) {
    ElMessage.warning('请先上传所有信号文件')
    return
  }

  // 检查文件是否都已上传
  if (!uploadedFiles.audio || !uploadedFiles.imu || !uploadedFiles.gas) {
    ElMessage.error('缺少必要的文件，请确保已上传音频、IMU和鼻气流文件')
    return
  }

  isDetecting.value = true
  ElMessage.info('正在上传文件并进行检测，请稍后…')

  try {
    // 调用检测接口
    const result: DetectionResponse = await uploadAndPredict(
      uploadedFiles.audio,
      uploadedFiles.imu,
      uploadedFiles.gas
    )

    // 检查是否检测到吞咽事件
    if (result.message) {
      ElNotification({
        title: '检测完成',
        message: result.message,
        type: 'warning',
        duration: 5000,
      })
      isDetecting.value = false
      hasStopped.value = true
      canReset.value = true
      return
    }

    // 处理检测结果
    if (result.swallow_events && result.swallow_events.length > 0) {
      // 获取信号的最大时间（秒）
      const maxTime = Math.max(
        imuSeries.X.at(-1)?.[0] || 0,
        imuSeries.Y.at(-1)?.[0] || 0,
        imuSeries.Z.at(-1)?.[0] || 0,
        gasSeries.value.at(-1)?.[0] || 0,
        audioSeries.value.at(-1)?.[0] || 0,
        10
      )

      // 将毫秒转换为秒，并生成吞咽段数据
      const events = result.swallow_events.map(([start, end]) => [
        start / 1000, // 转换为秒
        end / 1000,
      ])

      // 保存吞咽时间段（用于遮罩）
      swallowSegments = events as [number, number][]

      // 生成两个模型的概率数据
      swallowPlaybackRows = []
      const step = 0.05 // 50ms步长

      for (let t = 0; t <= maxTime; t = +(t + step).toFixed(2)) {
        // 检查当前时间点是否在某个吞咽段内
        let eventIndex = -1
        let inEvent = false

        for (let i = 0; i < events.length; i++) {
          const [start, end] = events[i]
          if (t >= start && t <= end) {
            inEvent = true
            eventIndex = i
            break
          }
        }

        // 获取两个模型的概率
        let dysphagiaProb = 0
        let aspirationProb = 0

        if (inEvent && eventIndex >= 0) {
          // 吞咽障碍检测结果的概率（取第二个类别的概率）
          if (result.dysphagia && result.dysphagia[eventIndex]) {
            dysphagiaProb = result.dysphagia[eventIndex].probabilitys[1] || 0
          }
          // 误吸检测结果的概率
          if (result.aspiration && result.aspiration[eventIndex]) {
            aspirationProb = result.aspiration[eventIndex].probabilitys[1] || 0
          }
        }

        swallowPlaybackRows.push({
          time: t,
          dysphagia: +dysphagiaProb.toFixed(3),
          aspiration: +aspirationProb.toFixed(3),
        })
      }

      // 初始化文件模式的吞咽图（Auto 轴 + inside + 吞咽段遮罩）
      const base = createSwallowRiskOptionFile([], [], swallowSegments)
      swallowChart.setOption(
        { ...base, dataZoom: [{ ...INSIDE_ZOOM }] },
        { notMerge: true }
      )
      dysphagiaDisplaySeries = []
      aspirationDisplaySeries = []

      // 以 50ms 一批追加点，模拟曲线缓慢出现
      let idx = 0
      const batch = 5 // 每次追加 5 个点
      swallowPlayTimer = window.setInterval(() => {
        const end = Math.min(idx + batch, swallowPlaybackRows.length)
        for (; idx < end; idx++) {
          const row = swallowPlaybackRows[idx]
          dysphagiaDisplaySeries.push([row.time, row.dysphagia])
          aspirationDisplaySeries.push([row.time, row.aspiration])
        }
        const opt = createSwallowRiskOptionFile(
          dysphagiaDisplaySeries,
          aspirationDisplaySeries,
          swallowSegments
        )
        swallowChart.setOption(opt, { notMerge: true })

        if (idx >= swallowPlaybackRows.length) {
          if (swallowPlayTimer != null) {
            clearInterval(swallowPlayTimer)
            swallowPlayTimer = null
          }
          // 渲染完成后，在IMU/GAS/Audio图表上添加误吸遮罩
          renderAspirationMasks()
        }
      }, 50)

      // 显示检测结果和危险提示
      const totalEvents = result.swallow_events.length

      // 统计误吸段并收集时间段
      const aspirationEvents: { time: string; label: string }[] = []
      aspirationSegments = [] // 重置误吸段

      if (result.aspiration) {
        result.aspiration.forEach((asp, idx) => {
          if (asp.predicted_class === 1 && events[idx]) {
            const [start, end] = events[idx]
            aspirationEvents.push({
              time: `${start.toFixed(1)}s - ${end.toFixed(1)}s`,
              label: asp.label,
            })
            // 收集误吸时间段用于遮罩
            aspirationSegments.push([start, end])
          }
        })
      }

      // 显示检测结果
      if (aspirationEvents.length > 0) {
        const timeList = aspirationEvents.map((e) => e.time).join('、')
        ElNotification({
          title: '⚠️ 危险提示',
          message: `检测到 ${totalEvents} 段吞咽事件，其中 ${aspirationEvents.length} 段存在误吸风险！\n时间段：${timeList}`,
          type: 'error',
          duration: 0, // 不自动关闭
          showClose: true,
        })
      } else {
        ElMessage.success(
          `✅检测完成！共检测到 ${totalEvents} 个吞咽事件，未发现误吸风险`
        )
      }

      // 打印检测结果到控制台（用于调试）
      console.log('检测结果:', result)
      if (result.dysphagia) {
        console.log('吞咽障碍检测:', result.dysphagia)
      }
      if (result.aspiration) {
        console.log('误吸检测:', result.aspiration)
      }
    } else {
      ElNotification({
        title: '检测完成',
        message: '未检测到吞咽事件',
        type: 'info',
        duration: 5000,
      })
    }

    isDetecting.value = false
    hasStopped.value = true
    canReset.value = true
  } catch (error: any) {
    console.error('检测失败:', error)
    ElNotification({
      title: '检测失败',
      message: error?.message || '检测过程中发生错误，请重试',
      type: 'error',
      duration: 5000,
    })
    isDetecting.value = false
    canReset.value = true
  }
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
        })
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

// ==================== WebSocket 实时数据接收 ====================
// 连接WebSocket
function connectWebSocket(deviceId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // 使用STOMP over SockJS
      const socket = new SockJS(`${window.location.origin}/ws`)
      stompClient = new Client({
        webSocketFactory: () => socket as any,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame: Frame) => {
          console.log('WebSocket连接成功:', frame)
          wsConnected.value = true

          // 订阅IMU数据
          stompClient?.subscribe(
            `/topic/device/${deviceId}/imu`,
            (message: any) => {
              try {
                const data = JSON.parse(message.body)
                handleRealtimeImuData(data)
              } catch (error) {
                console.error('解析IMU数据失败:', error)
              }
            }
          )

          // 订阅GAS数据
          stompClient?.subscribe(
            `/topic/device/${deviceId}/gas`,
            (message: any) => {
              try {
                const data = JSON.parse(message.body)
                handleRealtimeGasData(data)
              } catch (error) {
                console.error('解析GAS数据失败:', error)
              }
            }
          )

          // 订阅AUDIO数据
          stompClient?.subscribe(
            `/topic/device/${deviceId}/audio`,
            (message: any) => {
              try {
                const data = JSON.parse(message.body)
                handleRealtimeAudioData(data)
              } catch (error) {
                console.error('解析AUDIO数据失败:', error)
              }
            }
          )

          resolve()
        },
        onStompError: (frame: any) => {
          console.error('STOMP错误:', frame)
          wsConnected.value = false
          reject(new Error('WebSocket连接失败'))
        },
        onWebSocketError: (event: any) => {
          console.error('WebSocket错误:', event)
          wsConnected.value = false
          reject(new Error('WebSocket连接失败'))
        },
      })

      stompClient.activate()
    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      reject(error)
    }
  })
}

// 断开WebSocket
function disconnectWebSocket() {
  if (stompClient && wsConnected.value) {
    stompClient.deactivate()
    stompClient = null
    wsConnected.value = false
    console.log('WebSocket已断开')
  }
}

// 处理实时IMU数据
function handleRealtimeImuData(data: {
  timestamp: number
  x: number
  y: number
  z: number
}) {
  // 设置基准时间戳(第一个数据点的时间)
  if (realtimeBaseTimestamp === 0) {
    realtimeBaseTimestamp = data.timestamp
  }

  // 计算相对时间(秒) - 相对于开始接收数据的时间
  const relativeTimeSec = (data.timestamp - realtimeBaseTimestamp) / 1000

  // 添加到IMU序列中
  imuSeries.X.push([relativeTimeSec, data.x])
  imuSeries.Y.push([relativeTimeSec, data.y])
  imuSeries.Z.push([relativeTimeSec, data.z])

  // 限制数据点数量,防止内存溢出
  const maxPoints = 10000
  if (imuSeries.X.length > maxPoints) {
    imuSeries.X.shift()
    imuSeries.Y.shift()
    imuSeries.Z.shift()
  }
}

// 处理实时GAS数据
function handleRealtimeGasData(data: { timestamp: number; flow: number }) {
  // 设置基准时间戳(第一个数据点的时间)
  if (realtimeBaseTimestamp === 0) {
    realtimeBaseTimestamp = data.timestamp
  }

  // 计算相对时间(秒) - 相对于开始接收数据的时间
  const relativeTimeSec = (data.timestamp - realtimeBaseTimestamp) / 1000

  // 添加到GAS序列中
  gasSeries.value.push([relativeTimeSec, data.flow])

  // 限制数据点数量
  const maxPoints = 10000
  if (gasSeries.value.length > maxPoints) {
    gasSeries.value.shift()
  }
}

// 处理实时AUDIO数据(已降采样)
function handleRealtimeAudioData(data: {
  timestamp: number
  amplitude: number
}) {
  // 设置基准时间戳(第一个数据点的时间)
  if (realtimeBaseTimestamp === 0) {
    realtimeBaseTimestamp = data.timestamp
  }

  // 计算相对时间(秒) - 相对于开始接收数据的时间
  const relativeTimeSec = (data.timestamp - realtimeBaseTimestamp) / 1000

  // 添加到AUDIO序列中
  audioSeries.value.push([relativeTimeSec, data.amplitude])

  // 限制数据点数量
  const maxPoints = 10000
  if (audioSeries.value.length > maxPoints) {
    audioSeries.value.shift()
  }
}

onMounted(() => {
  if (!hasChartStarted.value) {
    initCharts()
    hasChartStarted.value = true
  }

  // 初始状态不加载设备，等用户点击下拉框时再发现设备
  loading.value = false

  // 页面卸载时断开WebSocket
  window.addEventListener('beforeunload', () => {
    disconnectWebSocket()
  })
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
const handleCsvSelect = async (file: UploadFile, signalType: 'imu' | 'gas') => {
  const raw = file.raw
  if (!raw) return
  const isCsv = raw.type === 'text/csv' || /\.csv$/i.test(raw.name)
  if (!isCsv) {
    ElNotification({
      title: '格式错误',
      message: '请上传 CSV 格式的文件',
      type: 'error',
    })
    clearUploadFileList(signalType)
    return
  }

  // 设置当前信号类型
  currentSignalType.value = signalType

  // 先验证列数，再上传到服务器
  const reader = new FileReader()
  reader.onload = async (e) => {
    const csvText = e.target?.result as string
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
    const headers = parsed.meta.fields || []

    // 验证列数
    if (!validateColumnCount(signalType, headers)) {
      // 验证失败，清除文件列表
      clearUploadFileList(signalType)
      return
    }

    // 验证通过，上传到服务器
    try {
      await uploadTempCsvToServer(raw)
    } catch {
      clearUploadFileList(signalType)
      return
    }

    // 保存原始文件（用于发送到检测接口）
    if (signalType === 'imu') {
      uploadedFiles.imu = raw
    } else if (signalType === 'gas') {
      uploadedFiles.gas = raw
    }

    rawCsvData.value = parsed.data as any[]
    csvHeaders.value = headers
    csvPreviewData.value = (parsed.data as any[]).slice(0, 5)

    // 根据信号类型设置默认映射
    setDefaultMapping(signalType)

    csvConfigDialogVisible.value = true
  }
  reader.readAsText(raw)
}

// 清除上传组件的文件列表
function clearUploadFileList(signalType: 'imu' | 'gas') {
  const uploadRef =
    signalType === 'imu' ? imuUploadRef.value : gasUploadRef.value

  if (uploadRef) {
    uploadRef.clearFiles()
  }
}

// 处理音频文件上传
const handleAudioSelect = async (file: UploadFile) => {
  const raw = file.raw
  if (!raw) return

  // 验证文件格式
  const isWav =
    raw.type === 'audio/wav' ||
    raw.type === 'audio/x-wav' ||
    /\.wav$/i.test(raw.name)
  if (!isWav) {
    ElNotification({
      title: '格式错误',
      message: '请上传 WAV 格式的音频文件',
      type: 'error',
    })
    if (audioUploadRef.value) {
      audioUploadRef.value.clearFiles()
    }
    return
  }

  try {
    // 读取音频文件并解码
    const arrayBuffer = await raw.arrayBuffer()
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // 获取音频数据（使用第一个声道）
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate
    const duration = audioBuffer.duration

    // 转换为图表数据格式 [时间, 幅值]
    // 为了性能，进行降采样（每秒保留50个点）
    const downsampleRate = Math.max(1, Math.floor(sampleRate / 50))
    const audioData: [number, number][] = []

    for (let i = 0; i < channelData.length; i += downsampleRate) {
      const time = i / sampleRate
      audioData.push([+time.toFixed(3), channelData[i]])
    }

    // 更新音频序列数据
    audioSeries.value = audioData

    // 保存原始文件（用于发送到检测接口）
    uploadedFiles.audio = raw

    // 渲染音频图表
    renderFileModeCharts()

    ElMessage.success(
      `音频文件加载成功（时长: ${duration.toFixed(
        2
      )}秒，采样率: ${sampleRate}Hz）`
    )

    // 检查是否所有信号都已就绪
    checkAllSignalsReady()
  } catch (error: any) {
    console.error('音频文件解析失败:', error)
    ElNotification({
      title: '音频解析失败',
      message: error?.message || '无法解析音频文件，请确保文件格式正确',
      type: 'error',
    })
    if (audioUploadRef.value) {
      audioUploadRef.value.clearFiles()
    }
  }
}

// 检查所有信号是否都已就绪
function checkAllSignalsReady() {
  const hasImu =
    imuSeries.X.length > 0 || imuSeries.Y.length > 0 || imuSeries.Z.length > 0
  const hasGas = gasSeries.value.length > 0
  const hasAudio = audioSeries.value.length > 0

  if (hasImu && hasGas && hasAudio) {
    filePayloadReady.value = true
    ElMessage.success('所有信号已配置完成，可以开始检测')
  }
}

const submitCsvConfig = async () => {
  if (!csvConfigFormRef.value) return
  const valid = await csvConfigFormRef.value.validate()
  if (!valid) return

  const { sampleRate, imuAxisMap, gasCol, audioCol } = csvConfigForm.value
  const timeStep = 1 / sampleRate

  // 根据当前信号类型处理数据
  if (currentSignalType.value === 'imu') {
    // 处理IMU三轴数据（进行降采样以提高性能）
    const totalPoints = rawCsvData.value.length
    const duration = totalPoints / sampleRate
    const downsampleRate = Math.max(1, Math.floor(sampleRate / 50)) // 每秒保留50个点

    console.log('IMU数据信息:', {
      totalPoints,
      sampleRate,
      duration: duration.toFixed(2) + 's',
      downsampleRate,
      expectedPoints: Math.floor(totalPoints / downsampleRate),
    })

    Object.entries(imuAxisMap).forEach(([axis, col]) => {
      if (!col) return
      const axisKey = axis as 'X' | 'Y' | 'Z'

      // 降采样处理
      const seriesData: [number, number][] = []
      for (let i = 0; i < rawCsvData.value.length; i += downsampleRate) {
        seriesData.push([+(i * timeStep).toFixed(3), +rawCsvData.value[i][col]])
      }

      console.log(
        `${axis}轴数据点数:`,
        seriesData.length,
        '最后时间:',
        seriesData[seriesData.length - 1]?.[0]
      )

      imuSeries[axisKey] = seriesData
      imuAxisUsed.value[axisKey] = true
    })

    // 归属tempId到IMU
    if (currentTempId.value) {
      const cid = currentTempId.value
      if (imuAxisMap.X) owner.imu.X = cid
      if (imuAxisMap.Y) owner.imu.Y = cid
      if (imuAxisMap.Z) owner.imu.Z = cid
    }
  } else if (currentSignalType.value === 'gas') {
    // 处理鼻气流数据（GAS采样率通常较低，不需要降采样）
    gasSeries.value = gasCol
      ? rawCsvData.value.map((row, idx) => [
          +(idx * timeStep).toFixed(3),
          +row[gasCol],
        ])
      : []

    // 归属tempId到GAS
    if (currentTempId.value && gasCol) {
      owner.gas = currentTempId.value
    }
  }

  // 全量渲染（文件模式）
  renderFileModeCharts()

  // 通知服务器保存映射
  await submitCsvMappingToServer()

  // 检查是否所有需要的信号都已上传
  checkAllSignalsReady()

  // 如果还有信号未上传，提示用户
  if (!filePayloadReady.value) {
    ElMessage.info(`${getConfigDialogTitle()}配置完成，请继续上传其他信号`)
  }

  csvConfigDialogVisible.value = false
  csvConfigFormRef.value?.clearValidate()
}

const renderFileModeCharts = () => {
  const maxTime = Math.max(
    imuSeries.X.length ? imuSeries.X.at(-1)![0] : 0,
    gasSeries.value.length ? gasSeries.value.at(-1)![0] : 0,
    audioSeries.value.length ? audioSeries.value.at(-1)![0] : 0,
    1
  )

  // IMU
  {
    const base = createImuXYZOptionFile(imuSeries.X, imuSeries.Y, imuSeries.Z)
    imuChart.setOption(
      { ...base, grid: base.grid, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true }
    )
    bindInsideZoomReset(imuChart, maxTime)
  }
  // GAS
  {
    const base = createSingleOptionFile('呼吸信号', gasSeries.value)
    gasChart.setOption(
      { ...base, grid: base.grid, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true }
    )
    bindInsideZoomReset(gasChart, maxTime)
  }
  // AUDIO
  {
    const base = createSingleOptionFile('吞咽声音信号', audioSeries.value)
    audioChart.setOption(
      { ...base, grid: base.grid, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true }
    )
    bindInsideZoomReset(audioChart, maxTime)
  }
}

// 在IMU/GAS/Audio图表上渲染误吸遮罩
function renderAspirationMasks() {
  if (aspirationSegments.length === 0) {
    console.log('没有误吸段，跳过遮罩渲染')
    return
  }

  // 检查图表是否已初始化
  if (!imuChart || !gasChart || !audioChart) {
    console.warn('图表未初始化，无法渲染误吸遮罩')
    return
  }

  console.log('开始渲染误吸遮罩，误吸段:', aspirationSegments)

  try {
    // 生成误吸段遮罩数据（红色半透明）
    const markAreas = aspirationSegments.map(([start, end]) => [
      { xAxis: start, itemStyle: { color: 'rgba(255, 77, 79, 0.15)' } },
      { xAxis: end },
    ])

    console.log('生成的markAreas:', markAreas)

    // 更新IMU图表 - 只为第一个系列添加遮罩（避免叠加）
    imuChart.setOption(
      {
        series: [
          {
            markArea: { silent: true, data: markAreas, label: { show: false } },
          },
          {},
          {},
        ],
      },
      { notMerge: false }
    )

    // 更新GAS图表
    gasChart.setOption(
      {
        series: [
          {
            markArea: {
              silent: true,
              data: markAreas,
              label: { show: false },
            },
          },
        ],
      },
      { notMerge: false }
    )

    // 更新Audio图表
    audioChart.setOption(
      {
        series: [
          {
            markArea: {
              silent: true,
              data: markAreas,
              label: { show: false },
            },
          },
        ],
      },
      { notMerge: false }
    )

    console.log(
      `✅ 已在IMU/GAS/Audio图表上添加${aspirationSegments.length}个误吸遮罩`
    )
  } catch (error) {
    console.error('❌ 渲染误吸遮罩失败:', error)
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
      { confirmButtonText: '继续', cancelButtonText: '取消', type: 'warning' }
    )
    // 用户点击"继续"，执行重置
    await resetAllState()
    if (!newVal && hasChartStarted.value) initCharts() // 切回实时模式才初始化实时资源
  } catch (error) {
    // 检查是否是用户取消
    if (error === 'cancel' || error === 'close') {
      // 用户点击"取消"，恢复原来的模式
      modeGuard.value = true
      await nextTick()
      isFileMode.value = oldVal
      await nextTick()
      modeGuard.value = false
    } else {
      // 其他错误，显示错误信息但不恢复模式
      console.error('模式切换过程中发生错误:', error)
      ElMessage.error('模式切换失败: ' + (error as any)?.message || error)
    }
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
  flex-direction: column;
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

.loading-container {
  display: flex;
  flex-direction: column; /* ✅ 改为纵向排列 */
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: #666;
}

.loading-icon {
  animation: rotate 1s linear infinite;
  color: #409eff;
  font-size: 25px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  color: #999;
  font-size: 14px;
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
