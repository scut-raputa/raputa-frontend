<template>
  <div class="report-container" ref="reportContent">
    <!-- Header -->
    <div class="header-center">
      <img src="@/assets/hospital-logo.svg" class="report-logo" />
      <div class="header-texts">
        <div class="report-title">xx医院</div>
        <div class="report-subtitle">吞咽障碍检测报告</div>
      </div>
    </div>

    <div class="report-id">检测编号：{{ report.reportId }}</div>
    <hr class="divider" />

    <!-- Main Content -->
    <div class="report-body">
      <div class="report-section base-section">
        <div class="base-info-grid">
          <div>姓名：{{ report.name }}</div>
          <div>性别：{{ report.gender }}</div>
          <div>年龄：{{ report.age }} 岁</div>
          <div>门诊号：{{ report.outpatientId }}</div>
          <div>申请科室：{{ report.department }}</div>
          <div>检测时间：{{ report.date }}</div>
        </div>
      </div>

      <hr class="divider" />

      <div class="report-section">
        <h4>总览信息</h4>
        <p>
          <strong>诊断结果：{{ report.diagnosis }}</strong>
        </p>
        <p>
          本次检测共记录 {{ report.totalSwallows }} 次吞咽事件，其中困难吞咽（吞咽障碍）次数：{{ report.dysphagiaSwallows }} 次，误吸次数：{{ report.aspirationSwallows }} 次，正常吞咽次数：{{ report.normalSwallows }} 次。
        </p>
      </div>

      <div class="report-section">
        <h4>风险等级评估</h4>
        <p>
          基于检测到的异常吞咽次数，本次报告的风险等级为：
          <strong>{{ report.riskLevel }}</strong
          >。
        </p>
        <ul>
          <li>低风险：异常次数 ≤ 1 次</li>
          <li>中风险：2 ~ 3 次异常</li>
          <li>高风险：≥ 4 次异常</li>
        </ul>
      </div>
    </div>

    <!-- 建议措施独立拉伸到底 -->
    <div class="report-section suggestion-section">
      <h4>建议措施</h4>
      <textarea
        v-if="editingMode"
        v-model="suggestionText"
        class="suggestion-text editable"
      ></textarea>
      <pre v-else class="suggestion-plain">{{ suggestionText }}</pre>
    </div>

    <!-- Footer -->
    <div class="spacer" />
    <div class="report-footer">
      <div>报告医生：{{ report.doctor }}</div>
      <div class="report-time">报告时间：{{ report.time }}</div>
    </div>
    <hr class="divider" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface ReportData {
  name: string
  gender: string
  age: number
  outpatientId: string
  department: string
  date: string
  reportId: string
  totalSwallows: number
  normalSwallows: number
  abnormalSwallows: number
  dysphagiaSwallows: number
  aspirationSwallows: number
  diagnosis: string
  riskLevel: string
  suggestions: string[]
  doctor: string
  time: string
}

const { report, editingMode = true } = defineProps<{
  report: ReportData
  editingMode?: boolean
}>()

const reportContent = ref<HTMLDivElement | null>(null)
const suggestionText = ref(report.suggestions.join('\n'))

defineExpose({ reportContent, suggestionText })
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
}

.report-section.base-section {
  margin-top: 0;
}

.report-section h4 {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 15px;
}

.base-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  font-size: 14px;
  line-height: 1.5;
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
</style>
