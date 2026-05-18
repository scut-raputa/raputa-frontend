<template>
  <div class="report-container" ref="reportContent">
    <div class="header-center">
      <img src="@/assets/hospital-logo.svg" class="report-logo" />
      <div class="header-texts">
        <div class="report-title">{{ hospitalName }}</div>
        <div class="report-subtitle">{{ reportTitle }}</div>
      </div>
    </div>

    <div class="report-id">{{ reportNumberLabel }}：{{ report.reportId }}</div>
    <hr class="divider" />

    <div class="report-body">
      <div class="report-section base-section">
        <div class="base-info-grid">
          <div class="info-item info-compact">
            <span class="info-label">姓名：</span>
            <span class="info-value">{{ report.name || '-' }}</span>
          </div>
          <div class="info-item info-compact">
            <span class="info-label">性别：</span>
            <span class="info-value">{{ report.gender || '-' }}</span>
          </div>
          <div class="info-item info-compact">
            <span class="info-label">年龄：</span>
            <span class="info-value">{{ ageLabel }}</span>
          </div>
          <div class="info-item info-medium">
            <span class="info-label">预约编号：</span>
            <span class="info-value">{{ report.outpatientId || '-' }}</span>
          </div>
          <div class="info-item info-medium">
            <span class="info-label">预约日期：</span>
            <span class="info-value">{{ report.appointmentTime || '-' }}</span>
          </div>
          <div class="info-item info-medium">
            <span class="info-label">预约科室：</span>
            <span class="info-value">{{ report.appointmentDept || '-' }}</span>
          </div>
          <div class="info-item info-medium">
            <span class="info-label">检查科室：</span>
            <span class="info-value">{{ report.checkDept || '-' }}</span>
          </div>
          <div class="info-item info-full">
            <span class="info-label">检测时间：</span>
            <span class="info-value">{{ report.date || '-' }}</span>
          </div>
        </div>
      </div>

      <hr class="divider" />

      <div class="report-section">
        <h4>{{ overviewTitle }}</h4>
        <p>
          <strong>{{ conclusionLabel }}：{{ report.diagnosis }}</strong>
        </p>
        <p>
          {{ overviewSentence }}
        </p>
      </div>

      <div class="report-section">
        <h4>{{ detailTitle }}</h4>
        <p>{{ findingSentence }}</p>
        <table v-if="activeEvents.length" class="event-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>起始时间点</th>
              <th>终止时间点</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(event, index) in activeEvents"
              :key="`${event.start}-${event.end}-${index}`"
            >
              <td>{{ index + 1 }}</td>
              <td>{{ formatSeconds(event.start) }}</td>
              <td>{{ formatSeconds(event.end) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else>{{ emptyEventText }}</p>
      </div>

      <div class="report-section notice-section">
        <h4>{{ noteTitle }}</h4>
        <p>
          {{ noteText }}
        </p>
      </div>
    </div>

    <div class="report-section suggestion-section">
      <h4>建议措施</h4>
      <textarea
        v-if="editingMode"
        v-model="suggestionText"
        class="suggestion-text editable"
      ></textarea>
      <pre v-else class="suggestion-plain">{{ suggestionText }}</pre>
    </div>

    <div class="spacer" />
    <div class="report-footer">
      <div class="doctor-field">
        <span>{{ doctorLabel }}：</span>
        <template v-if="editingMode">
          <input
            v-model="doctorText"
            class="doctor-input editable"
            :placeholder="`请填写${doctorLabel}`"
          />
        </template>
        <span v-else class="doctor-plain">{{ doctorText }}</span>
      </div>
      <div class="report-time">报告时间：{{ report.time }}</div>
    </div>
    <hr class="divider" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getUser } from '@/utils/auth'

export interface ScreeningReportData {
  taskType?: 'dys' | 'asp'
  name: string
  gender: string
  age: number
  outpatientId: string
  appointmentDept?: string
  checkDept?: string
  appointmentTime?: string
  date: string
  reportId: string
  totalSwallows: number
  normalSwallows: number
  abnormalSwallows: number
  dysphagiaSwallows: number
  aspirationSwallows: number
  dysphagiaEvents?: Array<{ start: number; end: number }>
  aspirationEvents?: Array<{ start: number; end: number }>
  diagnosis: string
  riskLevel: string
  suggestions: string[]
  doctor: string
  time: string
}

const user = getUser()
const hospitalName = user?.hospitalName || 'xx医院'

const { report, editingMode = true } = defineProps<{
  report: ScreeningReportData
  editingMode?: boolean
}>()

const reportContent = ref<HTMLDivElement | null>(null)
const suggestionText = ref(report.suggestions.join('\n'))
const doctorText = ref(report.doctor || '')

const ageLabel = computed(() => (
  Number.isFinite(report.age) && report.age > 0 ? `${report.age} 岁` : '-'
))

const isAspirationReport = computed(() => report.taskType === 'asp')
const reportTitle = computed(() =>
  isAspirationReport.value ? '误吸检测报告' : '吞咽障碍筛查报告'
)
const reportNumberLabel = computed(() =>
  isAspirationReport.value ? '检测编号' : '筛查编号'
)
const overviewTitle = computed(() =>
  isAspirationReport.value ? '检测总览' : '筛查总览'
)
const conclusionLabel = computed(() =>
  isAspirationReport.value ? '检测结论' : '筛查结论'
)
const doctorLabel = computed(() =>
  isAspirationReport.value ? '报告医生' : '筛查医生'
)
const activeCount = computed(() =>
  isAspirationReport.value
    ? report.aspirationSwallows
    : report.dysphagiaSwallows
)
const activeEvents = computed(() =>
  isAspirationReport.value
    ? report.aspirationEvents ?? []
    : report.dysphagiaEvents ?? []
)
const overviewSentence = computed(() => {
  if (isAspirationReport.value) {
    return `本次检测共记录 ${report.totalSwallows} 次吞咽事件，其中提示误吸 ${activeCount.value} 次。`
  }
  return `本次筛查共记录 ${report.totalSwallows} 次吞咽事件，其中提示吞咽障碍 ${activeCount.value} 次。`
})
const detailTitle = computed(() =>
  isAspirationReport.value ? '误吸事件明细' : '吞咽障碍事件明细'
)
const findingSentence = computed(() =>
  isAspirationReport.value
    ? `是否存在误吸：${activeCount.value > 0 ? '是' : '否'}。`
    : `是否存在吞咽障碍：${activeCount.value > 0 ? '是' : '否'}。`
)
const emptyEventText = computed(() =>
  isAspirationReport.value
    ? '本次检测未记录到误吸事件。'
    : '本次筛查未记录到吞咽障碍事件。'
)
const noteTitle = computed(() =>
  isAspirationReport.value ? '检测说明' : '筛查说明'
)
const noteText = computed(() =>
  isAspirationReport.value
    ? '本报告仅反映本次检测过程中模型提示的误吸相关事件，需结合临床表现、医嘱和必要的进一步检查综合判断。'
    : '本报告为吞咽功能筛查结果，不替代正式临床诊断；如筛查提示异常，建议结合临床评估或专科会诊进一步确认。'
)

function formatSeconds(value: number) {
  return `${Number(value || 0).toFixed(2)} s`
}

watch(
  () => report.doctor,
  (val) => {
    if (val != null && val !== doctorText.value) {
      doctorText.value = val
    }
  }
)

watch(
  () => report.suggestions,
  (val) => {
    const next = val.join('\n')
    if (next !== suggestionText.value) {
      suggestionText.value = next
    }
  },
  { deep: true }
)

defineExpose({
  reportContent,
  suggestionText,
  doctorText,
})
</script>

<style scoped>
.report-container {
  width: 794px;
  height: 1123px;
  padding: 24px 40px;
  background-color: #fff;
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 13px;
  color: #000;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.report-body {
  display: flex;
  flex-direction: column;
}

.divider {
  border-top: 2px solid #000;
  margin: 0;
}

.header-center {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.report-logo {
  height: 48px;
}

.header-texts {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.report-title {
  font-size: 25px;
  font-weight: bold;
}

.report-subtitle {
  font-size: 20px;
}

.report-id {
  text-align: right;
  font-size: 12px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.report-section.base-section {
  margin-top: 0;
}

.report-section h4 {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 15px;
}

.event-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 12px;
}

.event-table th,
.event-table td {
  border: 1px solid #000;
  padding: 6px 8px;
  text-align: center;
}

.event-table th {
  font-weight: 700;
}

.base-info-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 4px;
  font-size: 14px;
  line-height: 1.45;
  align-items: start;
}

.info-item {
  display: flex;
  align-items: baseline;
  gap: 2px;
  min-width: 0;
}

.info-compact {
  grid-column: span 4;
}

.info-medium {
  grid-column: span 6;
}

.info-full {
  grid-column: 1 / -1;
}

.info-label {
  flex: 0 0 auto;
  font-weight: 700;
  white-space: nowrap;
}

.info-value {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.notice-section p {
  margin-bottom: 0;
}

.suggestion-section {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  margin-bottom: 0;
  min-height: 0;
}

.suggestion-text,
.suggestion-plain {
  flex: 1;
  width: 100%;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  resize: none;
  outline: none;
  padding: 8px;
  box-sizing: border-box;
  margin: 0;
}

.suggestion-plain {
  border: none;
  background: none;
  padding: 0;
}

.suggestion-text.editable {
  border: 2px dashed #999;
  background-color: #fafafa;
}

.spacer {
  flex-shrink: 0;
  height: 0;
}

.report-footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-top: 8px;
}

.report-time {
  text-align: right;
}

.doctor-field {
  display: flex;
  align-items: center;
  gap: 4px;
}

.doctor-input {
  border: 2px dashed #999;
  background-color: #fafafa;
  padding: 2px 6px;
  min-width: 120px;
  font-family: inherit;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.doctor-plain {
  min-width: 120px;
  display: inline-block;
}
</style>
