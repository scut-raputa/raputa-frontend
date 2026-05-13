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
              :content="startTooltipContent"
              placement="top"
              :disabled="startTooltipDisabled"
            >
              <span class="start-button-wrapper" @click="handleStartButtonClick">
                <el-button
                  type="primary"
                  size="small"
                  :disabled="!canStart"
                  :loading="isCheckingInferenceBeforeStart"
                  @click.stop="startDetection"
                >
                  <el-icon v-if="!isCheckingInferenceBeforeStart" style="margin-right: 4px"><VideoPlay /></el-icon>
                  {{ isInitial ? '开始检测' : '继续检测' }}
                </el-button>
              </span>
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
        <!-- 检测任务选择 -->
        <el-select
          v-model="selectedTask"
          placeholder="请选择检测任务"
          size="small"
          class="setting-item task-select"
          @change="onTaskManualChange"
        >
          <template #prefix>
            <el-icon><Operation /></el-icon>
          </template>
          <el-option label="吞咽障碍筛查" value="dys" />
          <el-option label="误吸" value="asp" />
        </el-select>

        <el-select-v2
          v-model="selectedPatientId"
          class="setting-item subject-select"
          :options="patientOptions"
          :remote="true"
          :loading="patientLoading"
          :remote-method="remotePatientQuery"
          size="small"
          filterable
          clearable
          placeholder="请选择患者或预约者"
          :item-height="64"
          :height="320"
          popper-class="subject-select-popper"
          @visible-change="onPatientSelectVisible"
          @clear="() => { patientOptions = []; fetchPatients('') }"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
          <template #default="{ item }">
            <div class="subject-option">
              <div class="subject-main">
                <span class="subject-name">{{ item.name }}</span>
                <el-tag size="small" :type="item.type === 'PATIENT' ? 'success' : 'warning'" effect="plain">
                  {{ item.type === 'PATIENT' ? '患者' : '预约' }}
                </el-tag>
              </div>
              <div class="subject-sub" :title="`${item.id}${item.dept ? ' / ' + item.dept : ''}`">
                <span>编号：{{ item.id }}</span>
                <span v-if="item.dept">{{ item.type === 'APPOINTMENT' ? '预约科室' : '科室' }}：{{ item.dept }}</span>
              </div>
            </div>
          </template>
        </el-select-v2>

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
          :disabled="isFileMode || isDeviceSelectionFrozen"
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
                  <el-tag
                    v-if="item.occupied"
                    size="small"
                    type="danger"
                    effect="plain"
                  >
                    已占用
                  </el-tag>
                </div>
                <span
                  class="device-desc"
                  :class="{ 'desc-offline': item.status === 'offline' }"
                >
                  <div>MAC: {{ item.mac }}</div>
                  <div v-if="item.occupied">
                    占用对象: {{ item.occupiedPatientName || item.occupiedPatientId || '-' }}
                  </div>
                  <strong>
                    {{ item.desc }}
                  </strong>
                </span>
              </div>

              <el-button
                size="small"
                :type="item.status === 'online' ? 'danger' : 'success'"
                :disabled="isDeviceSelectionFrozen || item.occupied"
                @click.stop="toggleDeviceConnection(item)"
              >
                {{ item.status === 'online' ? '断连' : '连接' }}
              </el-button>
            </div>
          </template>
        </el-select-v2>
      </div>

      <el-alert
        v-if="hasPendingScreeningRecord"
        type="warning"
        show-icon
        :closable="false"
        class="screening-followup"
      >
        <template #title>
          <div class="screening-followup-content">
            <span>
              {{ pendingScreeningActionText }}
            </span>
            <el-button link type="primary" @click="handlePendingScreeningAction">
              {{ screeningReportDownloaded ? '建档归档' : '填写并下载报告' }}
            </el-button>
          </div>
        </template>
      </el-alert>
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
              :on-change="handleImuCsvChange"
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
              :on-change="handleGasCsvChange"
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
            content="清空喉运动信号（需重新上传后才能检测；已配置的临时文件会同步清理）"
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
            content="清空呼吸信号（需重新上传后才能检测；已配置的临时文件会同步清理）"
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
            content="清空声音信号（需重新上传后才能检测）"
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
      <component
        :is="isAppointmentSubject ? ScreeningReport : MedicalReport"
        ref="reportRef"
        :report="reportData"
      />
    </div>

    <template #footer>
      <el-button @click="reportDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="downloadReport">下载报告</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="archiveDialogVisible"
    title="预约者建档归档"
    width="720px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <el-alert
      title="当前对象来自预约筛查。建档成功后，系统会把本次筛查结果归入患者检测记录，并把本次会话文件登记到该患者档案。"
      type="warning"
      show-icon
      :closable="false"
      class="archive-alert"
    />
    <el-form
      ref="archiveFormRef"
      :model="archiveForm"
      :rules="archiveRules"
      label-width="104px"
      class="archive-form"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="archiveForm.name" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别" prop="gender" required>
            <el-select v-model="archiveForm.gender" placeholder="请选择性别" disabled style="width: 100%">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="身份证号码" prop="idCard" required>
            <el-input v-model="archiveForm.idCard" maxlength="18" placeholder="请输入身份证号码" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所在科室" prop="dept">
            <el-input v-model="archiveForm.dept" placeholder="请输入建档后的所在科室" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发病日期" prop="onsetDate">
            <el-date-picker
              v-model="archiveForm.onsetDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择发病日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="病床号" prop="bedNumber">
            <el-input v-model="archiveForm.bedNumber" placeholder="请输入病床号" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="既往史" prop="pastHistory">
            <el-input
              v-model="archiveForm.pastHistory"
              type="textarea"
              :rows="3"
              placeholder="请输入既往史"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="病程" prop="course">
            <el-input
              v-model="archiveForm.course"
              type="textarea"
              :rows="3"
              placeholder="请输入病程"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button type="primary" :loading="archiveSubmitting" @click="submitScreeningArchive">
        建档并归档
      </el-button>
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
          min-width="120"
          show-overflow-tooltip
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
      <!-- <el-form-item v-if="currentSignalType === 'audio'" label="声音信号映射">
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
      </el-form-item> -->
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
import { ref, reactive, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  User,
  DataLine,
  Operation,
  VideoPlay,
  VideoPause,
  Refresh,
  Tools,
  Delete,
  Loading,
  Histogram,
  Headset,
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import Papa from 'papaparse'
import { Download } from '@element-plus/icons-vue'
import type { CheckboxValueType, UploadFile, FormInstance, FormRules } from 'element-plus'
import { ElNotification, ElDialog, ElMessageBox, ElMessage } from 'element-plus'
import html2pdf from 'html2pdf.js'
import MedicalReport from '@/components/MedicalReport.vue'
import ScreeningReport from '@/components/ScreeningReport.vue'
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
import { getUser } from '@/utils/auth'
import type { UserVO } from '@/types/user'

import { createPatient, listPatients, getPatientById, type CreatePatientPayload } from '@/api/patient'
import { listAppointments } from '@/api/appointment'
import type { AppointmentRow } from '@/types/appointment'
import { listDevices } from '@/api/department'
import type { DeviceRow } from '@/types/department'
import { getRuntimeSummary } from '@/api/model'
import type { RuntimeSummary } from '@/types/model'
import {
  archiveScreeningRecord,
  createScreeningRecord,
  type ScreeningRecordRow,
} from '@/api/screening'

import { uploadReportPdf } from '@/api/report'
import {
  finalizeRealtimeSession,
  type RealtimeConnectResult,
} from '@/api/realtime'

import axios from 'axios'

type SubjectType = 'PATIENT' | 'APPOINTMENT'
type PatientOption = {
  value: string
  label: string
  id: string
  name: string
  dept?: string
  gender?: '男' | '女' | null
  idCard?: string | null
  age?: number | null
  phone?: string | null
  type: SubjectType
  time?: string
}

const SUBJECT_PATIENT_PREFIX = 'patient:'
const SUBJECT_APPOINTMENT_PREFIX = 'appointment:'

function patientSubjectValue(id: string) {
  return `${SUBJECT_PATIENT_PREFIX}${id}`
}

function appointmentSubjectValue(id: string) {
  return `${SUBJECT_APPOINTMENT_PREFIX}${id}`
}

const patientLoading = ref(false)
const patientOptions = ref<PatientOption[]>([])
const selectedPatientId = ref<string>('')

const selectedSubject = computed(() => {
  return patientOptions.value.find(o => o.value === selectedPatientId.value) ?? null
})

const isPatientSubject = computed(() => selectedSubject.value?.type === 'PATIENT')
const isAppointmentSubject = computed(() => selectedSubject.value?.type === 'APPOINTMENT')

const selectedPatientRecordId = computed(() =>
  isPatientSubject.value ? selectedSubject.value?.id ?? '' : ''
)

const selectedRuntimeSubjectId = computed(() => selectedSubject.value?.id ?? '')

const selectedPatientName = computed(() => {
  return selectedSubject.value?.name ?? ''
})

// 当前登录用户（由路由守卫从服务端会话写入内存态）
const currentUser = ref<UserVO | null>(getUser())

// 当前登录账号所在科室 / 医院
const currentDepartmentName = computed(
  () => currentUser.value?.departmentName ?? ''
)
// const currentHospitalName = computed(
//   () => currentUser.value?.hospitalName ?? ''
// )

const isDownloadingReport = ref(false)

let activeMonitorNotice: ReturnType<typeof ElNotification> | null = null

function defaultNoticeDuration(type: 'success' | 'warning' | 'info' | 'error') {
  if (type === 'error') return 9000
  if (type === 'warning') return 7000
  if (type === 'success') return 3500
  return 4500
}

function showMonitorNotice(options: {
  title: string
  message: string
  type?: 'success' | 'warning' | 'info' | 'error'
  duration?: number
}) {
  const type = options.type ?? 'info'
  const previous = activeMonitorNotice
  activeMonitorNotice = null
  previous?.close()
  const notice = ElNotification({
    title: options.title,
    message: options.message,
    type,
    duration: options.duration ?? defaultNoticeDuration(type),
    showClose: true,
    position: 'top-right',
    customClass: `monitor-notice monitor-notice-${type}`,
    onClose: () => {
      if (activeMonitorNotice === notice) {
        activeMonitorNotice = null
      }
    },
  })
  activeMonitorNotice = notice
}

function showDetectionNotice(options: {
  title: string
  message: string
  type?: 'success' | 'warning' | 'info' | 'error'
  duration?: number
}) {
  showMonitorNotice(options)
}

function detectionNoticeSummary(
  totalEvents: number,
  label: string,
  count: number,
  timeList = '',
) {
  const summary = `吞咽事件 ${totalEvents} 段，${label} ${count} 段`
  if (!timeList) return summary

  const ranges = timeList.split('、').filter(Boolean)
  const visibleRanges = ranges.slice(0, 3).join('、')
  const suffix = ranges.length > 3 ? ` 等 ${ranges.length} 段` : ''
  return `${summary}\n时间段：${visibleRanges}${suffix}`
}

interface PatientDetail {
  id: string
  name: string
  gender?: string
  age?: number
  outpatientId?: string
  dept?: string
}

// 当前选中患者详情（还没接后端的话，就先留 null）
const currentPatient = ref<PatientDetail | null>(null)

async function fetchPatientDetailById(id: string) {
  if (!id) {
    currentPatient.value = null
    return
  }
  try {
    const p = await getPatientById(id)
    if (p) {
      currentPatient.value = {
        id: p.id,
        name: p.name,
        gender: (p as any).gender,                  // 后端若返回 '男'/'女'
        age: p.age ?? undefined,
        // outpatientId 现在可能还没加到 PatientRow，先尝试从返回体里取一下
        outpatientId: (p as any).outpatientId ?? undefined,
        dept: p.dept ?? undefined,
      }
    } else {
      // 没查到就用下拉里的名字兜底
      currentPatient.value = {
        id,
        name: selectedPatientName.value || '',
      }
    }
  } catch (e) {
    console.error('获取患者详情失败:', e)
    currentPatient.value = {
      id,
      name: selectedPatientName.value || '',
    }
  }
}

// 合并并按 id 去重
function mergeById(a: any[], b: any[]) {
  const map = new Map<string, any>()
  ;[...a, ...b].forEach(p => map.set(p.id, p))
  return Array.from(map.values())
}

function toPatientOption(p: any): PatientOption {
  return {
    value: patientSubjectValue(p.id),
    label: `患者 | ${p.id} - ${p.name}`,
    id: p.id,
    name: p.name,
    dept: p.dept ?? '',
    type: 'PATIENT',
  }
}

function toAppointmentOption(a: AppointmentRow): PatientOption {
  return {
    value: appointmentSubjectValue(a.id),
    label: `预约 | ${a.id} - ${a.name}`,
    id: a.id,
    name: a.name,
    dept: a.dept,
    gender: a.gender ?? null,
    idCard: a.idCard ?? null,
    age: a.age ?? null,
    phone: a.phone ?? null,
    time: a.time,
    type: 'APPOINTMENT',
  }
}

const checkRecordsSaved = ref(false)

// === 将本次检测结果写入后台 ===
// 规则：dys>0 写 DYSPHAGIA；asp>0 写 ASPIRATION；二者均为0时写 NORMAL（仅一条）
// 注意：后端不需要次数，只有一条纪录/类别；staff 来自报告里的“报告医生”
async function persistCheckRecords(): Promise<boolean> {
  if (!isPatientSubject.value) {
    ElMessage.warning('预约筛查对象需先保存为筛查记录，建档后再归入患者检测记录')
    return false
  }

  const patientId = selectedPatientRecordId.value
  const patientName = selectedPatientName.value
  const staff = reportData.value.doctor?.trim() || ''   // ★ 从报告医生读取

  if (!patientId || !patientName) {
    ElMessage.error('缺少患者信息，无法写入检测记录')
    return false
  }
  if (!staff) {
    ElMessage.error('缺少报告医生(staff)，请先完善报告信息')
    return false
  }

  const records: Array<{
    patientId: string
    name: string
    staff: string
    result: 'DYSPHAGIA' | 'ASPIRATION' | 'NORMAL'
    // checkTime?: string  // 可不传，服务端用上海时区当前时间
  }> = []

  const result = currentScreeningResult()
  if (result === 'DYSPHAGIA') {
    records.push({ patientId, name: patientName, staff, result: 'DYSPHAGIA' })
  } else if (result === 'ASPIRATION') {
    records.push({ patientId, name: patientName, staff, result: 'ASPIRATION' })
  } else {
    records.push({ patientId, name: patientName, staff, result: 'NORMAL' })
  }
  if (records.length === 0) return true

  try {
    await axios.post('/api/check/batch', records)
    checkRecordsSaved.value = true
    ElMessage.success('检测记录已保存')
    return true
  } catch (err: any) {
    // 后端若没开 batch，也可降级单条提交
    try {
      for (const r of records) await axios.post('/api/check', r)
      checkRecordsSaved.value = true
      ElMessage.success('检测记录已保存')
      return true
    } catch (e: any) {
      showMonitorNotice({
        title: '记录保存失败',
        message: e?.message || '请稍后重试',
        type: 'error',
      })
      return false
    }
  }
}

// —— 稳妥版：分别按 id 和 name 搜，合并结果 ——
// keyword 为空时只拉最近一页（按 admit desc, id desc）
async function fetchPatients(keyword = '') {
  patientLoading.value = true
  try {
    const base = { page: 1, size: 100 }
    const apptBase = { page: 1, size: 100 }

    // 空关键字：拉最近患者 + 今日预约，供系统监测选择筛查对象
    if (!keyword.trim()) {
      const [patientPage, appointmentPage] = await Promise.all([
        listPatients(base),
        listAppointments(apptBase),
      ])
      const patientItems = patientPage.items ?? []
      const appointmentItems = appointmentPage.items ?? []
      patientOptions.value = [
        ...patientItems.map(toPatientOption),
        ...appointmentItems.map(toAppointmentOption),
      ]
      return
    }

    // 非空：患者按 id/name 搜，预约按 id/name 搜
    const kw = keyword.trim()
    const [byIdPage, byNamePage, apptByIdPage, apptByNamePage] = await Promise.all([
      listPatients({ ...base, id: kw }),
      listPatients({ ...base, name: kw }),
      listAppointments({ ...apptBase, id: kw }),
      listAppointments({ ...apptBase, name: kw }),
    ])

    const itemsId = byIdPage.items ?? []
    const itemsName = byNamePage.items ?? []
    const merged = mergeById(itemsId, itemsName)
    const apptMerged = mergeById(apptByIdPage.items ?? [], apptByNamePage.items ?? [])

    patientOptions.value = [
      ...merged.map(toPatientOption),
      ...apptMerged.map(toAppointmentOption),
    ]
  } catch (e: any) {
    ElMessage.error(e?.message || '筛查对象列表加载失败')
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

function onTaskManualChange() {
  taskManuallySelected.value = true
}

watch(
  [selectedPatientId, selectedSubject],
  ([, subject]) => {
    if (subject?.type === 'PATIENT') {
      if (!taskManuallySelected.value) {
        selectedTask.value = 'asp'
      }
      fetchPatientDetailById(subject.id)
    } else if (subject?.type === 'APPOINTMENT') {
      if (!taskManuallySelected.value) {
        selectedTask.value = 'dys'
      }
      currentPatient.value = null
    } else {
      currentPatient.value = null
    }
  }
)

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
// const pickedDeviceIp = computed(() => firstSelectedDevice.value?.ip ?? '')
// const currentDeviceName = computed(() => firstSelectedDevice.value?.id ?? '')

function getActiveSessionId() {
  return isFileMode.value ? fileDetectSessionId.value : realtimeSessionId.value
}

function currentRiskLevel() {
  return '未分级'
}

function activeTaskCount() {
  return selectedTask.value === 'asp'
    ? realtimeStats.aspirationSwallows
    : realtimeStats.dysphagiaSwallows
}

function activeTaskDiagnosis() {
  const hasFinding = activeTaskCount() > 0
  if (selectedTask.value === 'asp') {
    return hasFinding ? '提示存在误吸' : '未提示误吸'
  }
  return hasFinding ? '提示存在吞咽障碍' : '未提示吞咽障碍'
}

function currentScreeningResult(): 'NORMAL' | 'DYSPHAGIA' | 'ASPIRATION' {
  if (selectedTask.value === 'asp') {
    return realtimeStats.aspirationSwallows > 0 ? 'ASPIRATION' : 'NORMAL'
  }
  if (realtimeStats.dysphagiaSwallows > 0) return 'DYSPHAGIA'
  return 'NORMAL'
}

function hasAbnormalScreening() {
  return currentScreeningResult() !== 'NORMAL'
}

async function persistScreeningRecord(
  staff = reportData.value.doctor?.trim() || currentUser.value?.username || '',
  options: { notify?: boolean } = {},
): Promise<ScreeningRecordRow | null> {
  const subject = selectedSubject.value
  if (!subject || subject.type !== 'APPOINTMENT') {
    return null
  }
  const requestedStaff = String(staff ?? '').trim()
  if (
    pendingScreeningRecord.value &&
    (!requestedStaff || requestedStaff === pendingScreeningRecord.value.staff)
  ) {
    return pendingScreeningRecord.value
  }

  const record = await createScreeningRecord({
    appointmentId: subject.id,
    subjectName: subject.name,
    subjectGender: subject.gender || undefined,
    subjectAge: appointmentAge(subject) || undefined,
    subjectIdCard: subject.idCard ? normalizeIdCard(subject.idCard) : undefined,
    subjectPhone: subject.phone || undefined,
    subjectDept: subject.dept || currentDepartmentName.value,
    checkDept: currentDepartmentName.value || undefined,
    deviceId: currentDeviceId.value || undefined,
    mode: isFileMode.value ? 'FILE' : 'REALTIME',
    sessionId: getActiveSessionId() || undefined,
    result: currentScreeningResult(),
    riskLevel: currentRiskLevel(),
    staff: requestedStaff,
    totalSwallows: realtimeStats.totalSwallows,
    normalSwallows: Math.max(realtimeStats.totalSwallows - activeTaskCount(), 0),
    dysphagiaSwallows: selectedTask.value === 'dys' ? realtimeStats.dysphagiaSwallows : 0,
    aspirationSwallows: selectedTask.value === 'asp' ? realtimeStats.aspirationSwallows : 0,
    checkTime: new Date().toISOString(),
  })

  checkRecordsSaved.value = true
  pendingScreeningRecord.value = record
  if (options.notify !== false) {
    ElMessage.success('预约筛查记录已保存')
  }
  return record
}

function openScreeningArchiveDialog(record: ScreeningRecordRow) {
  if (!screeningReportDownloaded.value || !pendingScreeningPdf.value?.blob) {
    ElMessage.warning('请先下载筛查报告，确认报告医生后再建档归档')
    openReportDialog()
    return
  }

  pendingScreeningRecord.value = record
  archiveForm.name = record.subjectName || selectedPatientName.value
  archiveForm.gender = (record.subjectGender || genderFromIdCard(record.subjectIdCard) || '') as '' | '男' | '女'
  archiveForm.dept = currentDepartmentName.value || ''
  archiveForm.idCard = record.subjectIdCard || selectedSubject.value?.idCard || ''
  archiveForm.onsetDate = getBeijingTimestamp(false)
  archiveForm.pastHistory = ''
  archiveForm.bedNumber = '不适用（预约筛查，未住院）'
  archiveForm.course = ''
  archiveDialogVisible.value = true
  nextTick(() => archiveFormRef.value?.clearValidate())
}

async function maybePromptScreeningArchive(record: ScreeningRecordRow | null) {
  if (!record || !hasAbnormalScreening() || screeningPromptShown.value) {
    return
  }
  screeningPromptShown.value = true
  const findingText = selectedTask.value === 'asp' ? '误吸' : '吞咽障碍'
  if (!screeningReportDownloaded.value) {
    ElMessage.warning(`本次预约筛查提示存在${findingText}，请先填写并下载报告`)
    return
  }
  ElMessage.warning(`本次预约筛查提示存在${findingText}，请建档并归档本次结果`)
  openScreeningArchiveDialog(record)
}

async function finalizeAppointmentScreeningAfterDetection() {
  if (!isAppointmentSubject.value) {
    return
  }

  try {
    const record = await persistScreeningRecord(undefined, { notify: true })
    if (record?.status === 'NEEDS_PATIENT_RECORD') {
      const findingText = selectedTask.value === 'asp' ? '误吸' : '吞咽障碍'
      ElMessage.warning(`本次预约筛查提示存在${findingText}，请先填写并下载报告`)
    }
  } catch (e: any) {
    showMonitorNotice({
      title: '筛查记录保存失败',
      message: e?.message || '本次预约筛查结果未能保存，请稍后重试或联系管理员。',
      type: 'warning',
    })
  }
}

async function submitScreeningArchive() {
  const form = archiveFormRef.value
  if (!form || archiveSubmitting.value) return

  const valid = await form.validate().catch(() => false)
  if (!valid) return

  const record = pendingScreeningRecord.value
  if (!record) {
    ElMessage.error('缺少待归档的筛查记录')
    return
  }

  archiveSubmitting.value = true
  try {
    const payload: CreatePatientPayload = {
      name: archiveForm.name.trim(),
      gender: archiveForm.gender as '男' | '女',
      dept: archiveForm.dept.trim(),
      idCard: normalizeIdCard(archiveForm.idCard),
      onsetDate: archiveForm.onsetDate,
      pastHistory: archiveForm.pastHistory.trim(),
      bedNumber: archiveForm.bedNumber.trim(),
      course: archiveForm.course.trim(),
    }
    const patient = await createPatient(payload)
    await archiveScreeningRecord(record.id, {
      patientId: patient.id,
      staff: reportData.value.doctor?.trim() || record.staff || '',
    })

    const pdf = pendingScreeningPdf.value
    if (pdf?.blob && pdf.sessionId) {
      try {
        await uploadReportPdf(patient.id, patient.name, pdf.sessionId, pdf.blob, pdf.filename)
      } catch (e: any) {
        showMonitorNotice({
          title: '报告登记失败',
          message: e?.message || '筛查已归档，但 PDF 未写入患者文件，请稍后补录。',
          type: 'warning',
        })
      }
    }

    const option = toPatientOption(patient)
    patientOptions.value = [
      option,
      ...patientOptions.value.filter(item => item.value !== option.value),
    ]
    selectedPatientId.value = option.value
    currentPatient.value = {
      id: patient.id,
      name: patient.name,
      gender: patient.gender,
      age: patient.age ?? undefined,
      outpatientId: (patient as any).outpatientId ?? undefined,
      dept: patient.dept ?? undefined,
    }

    archiveDialogVisible.value = false
    pendingScreeningRecord.value = null
    pendingScreeningPdf.value = null
    screeningReportDownloaded.value = false
    ElMessage.success('已完成建档并归档本次筛查')
  } catch (e: any) {
    showMonitorNotice({
      title: '建档归档失败',
      message: e?.message || '请检查信息后重试',
      type: 'error',
    })
  } finally {
    archiveSubmitting.value = false
  }
}

const durationShort = 5
const durationLong = 20 // 吞咽图表显示20秒窗口，避免预测延迟

const modeGuard = ref(false)

const loading = ref(true)

const deviceip = ref('')

// WebSocket 客户端
let stompClient: Client | null = null
const wsConnected = ref(false)

// 实时数据基准时间戳 - 用于计算相对时间
let realtimeBaseTimestamp = 0
let realtimeRenderCursorSec = 0

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
let dysphagiaRealtimeSeries: [number, number][] = [] // 实时模式：吞咽障碍概率
let aspirationRealtimeSeries: [number, number][] = [] // 实时模式：误吸概率

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
type DetectionTask = 'dys' | 'asp'
type DetectionEventRange = { start: number; end: number }
let dysphagiaEventRanges: DetectionEventRange[] = []
let aspirationEventRanges: DetectionEventRange[] = []

// let audioDataBuffer: Float32Array = new Float32Array()
// const audioUrl = new URL('@/mock/signals/audio.wav', import.meta.url).href

// 控制变量
const selectedTask = ref<DetectionTask | ''>('')
const taskManuallySelected = ref(false)
const selectedDevice = ref<string[]>([])
const isDetecting = ref(false)
const hasStopped = ref(false)
const canReset = ref(false)
const hasChartStarted = ref(false)
const realtimeSessionId = ref('')
const fileDetectSessionId = ref('')
const INFERENCE_UNAVAILABLE_MESSAGE = '推理服务未启动或不可达'
const inferenceStatusChecked = ref(false)
const inferenceAvailable = ref(false)
const inferenceStatusLoading = ref(false)
const isCheckingInferenceBeforeStart = ref(false)
let inferenceStatusTimer: number | null = null

function isRuntimeSummaryAvailable(summary?: RuntimeSummary | null): boolean {
  return !!(
    summary?.serviceLive &&
    summary.serviceReady &&
    summary.availableModelCount > 0
  )
}

async function refreshInferenceStatus(showUnavailableMessage = false): Promise<boolean> {
  inferenceStatusLoading.value = true
  try {
    const summary = await getRuntimeSummary()
    const available = isRuntimeSummaryAvailable(summary)
    inferenceAvailable.value = available
    inferenceStatusChecked.value = true
    if (!available && showUnavailableMessage) {
      ElMessage.warning(INFERENCE_UNAVAILABLE_MESSAGE)
    }
    return available
  } catch (error) {
    console.error('检查推理服务状态失败:', error)
    inferenceAvailable.value = false
    inferenceStatusChecked.value = true
    if (showUnavailableMessage) {
      ElMessage.warning(INFERENCE_UNAVAILABLE_MESSAGE)
    }
    return false
  } finally {
    inferenceStatusLoading.value = false
  }
}

// 实时检测统计数据
const realtimeStats = reactive({
  totalSwallows: 0, // 总吞咽次数
  dysphagiaSwallows: 0, // 吞咽障碍次数
  aspirationSwallows: 0, // 误吸次数
  normalSwallows: 0, // 正常吞咽次数
  hasDysphagia: false, // 是否有吞咽障碍
})

function resetRealtimeStats() {
  realtimeStats.totalSwallows = 0
  realtimeStats.dysphagiaSwallows = 0
  realtimeStats.aspirationSwallows = 0
  realtimeStats.normalSwallows = 0
  realtimeStats.hasDysphagia = false
}

const reportDialogVisible = ref(false)
const reportRef = ref<any>(null)

type ArchivePatientForm = Omit<CreatePatientPayload, 'gender'> & {
  gender: '' | '男' | '女'
}

const archiveDialogVisible = ref(false)
const archiveSubmitting = ref(false)
const archiveFormRef = ref<FormInstance | null>(null)
const pendingScreeningRecord = ref<ScreeningRecordRow | null>(null)
const screeningPromptShown = ref(false)
const screeningReportDownloaded = ref(false)
const pendingScreeningPdf = ref<{
  blob: Blob
  filename: string
  sessionId?: string
} | null>(null)

const archiveForm = reactive<ArchivePatientForm>({
  name: '',
  gender: '',
  dept: '',
  idCard: '',
  onsetDate: '',
  pastHistory: '',
  bedNumber: '',
  course: '',
})

function normalizeIdCard(idCard: string): string {
  return idCard.trim().toUpperCase()
}

function isValidMainlandIdCard(idCard: string): boolean {
  const id = normalizeIdCard(idCard)
  if (!/^\d{6}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dX]$/.test(id)) {
    return false
  }

  const birth = id.slice(6, 14)
  const y = Number(birth.slice(0, 4))
  const m = Number(birth.slice(4, 6))
  const d = Number(birth.slice(6, 8))
  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return false
  }

  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checksum = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  const sum = weights.reduce((acc, weight, index) => acc + Number(id[index]) * weight, 0)
  return id[17] === checksum[sum % 11]
}

function genderFromIdCard(idCard?: string | null): '男' | '女' | null {
  if (!idCard || !isValidMainlandIdCard(idCard)) return null
  const seq = Number(normalizeIdCard(idCard)[16])
  return seq % 2 === 1 ? '男' : '女'
}

function birthFromIdCard(idCard?: string | null): string | null {
  if (!idCard || !isValidMainlandIdCard(idCard)) return null
  const id = normalizeIdCard(idCard)
  return `${id.slice(6, 10)}-${id.slice(10, 12)}-${id.slice(12, 14)}`
}

function ageFromBirth(birth?: string | null): number {
  if (!birth) return 0
  const [year, month, day] = birth.split('-').map(Number)
  if (!year || !month || !day) return 0
  const today = new Date()
  let age = today.getFullYear() - year
  const beforeBirthday =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  if (beforeBirthday) age -= 1
  return Math.max(age, 0)
}

function appointmentAge(subject: PatientOption | null): number {
  if (!subject) return 0
  if (typeof subject.age === 'number' && subject.age > 0) return subject.age
  return ageFromBirth(birthFromIdCard(subject.idCard))
}

const validateArchiveIdCard = (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (!String(value ?? '').trim()) {
    callback(new Error('请填写身份证号码'))
    return
  }
  if (!isValidMainlandIdCard(String(value))) {
    callback(new Error('请输入有效的中国大陆居民身份证号码'))
    return
  }
  callback()
}

const validateArchiveGender = (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请选择性别'))
    return
  }
  const inferred = genderFromIdCard(archiveForm.idCard)
  if (inferred && inferred !== value) {
    callback(new Error('性别与身份证信息不一致'))
    return
  }
  callback()
}

const archiveRules: FormRules = {
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  gender: [{ validator: validateArchiveGender, trigger: 'change' }],
  dept: [{ required: true, message: '请填写所在科室', trigger: 'blur' }],
  idCard: [{ validator: validateArchiveIdCard, trigger: ['blur', 'change'] }],
  onsetDate: [{ required: true, message: '请选择发病日期', trigger: 'change' }],
  pastHistory: [{ required: true, message: '请填写既往史', trigger: 'blur' }],
  bedNumber: [{ required: true, message: '请填写病床号', trigger: 'blur' }],
  course: [{ required: true, message: '请填写病程', trigger: 'blur' }],
}

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

type FileSignalType = 'imu' | 'gas' | 'audio'

// 模式控制状态
const isFileMode = ref(false) // true=文件模式，false=实时模式

const isDeviceSelectionFrozen = computed(
  () => !isFileMode.value && (isDetecting.value || !!realtimeSessionId.value)
)

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

function hasImuFileSignal() {
  return !!uploadedFiles.imu && (
    imuAxisUsed.value.X ||
    imuAxisUsed.value.Y ||
    imuAxisUsed.value.Z
  )
}

function hasGasFileSignal() {
  return !!uploadedFiles.gas && gasSeries.value.length > 0
}

function hasAudioFileSignal() {
  return !!uploadedFiles.audio && audioSeries.value.length > 0
}

function isFilePayloadComplete() {
  return hasImuFileSignal() && hasGasFileSignal() && hasAudioFileSignal()
}

function hasAnyFileSignal() {
  return (
    hasImuFileSignal() ||
    hasGasFileSignal() ||
    hasAudioFileSignal()
  )
}

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
  // audioCol: '',
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
  name?: string
  rtspPath?: string
  occupied?: boolean
  occupiedPatientId?: string | null
  occupiedPatientName?: string | null
  lockExpiresAt?: string | null
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
      disabled: d.status !== 'online' || d.occupied === true,
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

function applyDeviceRegistryState(row: DeviceRow, item: DeviceItem): DeviceItem {
  return {
    ...item,
    id: row.id || item.id,
    name: row.name || item.name,
    ip: row.ip || item.ip,
    rtspPath: row.rtspPath || item.rtspPath,
    status: row.status === '在线' && row.enabled !== false ? 'online' : 'offline',
    desc: row.description || item.desc,
    occupied: row.occupied,
    occupiedPatientId: row.occupiedPatientId,
    occupiedPatientName: row.occupiedPatientName,
    lockExpiresAt: row.lockExpiresAt,
  }
}

async function refreshDeviceRegistryState() {
  try {
    const page = await listDevices({ page: 1, size: 200 })
    const rows = page.items ?? []
    deviceList.value = deviceList.value.map((item) => {
      const matched = rows.find(row => row.id === item.id || (!!row.ip && row.ip === item.ip))
      return matched ? applyDeviceRegistryState(matched, item) : item
    })
  } catch (e) {
    console.warn('刷新设备占用状态失败:', e)
  }
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

    const normalizedIp = String(deviceData.deviceIp || '').trim()
    if (!normalizedIp) {
      throw new Error('设备IP为空，无法建立连接')
    }

    let parsedInfo: Record<string, any> = {}
    try {
      parsedInfo = deviceData.deviceInfo ? JSON.parse(deviceData.deviceInfo) : {}
    } catch {
      parsedInfo = {}
    }

    const fallbackId = `DIS-${normalizedIp.replace(/[^\dA-Za-z]/g, '').slice(-10)}`
    const resolvedDeviceId = String(deviceData.deviceId || '').trim() || fallbackId
    const resolvedDeviceName = String(deviceData.deviceName || '').trim() || resolvedDeviceId

    // 创建新的设备项
    const newDevice: DeviceItem = {
      id: resolvedDeviceId,
      ip: normalizedIp,
      mac: String(parsedInfo.mac || '--'),
      status: deviceData.status === 'ONLINE' ? 'online' : 'offline',
      desc: `发现时间: ${new Date(
        deviceData.discoveryTime
      ).toLocaleTimeString()}`,
      name: resolvedDeviceName,
      rtspPath: deviceData.rtspPath,
    }

    // 检查是否已存在相同IP的设备
    const existingIndex = deviceList.value.findIndex(
      (d) => d.ip === newDevice.ip
    )
    if (existingIndex >= 0) {
      // 更新现有设备
      const previousId = deviceList.value[existingIndex].id
      deviceList.value[existingIndex] = newDevice
      if (previousId !== newDevice.id) {
        selectedDevice.value = selectedDevice.value.map((id) =>
          id === previousId ? newDevice.id : id
        )
      }
      ElMessage.success(`设备 ${newDevice.ip} 状态已更新`)
    } else {
      // 添加新设备
      deviceList.value.push(newDevice)
      ElMessage.success(`发现新设备: ${newDevice.ip}`)
      deviceip.value = newDevice.ip
    }

    await refreshDeviceRegistryState()
  } catch (error: any) {
    if (error?.response?.status === 401) {
      ElMessage.warning('登录态校验失败。若刚切换网络，请确认仍使用同一访问地址，或刷新页面后重新登录。')
      return
    }
    ElMessage.error(error?.message || '设备发现失败')
  } finally {
    loading.value = false
  }
}

// 处理下拉框显示/隐藏事件
function handleSelectVisibleChange(visible: boolean) {
  if (visible && !isFileMode.value && !isDeviceSelectionFrozen.value) {
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
  const patient = currentPatient.value
  const subject = selectedSubject.value

  // 🟡 统一用这一刻的时间作为“检测时间”和“检测编号”的时间基准
  const now = new Date()

  // 患者基本信息：优先用当前患者详情，没有就退回下拉里的名字/原值
  reportData.value.name =
    patient?.name || subject?.name || selectedPatientName.value || reportData.value.name

  reportData.value.gender =
    isPatientSubject.value
      ? (patient?.gender as string | undefined) || reportData.value.gender
      : subject?.gender || genderFromIdCard(subject?.idCard) || ''

  reportData.value.age =
    isPatientSubject.value && typeof patient?.age === 'number'
      ? patient!.age
      : appointmentAge(subject)

  // 门诊号（不能手填，等后端补到患者详情里；目前先尝试从 patient.outpatientId 读）
  reportData.value.outpatientId =
    isPatientSubject.value
      ? patient?.outpatientId || reportData.value.outpatientId
      : subject?.id || ''

  // 所在科室：优先使用患者档案科室；操作者科室只作为兜底。
  reportData.value.department =
    (isPatientSubject.value ? patient?.dept : currentDepartmentName.value) ||
    currentDepartmentName.value
  reportData.value.appointmentDept = isAppointmentSubject.value ? subject?.dept || '' : ''
  reportData.value.checkDept = currentDepartmentName.value
  reportData.value.appointmentTime = isAppointmentSubject.value ? subject?.time || '' : ''

  // 🟡 检测时间：显示在患者信息栏的“检测时间”
  reportData.value.date = formatDateTime(now)

  // 🟡 检测编号：R[patientId][yyyymmddhhmmss]
  // patientId 优先用患者档案 ID；预约筛查则使用预约 ID 生成临时报告编号。
  const pid =
    patient?.id || subject?.id || reportData.value.outpatientId || '000000'

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const yyyy = now.getFullYear()
  const MM = pad2(now.getMonth() + 1)
  const dd = pad2(now.getDate())
  const hh = pad2(now.getHours())
  const mm = pad2(now.getMinutes())
  const ss = pad2(now.getSeconds())
  const ts = `${yyyy}${MM}${dd}${hh}${mm}${ss}`

  reportData.value.reportId = `${isAppointmentSubject.value ? 'S' : 'R'}${pid}${ts}`

  // 检测统计数据：报告只展示当前选择任务对应的结论与事件。
  const task = selectedTask.value || (isAppointmentSubject.value ? 'dys' : 'asp')
  reportData.value.taskType = task
  reportData.value.totalSwallows = realtimeStats.totalSwallows
  reportData.value.dysphagiaSwallows =
    task === 'dys' ? realtimeStats.dysphagiaSwallows : 0
  reportData.value.aspirationSwallows =
    task === 'asp' ? realtimeStats.aspirationSwallows : 0
  reportData.value.dysphagiaEvents =
    task === 'dys' ? [...dysphagiaEventRanges] : []
  reportData.value.aspirationEvents =
    task === 'asp' ? [...aspirationEventRanges] : []
  reportData.value.abnormalSwallows = activeTaskCount()
  reportData.value.normalSwallows = Math.max(
    realtimeStats.totalSwallows - activeTaskCount(),
    0
  )
  reportData.value.diagnosis = activeTaskDiagnosis()
  reportData.value.riskLevel = ''

  const suggestions: string[] = []
  if (task === 'dys') {
    suggestions.push(
      '1. 建议结合床旁评估和临床表现进一步确认吞咽功能状态',
      '2. 如筛查提示异常，建议完善患者建档并转入诊疗流程',
      '3. 进食期间注意姿势、速度和食物质地',
      '4. 如出现咳嗽、清嗓、声音改变或进食困难，请及时处理'
    )
  } else if (activeTaskCount() > 0) {
    suggestions.push(
      '1. 建议由医生结合医嘱和临床表现进一步评估',
      '2. 进食期间加强观察，必要时调整体位和食物性状',
      '3. 如多次提示误吸，建议及时处理并复查',
      '4. 必要时结合进一步检查确认'
    )
  } else {
    suggestions.push(
      '1. 本次检测未提示误吸',
      '2. 建议继续按照医嘱进行观察和护理',
      '3. 如进食过程中出现异常表现，请及时复查',
      '4. 必要时结合进一步检查确认'
    )
  }

  reportData.value.suggestions = suggestions
  reportDialogVisible.value = true
}

async function downloadReport() {
  const comp = reportRef.value as any
  if (!comp) {
    ElMessage.error('报告组件未就绪，请稍后重试')
    return
  }

  // 处理 reportContent 引用：既兼容暴露 ref，也兼容已解包成 DOM
  let content: HTMLDivElement | null = null
  const rawContent = comp.reportContent
  if (rawContent instanceof HTMLElement) {
    content = rawContent as HTMLDivElement
  } else if (rawContent && rawContent.value instanceof HTMLElement) {
    content = rawContent.value as HTMLDivElement
  }
  if (!content) {
    ElMessage.error('报告内容尚未渲染完成')
    return
  }

  // === 1）从子组件拿“医生姓名”和“建议措施” ===
  const rawDoctor = comp.doctorText
  const rawSuggestion = comp.suggestionText

  const doctorName = (
    typeof rawDoctor === 'string'
      ? rawDoctor
      : rawDoctor?.value ?? ''
  ).trim()

  const suggestionStr: string =
    typeof rawSuggestion === 'string'
      ? rawSuggestion
      : rawSuggestion?.value ?? ''

  // === 1.5）前端预警：医生姓名没填写，禁止下载 ===
  if (!doctorName) {
    const doctorLabel = selectedTask.value === 'asp' ? '报告医生' : '筛查医生'
    ElMessage.warning(`请先在报告中填写“${doctorLabel}”后再下载`)
    return
  }

  // === 2）防止多次触发：下载中直接返回 ===
  if (isDownloadingReport.value) {
    return
  }
  isDownloadingReport.value = true

  // 报告时间：单独一栏“报告时间”
  reportData.value.time = formatDateTime(new Date())

  // 同步数据到 reportData（供持久化 & 下次打开时回填）
  reportData.value.doctor = doctorName
  if (suggestionStr) {
    reportData.value.suggestions = suggestionStr.split('\n')
  } else {
    reportData.value.suggestions = []
  }

  // === 3）患者对象直接写患者检测记录；预约对象先写筛查记录 ===
  if (isPatientSubject.value) {
    const saved = await persistCheckRecords()
    if (!saved) {
      isDownloadingReport.value = false
      return
    }
  }

  // === 4）为了导出 PDF，临时把输入框 / 文本域换成纯文本节点 ===
  const doctorInput = content.querySelector(
    '.doctor-input'
  ) as HTMLInputElement | null

  let doctorParent: ParentNode | null = null
  let doctorSpan: HTMLSpanElement | null = null

  if (doctorInput) {
    doctorParent = doctorInput.parentNode
    doctorSpan = document.createElement('span')
    doctorSpan.className = 'doctor-plain'
    doctorSpan.textContent = doctorName
    if (doctorParent) {
      doctorParent.replaceChild(doctorSpan, doctorInput)
    }
  }

  const textarea = content.querySelector(
    '.suggestion-text'
  ) as HTMLTextAreaElement | null

  let parent: ParentNode | null = null
  let pre: HTMLPreElement | null = null

  if (textarea) {
    pre = document.createElement('pre')
    pre.className = 'suggestion-plain'
    pre.textContent = suggestionStr
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
    parent = textarea.parentNode
    if (parent) {
      parent.replaceChild(pre, textarea)
    }
  }

  const reportFilePrefix =
    selectedTask.value === 'asp' ? '误吸检测报告' : '吞咽障碍筛查报告'
  const filename = `${reportFilePrefix}_${reportData.value.name}_${getBeijingTimestamp(
    true
  )}.pdf`

  try {
    // === 5）用 html2pdf 生成 PDF worker ===
    const worker = (html2pdf() as any)
      .set({
        margin: 0,
        filename,
        html2canvas: { scale: 10 },
        jsPDF: { unit: 'px', format: [794, 1123] },
      })
      .from(content)
      .toPdf()

    // 5.1 拿到 Blob，上传后端登记 PatientFile（不会触发下载）
    const pdfBlob: Blob = await worker.output('blob')

    const activeSessionId = getActiveSessionId()
    let savedScreeningRecord: ScreeningRecordRow | null = null

    if (isAppointmentSubject.value) {
      try {
        savedScreeningRecord = await persistScreeningRecord(doctorName)
        pendingScreeningPdf.value = {
          blob: pdfBlob,
          filename,
          sessionId: activeSessionId || undefined,
        }
      } catch (e: any) {
        showMonitorNotice({
          title: '筛查记录保存失败',
          message: e?.message || '本次预约筛查未写入系统，已停止下载报告。',
          type: 'error',
        })
        return
      }
    }

    const pid = selectedPatientRecordId.value
    const pname =
      currentPatient.value?.name ||
      selectedPatientName.value ||
      reportData.value.name ||
      ''

    if (isPatientSubject.value && !pid) {
      showMonitorNotice({
        title: '提示',
        message: '未选中患者，无法将报告写入患者文件档案，但仍会下载 PDF',
        type: 'warning',
      })
    } else if (isPatientSubject.value) {
      if (!activeSessionId) {
        showMonitorNotice({
          title: '报告登记失败',
          message: '当前检测会话缺失，PDF 已下载但无法登记到患者档案。',
          type: 'warning',
        })
      } else {
        uploadReportPdf(pid, pname, activeSessionId, pdfBlob, filename).catch(e => {
          showMonitorNotice({
            title: '报告登记失败',
            message:
              e?.message ||
              'PDF 已下载，但未写入 PatientFile，请及时联系管理员补录。',
            type: 'warning',
          })
        })
      }
    }

    // 5.2 真正触发浏览器下载
    await worker.save()
    if (isAppointmentSubject.value && savedScreeningRecord) {
      screeningReportDownloaded.value = true
    }

    // === 5.2.1 实时模式下：下载完成后，把本次会话文件从“临时”转“正式” ===
    // ★ 这里用你上面定义好的 currentDeviceId 和 isFileMode
    if (isPatientSubject.value && !isFileMode.value && (realtimeSessionId.value || currentDeviceId.value)) {
      try {
        await finalizeRealtimeSession({
          sessionId: realtimeSessionId.value || undefined,
          deviceId: currentDeviceId.value || undefined,
        })
        realtimeSessionId.value = ''
      } catch (e: any) {
        showMonitorNotice({
          title: '会话文件登记失败',
          message:
            e?.message ||
            'PDF 已下载，但未能登记本次实时采集文件，请稍后在系统中检查。',
          type: 'warning',
        })
      }
    }

    await maybePromptScreeningArchive(savedScreeningRecord)

    // 5.3 下载完成后关闭预览弹窗
    reportDialogVisible.value = false
  } finally {
    // === 6）恢复 DOM（把 span/pre 换回原来的 input/textarea） ===
    if (parent && pre && textarea) {
      parent.replaceChild(textarea, pre)
    }
    if (doctorParent && doctorSpan && doctorInput) {
      doctorParent.replaceChild(doctorInput, doctorSpan)
    }

    isDownloadingReport.value = false
  }
}

//==================== 核心可用性：开始按钮条件 ====================
const canStartPrerequisites = computed(() => {
  const hasPatient = !!selectedPatientId.value
  if (isFileMode.value) {
    return !!(
      hasPatient &&
      selectedTask.value &&
      filePayloadReady.value &&
      isFilePayloadComplete() &&
      !isDetecting.value
    )
  }
  // 实时模式：筛查对象+任务+至少一个设备
  return !!(
    !isFileMode.value &&
    hasPatient &&
    selectedTask.value &&
    selectedDevice.value.length > 0 &&
    !isDetecting.value &&
    !realtimeSessionId.value
  )
})

const canStart = computed(
  () => canStartPrerequisites.value && inferenceAvailable.value && !isCheckingInferenceBeforeStart.value
)

const startTooltipContent = computed(() => {
  if (!inferenceStatusChecked.value && inferenceStatusLoading.value) {
    return '正在检查推理服务状态'
  }
  if (!inferenceAvailable.value) {
    return INFERENCE_UNAVAILABLE_MESSAGE
  }
  if (isFileMode.value && selectedPatientId.value && selectedTask.value && !isFilePayloadComplete()) {
    const missing = [
      !hasImuFileSignal() ? '三轴信号' : '',
      !hasGasFileSignal() ? '呼吸信号' : '',
      !hasAudioFileSignal() ? '音频信号' : '',
    ].filter(Boolean)
    return `请重新上传或配置${missing.join('、')}`
  }
  if (!canStartPrerequisites.value) {
    return '给定必填项后才能开始检测'
  }
  return ''
})

const startTooltipDisabled = computed(() => canStart.value)

function handleStartButtonClick() {
  if (!inferenceAvailable.value) {
    ElMessage.warning(INFERENCE_UNAVAILABLE_MESSAGE)
    void refreshInferenceStatus()
    return
  }
  if (isFileMode.value && selectedPatientId.value && selectedTask.value && !isFilePayloadComplete()) {
    ElMessage.warning(startTooltipContent.value)
    return
  }
  if (!canStartPrerequisites.value) {
    ElMessage.warning('给定必填项后才能开始检测')
  }
}

const hasPendingReport = computed(
  () =>
    !isFileMode.value &&
    hasStopped.value &&
    !checkRecordsSaved.value
)

const hasPendingScreeningRecord = computed(
  () => pendingScreeningRecord.value?.status === 'NEEDS_PATIENT_RECORD'
)

const hasPendingScreeningReport = computed(
  () => hasPendingScreeningRecord.value && !screeningReportDownloaded.value
)

const pendingScreeningActionText = computed(() => {
  const name = pendingScreeningRecord.value?.subjectName || selectedPatientName.value || '当前预约者'
  if (hasPendingScreeningReport.value) {
    return `预约筛查对象 ${name} 存在异常，请先填写并下载报告，再建档归档。`
  }
  return `预约筛查对象 ${name} 已完成报告下载，请建档后归档本次筛查。`
})

function handlePendingScreeningAction() {
  const record = pendingScreeningRecord.value
  if (!record) return
  if (hasPendingScreeningReport.value) {
    openReportDialog()
    return
  }
  openScreeningArchiveDialog(record)
}

function reopenPendingScreeningArchive() {
  const record = pendingScreeningRecord.value
  if (record) {
    openScreeningArchiveDialog(record)
  }
}

//==================== 实时模式相关（保留） ====================
let totalElapsed = 0
let startTime = 0
// 以下变量用于模拟数据回放模式（已禁用，改为 WebSocket 实时接收）
// let sampleRate = 44100
// let imuIdx = 0
// let gasIdx = 0
// let swallowIdx = 0
// let imuRows: any[] = []
// let gasRows: any[] = []
// let swallowRows: any[] = []
// let inSwallow = false
// let hasAlertedThisSwallow = false

let animationId: number | null = null
let lastRender = 0
const FPS = 20
const FRAME_GAP = 1000 / FPS
// const AUDIO_PLOT_HZ = 200

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
const SIGNAL_UPDATE_SETOPTION: echarts.SetOptionOpts = {
  notMerge: false,
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

function getSeriesTailTime(series: [number, number][]): number {
  return series.length > 0 ? series[series.length - 1][0] : 0
}

function normalizeRealtimeTime(
  series: [number, number][],
  rawTimeSec: number,
  minStep = 0.001
): number {
  const safe = Number.isFinite(rawTimeSec) ? Math.max(0, rawTimeSec) : 0
  if (series.length === 0) return +safe.toFixed(3)

  const last = series[series.length - 1][0]
  if (safe <= last) {
    return +(last + minStep).toFixed(3)
  }
  return +safe.toFixed(3)
}

function latestRealtimeSeriesTime(): number {
  return Math.max(
    getSeriesTailTime(imuSeries.X),
    getSeriesTailTime(imuSeries.Y),
    getSeriesTailTime(imuSeries.Z),
    getSeriesTailTime(gasSeries.value),
    getSeriesTailTime(audioSeries.value),
    getSeriesTailTime(dysphagiaRealtimeSeries),
    getSeriesTailTime(aspirationRealtimeSeries)
  )
}

function readClassOneProbability(item: any): number {
  if (!item) return 0

  const candidate = item.probabilitys ?? item.probabilities ?? item.probability
  if (Array.isArray(candidate)) {
    const val = Number(candidate[1] ?? candidate[0] ?? 0)
    return Number.isFinite(val) ? val : 0
  }

  const val = Number(candidate ?? 0)
  return Number.isFinite(val) ? val : 0
}

function resetUiInputs() {
  selectedPatientId.value = ''
  selectedTask.value = ''
  taskManuallySelected.value = false
  selectedDevice.value = []
  pendingScreeningRecord.value = null
  screeningPromptShown.value = false
  pendingScreeningPdf.value = null
  screeningReportDownloaded.value = false
  archiveDialogVisible.value = false
}

function resetCsvState() {
  csvConfigDialogVisible.value = false
  csvPreviewData.value = []
  csvHeaders.value = []
  rawCsvData.value = []
  uploadedFiles.audio = null
  uploadedFiles.imu = null
  uploadedFiles.gas = null
  audioUploadRef.value?.clearFiles()
  imuUploadRef.value?.clearFiles()
  gasUploadRef.value?.clearFiles()
  csvConfigForm.value = {
    sampleRate: 4000,
    imuAxisMap: { X: '', Y: '', Z: '' },
    gasCol: '',
    // audioCol: '',
  }
  imuAxisUsed.value = { X: false, Y: false, Z: false }
  filePayloadReady.value = false
  currentSignalType.value = 'imu'
}

function clearFileDetectionOutcome() {
  if (swallowPlayTimer != null) {
    clearInterval(swallowPlayTimer)
    swallowPlayTimer = null
  }
  if (fileDetectTimer != null) {
    clearTimeout(fileDetectTimer)
    fileDetectTimer = null
  }

  dysphagiaRealtimeSeries = []
  aspirationRealtimeSeries = []
  dysphagiaDisplaySeries = []
  aspirationDisplaySeries = []
  swallowPlaybackRows = []
  swallowSegments = []
  aspirationSegments = []
  dysphagiaEventRanges = []
  aspirationEventRanges = []
  fileDetectSessionId.value = ''
  checkRecordsSaved.value = false
  hasStopped.value = false
  isInitial.value = true
  resetRealtimeStats()

  activeMonitorNotice?.close()
  activeMonitorNotice = null

  if (swallowChart) {
    const base = createSwallowOptionFile([], [])
    swallowChart.setOption(
      { ...base, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true }
    )
  }
}

function clearUploadFileForSignal(signalType: FileSignalType) {
  if (signalType === 'imu') {
    uploadedFiles.imu = null
    imuUploadRef.value?.clearFiles()
  } else if (signalType === 'gas') {
    uploadedFiles.gas = null
    gasUploadRef.value?.clearFiles()
  } else {
    uploadedFiles.audio = null
    audioUploadRef.value?.clearFiles()
  }
}

function invalidateFilePayloadAfterSourceChange(signalType?: FileSignalType) {
  filePayloadReady.value = false
  if (signalType) {
    clearUploadFileForSignal(signalType)
  }
  clearFileDetectionOutcome()
  canReset.value = hasAnyFileSignal()
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
      showMonitorNotice({
        title: '文件格式错误',
        message: `IMU 文件需要 4 列：时间戳、X、Y、Z。\n当前检测到 ${columnCount} 列，请重新选择文件。`,
        type: 'error',
      })
      return false
    }
  } else if (signalType === 'gas') {
    if (columnCount !== 2) {
      showMonitorNotice({
        title: '文件格式错误',
        message: `鼻气流文件需要 2 列：时间戳、气流值。\n当前检测到 ${columnCount} 列，请重新选择文件。`,
        type: 'error',
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
    // audioCol: '',
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
  realtimeRenderCursorSec = 0

  imuSeries.X.length = 0
  imuSeries.Y.length = 0
  imuSeries.Z.length = 0
  gasSeries.value.length = 0
  audioSeries.value.length = 0

  dysphagiaRealtimeSeries.length = 0
  aspirationRealtimeSeries.length = 0
  dysphagiaDisplaySeries = []
  aspirationDisplaySeries = []
  swallowPlaybackRows = []
  swallowSegments = []
  aspirationSegments = []
  dysphagiaEventRanges = []
  aspirationEventRanges = []

  // imuIdx = 0
  // gasIdx = 0
  // swallowIdx = 0
  // inSwallow = false
  // hasAlertedThisSwallow = false

  hasStopped.value = false
  canReset.value = false
  isInitial.value = true
  reportDialogVisible.value = false
  checkRecordsSaved.value = false
  pendingScreeningRecord.value = null
  pendingScreeningPdf.value = null
  screeningReportDownloaded.value = false
  screeningPromptShown.value = false
  realtimeSessionId.value = ''
  fileDetectSessionId.value = ''

  resetRealtimeStats()

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
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: {
      data: ['喉运动信号 X', '喉运动信号 Y', '喉运动信号 Z'],
      top: 8,
      itemGap: 4,
    },
    grid: SIGNAL_GRID,
    xAxis: createXAxis(start, end),
    yAxis: createSignalYAxis(-400, 400),
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

function formatOccupationStartedAt(value?: string): string {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

async function showDeviceOccupiedDialog(result: RealtimeConnectResult) {
  const occupation = result.occupation
  const lines = [
    `设备编号：${occupation?.deviceId || result.deviceId || '-'}`,
    `占用对象：${occupation?.patientName || '-'}（${occupation?.patientId || '-'}）`,
    `开始时间：${formatOccupationStartedAt(occupation?.startedAt)}`,
    `原因：${occupation?.reason || result.reason || '设备正在使用中'}`,
  ]

  await ElMessageBox.alert(lines.join('<br/>'), '设备已被占用', {
    type: 'warning',
    dangerouslyUseHTMLString: true,
    confirmButtonText: '我知道了',
  })
}

async function startDetection() {
  if (!canStartPrerequisites.value) {
    ElMessage.warning('给定必填项后才能开始检测')
    return
  }

  if (isCheckingInferenceBeforeStart.value) return
  isCheckingInferenceBeforeStart.value = true
  try {
    const available = await refreshInferenceStatus(true)
    if (!available) return
  } finally {
    isCheckingInferenceBeforeStart.value = false
  }

  reportData.value.date = formatDateTime(new Date())
  hasStopped.value = false
  canReset.value = false
  isInitial.value = false

  if (isFileMode.value) {
    startFileModeDetection()
    return
  }

  // === 计算主设备（取已选列表的第一个）+ IP（从 deviceList 里找）
  const primaryId = selectedDevice.value?.[0] || ''
  const primaryIp = deviceList.value.find((d) => d.id === primaryId)?.ip || ''

  if (!primaryId || !primaryIp) {
    // ✅ 新增兜底
    ElMessage.error('请先选择在线设备（deviceId/deviceIp 不能为空）')
    return
  }

  // 实时模式 - 连接设备并启动WebSocket
  let hasConnectedDevice = false
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
      realtimeRenderCursorSec = 0
    }

    // 连接设备（注意：这里 primaryId 必须是字符串）
    const connectResult = await connectRealtimeDevice(
      primaryIp, // 设备IP
      primaryId, // 设备ID
      device.name || primaryId,
      selectedRuntimeSubjectId.value, // 患者编号或预约编号
      selectedPatientName.value // 患者姓名或预约者姓名
    )

    if (connectResult.occupied) {
      realtimeSessionId.value = ''
      const target = deviceList.value.find(d => d.id === primaryId)
      if (target) {
        target.occupied = true
        target.occupiedPatientId = connectResult.occupation?.patientId || null
        target.occupiedPatientName = connectResult.occupation?.patientName || null
      }
      await showDeviceOccupiedDialog(connectResult)
      return
    }

    if (!connectResult.success) {
      realtimeSessionId.value = ''
      ElMessage.error(connectResult.reason || '设备连接失败')
      return
    }

    realtimeSessionId.value = connectResult.sessionId || ''
    hasConnectedDevice = true

    // 建立 WebSocket
    await connectWebSocket(primaryId)

    // 启动渲染
    isDetecting.value = true
    startTime = performance.now()
    lastRender = 0
    if (animationId == null) animationId = requestAnimationFrame(frame)

    ElMessage.success('设备连接成功,正在接收数据...')
  } catch (error: any) {
    if (hasConnectedDevice && primaryId) {
      try {
        await disconnectRealtimeDevice(primaryId)
      } catch {
        // 保持启动错误提示，不覆盖主错误信息
      }
    }

    realtimeSessionId.value = ''
    ElMessage.error(error?.message || '连接设备失败')
    isDetecting.value = false
  }
}

async function stopDetection() {
  // === 计算主设备（取已选列表的第一个）+ IP（从 deviceList 里找）
  // const primaryId = selectedDevice.value?.[0] || ''
  // const primaryIp = deviceList.value.find((d) => d.id === primaryId)?.ip || ''

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
    checkRecordsSaved.value = false
    return
  }

  // 实时模式 - 断开WebSocket和设备连接
  isDetecting.value = false
  hasStopped.value = true
  canReset.value = true
  checkRecordsSaved.value = false
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
        const target = deviceList.value.find(d => d.id === primaryId)
        if (target) {
          target.occupied = false
          target.occupiedPatientId = null
          target.occupiedPatientName = null
        }
      }
      refreshDeviceRegistryState()
      // ElMessage.success(`设备已断开连接,文件已保存至:${csvPath}`)
    } catch (error: any) {
      console.error('断开设备失败:', error)
    }
  }

  await finalizeAppointmentScreeningAfterDetection()
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

// 信号图表统一坐标轴与网格样式，确保初始状态也展示清晰刻度。
const SIGNAL_GRID = { top: 40, bottom: 28, left: 52, right: 20 }
const SIGNAL_AXIS_COLOR = '#6b7280'
const SIGNAL_GRID_COLOR = '#dbe3ef'

function createSignalYAxis(
  min: number,
  max: number,
  formatter?: (value: number) => string
): echarts.YAXisComponentOption {
  return {
    type: 'value',
    min,
    max,
    splitNumber: 4,
    axisLabel: {
      formatter: (value: number) => formatter?.(value) ?? `${value}`,
    },
    axisTick: {
      show: true,
      lineStyle: { color: SIGNAL_AXIS_COLOR },
    },
    axisLine: {
      show: true,
      lineStyle: { color: SIGNAL_AXIS_COLOR },
    },
    splitLine: {
      show: true,
      lineStyle: { color: SIGNAL_GRID_COLOR },
    },
  }
}

function createXAxisAuto(): echarts.XAXisComponentOption {
  return {
    type: 'value',
    boundaryGap: [0, 0],
    splitNumber: 5,
    axisLabel: {
      showMinLabel: true,
      showMaxLabel: true,
      formatter: (val: number) => `${val.toFixed(2)}s`,
    },
    axisTick: {
      show: true,
      lineStyle: { color: SIGNAL_AXIS_COLOR },
    },
    axisLine: {
      show: true,
      onZero: true,
      lineStyle: { color: SIGNAL_AXIS_COLOR },
    },
    splitLine: {
      show: true,
      lineStyle: { color: SIGNAL_GRID_COLOR },
    },
  }
}

function createXAxis(start: number, end: number): echarts.XAXisComponentOption {
  return {
    type: 'value',
    min: start,
    max: end,
    splitNumber: 5,
    axisLabel: {
      showMinLabel: true,
      showMaxLabel: true,
      formatter: (val: number) => {
        if (Math.abs(val - start) < 0.01) return `${start.toFixed(2)}s`
        if (Math.abs(val - end) < 0.01) return `${end.toFixed(2)}s`
        return ''
      },
    },
    axisTick: {
      show: true,
      lineStyle: { color: SIGNAL_AXIS_COLOR },
    },
    axisLine: {
      show: true,
      onZero: true,
      lineStyle: { color: SIGNAL_AXIS_COLOR },
    },
    splitLine: {
      show: true,
      lineStyle: { color: SIGNAL_GRID_COLOR },
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
  
  const yAxisConfig =
    title === '呼吸信号'
      ? createSignalYAxis(-60, 60)
      : title === '吞咽声音信号'
        ? createSignalYAxis(-0.4, 0.4, (value) => value.toFixed(1))
        : createSignalYAxis(-400, 400)
  
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: [title], top: 8, itemGap: 4 },
    grid: SIGNAL_GRID,
    xAxis: createXAxis(start, end),
    yAxis: yAxisConfig,
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
  dysphagia: [number, number][],
  aspiration: [number, number][],
  start: number,
  end: number
): echarts.EChartsOption {
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
    grid: SIGNAL_GRID,
    xAxis: createXAxis(start, end),
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

// 文件模式版：Auto 轴
function createSwallowOptionFile(
  swallow: [number, number][],
  risk: [number, number][]
): echarts.EChartsOption {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['吞咽段识别', '吞咽风险概率'], top: 8, itemGap: 4 },
    grid: SIGNAL_GRID,
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
  const markAreas: any = swallowSegments.map(([start, end]) => [
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
    grid: SIGNAL_GRID,
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
    grid: SIGNAL_GRID,
    xAxis: createXAxisAuto(),
    yAxis: createSignalYAxis(-400, 400),
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
  
  const yAxisConfig =
    title === '呼吸信号'
      ? createSignalYAxis(-60, 60)
      : title === '吞咽声音信号'
        ? createSignalYAxis(-0.4, 0.4, (value) => value.toFixed(1))
        : createSignalYAxis(-400, 400)
  
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
    grid: SIGNAL_GRID,
    xAxis: createXAxisAuto(),
    yAxis: yAxisConfig,
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

// function showRiskAlert(risk: number) {
//   let message = '' as string
//   let type: 'info' | 'warning' | 'error' = 'info'
//   if (risk >= 0.7) {
//     message = '出现高风险吞咽段，请立即关注'
//     type = 'error'
//   } else if (risk >= 0.3) {
//     message = '出现中风险吞咽段，请留意'
//     type = 'warning'
//   } else if (risk >= 0.1) {
//     message = '出现低风险吞咽段，可适当关注'
//     type = 'info'
//   }
//   if (message) {
//     ElNotification({
//       title: '风险提示',
//       message,
//       type,
//       position: 'top-right',
//       duration: 3000,
//       showClose: false,
//       customClass:
//         type === 'error'
//           ? 'risk-high'
//           : type === 'warning'
//           ? 'risk-mid'
//           : 'risk-low',
//     })
//   }
// }

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
  const elapsedSec = +(logicalElapsed / 1000).toFixed(3)
  const latestSeriesSec = latestRealtimeSeriesTime()
  const targetSec = latestSeriesSec > 0 ? latestSeriesSec : elapsedSec
  if (targetSec > realtimeRenderCursorSec) {
    realtimeRenderCursorSec = targetSec
  }
  const tSec = +realtimeRenderCursorSec.toFixed(3)
  const startShort = +Math.max(0, tSec - durationShort).toFixed(3)
  const endShort = +(startShort + durationShort).toFixed(3)
  const startLong = +Math.max(0, tSec - durationLong).toFixed(3)
  const endLong = +(startLong + durationLong).toFixed(3)

  // WebSocket 实时数据已经在接收时限制了数量,这里不需要 prune
  // 只 prune 音频和吞咽相关数据
  pruneSeries(audioSeries.value, startShort)
  pruneSeries(dysphagiaRealtimeSeries, startLong)
  pruneSeries(aspirationRealtimeSeries, startLong)

  // 当预测结果持续为“未检测到吞咽事件”时，主动补0值基线点，
  // 保证概率时序图持续推进而不是空白静止。
  const swallowTailSec = Math.max(
    getSeriesTailTime(dysphagiaRealtimeSeries),
    getSeriesTailTime(aspirationRealtimeSeries)
  )
  if (swallowTailSec === 0 || swallowTailSec < tSec - 1.0) {
    const baselineSec = +Math.max(tSec, swallowTailSec + 0.001).toFixed(3)
    dysphagiaRealtimeSeries.push([baselineSec, 0])
    aspirationRealtimeSeries.push([baselineSec, 0])
  }

  // WebSocket 实时模式下不使用模拟数据
  // 实时数据由 handleRealtimeImuData、handleRealtimeGasData、handleRealtimeAudioData
  // 和 handleRealtimePredictionResult 直接添加到序列中

  // 注释掉所有模拟数据推送,避免干扰 WebSocket 实时数据
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

  // 吞咽数据也不使用模拟数据，改为从 WebSocket 接收
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
  */

  // WebSocket 实时数据已经在接收时限制了数量,这里不需要 cap
  // 只 cap 音频和吞咽相关数据
  capSeries(audioSeries.value, 10000)
  capSeries(dysphagiaRealtimeSeries, 4000)
  capSeries(aspirationRealtimeSeries, 4000)

  // 实时模式: 禁用动画,固定坐标轴范围
  imuChart.setOption(
    {
      animation: false,
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: {
        data: ['喉运动信号 X', '喉运动信号 Y', '喉运动信号 Z'],
        top: 8,
        itemGap: 4,
      },
      grid: SIGNAL_GRID,
      xAxis: createXAxis(startShort, endShort),
      yAxis: createSignalYAxis(-400, 400),
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
    SIGNAL_UPDATE_SETOPTION
  )
  // GAS 图表: 禁用动画,固定坐标轴范围,Y轴以0为中心
  gasChart.setOption(
    {
      animation: false,
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: ['呼吸信号'], top: 8, itemGap: 4 },
      grid: SIGNAL_GRID,
      xAxis: createXAxis(startShort, endShort),
      yAxis: createSignalYAxis(-60, 60),
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
    SIGNAL_UPDATE_SETOPTION
  )
  audioChart.setOption(
    {
      animation: false,
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
      grid: SIGNAL_GRID,
      xAxis: createXAxis(startShort, endShort),
      yAxis: createSignalYAxis(-0.4, 0.4, (value) => value.toFixed(1)),
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
    SIGNAL_UPDATE_SETOPTION
  )
  swallowChart.setOption(
    {
      ...createSwallowOption(
        dysphagiaRealtimeSeries,
        aspirationRealtimeSeries,
        startLong,
        endLong
      ),
      ...AXIS_UPDATE_ANIM,
    },
    AXIS_UPDATE_SETOPTION
  )

  animationId = requestAnimationFrame(frame)
}

//==================== 文件模式：“检测”模拟 ====================
async function startFileModeDetection() {
  if (!filePayloadReady.value || !isFilePayloadComplete()) {
    filePayloadReady.value = false
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
    const patientId = selectedRuntimeSubjectId.value
    const patientName = selectedPatientName.value || currentPatient.value?.name || ''
    if (!patientId) {
      ElMessage.error('请选择患者或预约者后再进行文件检测')
      isDetecting.value = false
      return
    }

    fileDetectSessionId.value = ''

    // 调用检测接口
    const result: DetectionResponse = await uploadAndPredict(
      uploadedFiles.audio,
      uploadedFiles.imu,
      uploadedFiles.gas,
      patientId,
      patientName
    )

    fileDetectSessionId.value = result.sessionId || ''

    // 检查是否检测到吞咽事件
    if (result.message) {
      resetRealtimeStats()
      showDetectionNotice({
        title: '检测完成',
        message: result.message,
        type: 'warning',
        duration: 5000,
      })
      isDetecting.value = false
      hasStopped.value = true
      canReset.value = true
      await finalizeAppointmentScreeningAfterDetection()
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
            dysphagiaProb = readClassOneProbability(result.dysphagia[eventIndex])
          }
          // 误吸检测结果的概率
          if (result.aspiration && result.aspiration[eventIndex]) {
            aspirationProb = readClassOneProbability(result.aspiration[eventIndex])
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
      let dysphagiaCount = 0

      // 统计误吸段并收集时间段
      const aspirationEvents: { time: string; label: string }[] = []
      aspirationSegments = [] // 重置误吸段
      aspirationEventRanges = []
      dysphagiaEventRanges = []

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
            aspirationEventRanges.push({ start, end })
          }
        })
      }

      if (result.dysphagia) {
        result.dysphagia.forEach((dys, idx) => {
          if (dys.predicted_class === 1 && events[idx]) {
            const [start, end] = events[idx]
            dysphagiaCount++
            dysphagiaEventRanges.push({ start, end })
          }
        })
      }

      realtimeStats.totalSwallows = totalEvents
      realtimeStats.aspirationSwallows = aspirationEvents.length
      realtimeStats.dysphagiaSwallows = dysphagiaCount
      realtimeStats.hasDysphagia = dysphagiaCount > 0
      realtimeStats.normalSwallows = Math.max(
        totalEvents - Math.max(aspirationEvents.length, dysphagiaCount),
        0
      )

      // 显示检测结果
      if (selectedTask.value === 'asp' && aspirationEvents.length > 0) {
        const timeList = aspirationEvents.map((e) => e.time).join('、')
        showDetectionNotice({
          title: '危险提示',
          message: detectionNoticeSummary(totalEvents, '误吸提示', aspirationEvents.length, timeList),
          type: 'error',
          duration: 10000,
        })
      } else if (selectedTask.value === 'dys' && dysphagiaCount > 0) {
        showDetectionNotice({
          title: '筛查提示',
          message: detectionNoticeSummary(totalEvents, '吞咽障碍', dysphagiaCount),
          type: 'warning',
          duration: 8000,
        })
      } else {
        const negativeText = selectedTask.value === 'asp' ? '未提示误吸' : '未提示吞咽障碍'
        ElMessage.success(`检测完成：共检测到 ${totalEvents} 个吞咽事件，${negativeText}`)
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
      resetRealtimeStats()
      showDetectionNotice({
        title: '检测完成',
        message: '未检测到吞咽事件',
        type: 'info',
        duration: 5000,
      })
    }

    isDetecting.value = false
    hasStopped.value = true
    canReset.value = true
    await finalizeAppointmentScreeningAfterDetection()
  } catch (error: any) {
    console.error('检测失败:', error)
    showDetectionNotice({
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

  // 实时模式资源（文件模式不会用到，已禁用改为 WebSocket 实时接收）
  /*
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
  */
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

          // 订阅预测结果
          stompClient?.subscribe(
            `/topic/device/${deviceId}/prediction`,
            (message: any) => {
              try {
                const result = JSON.parse(message.body)
                handleRealtimePredictionResult(result)
              } catch (error) {
                console.error('解析预测结果失败:', error)
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
  const rawRelativeTimeSec = (data.timestamp - realtimeBaseTimestamp) / 1000
  const relativeTimeSec = normalizeRealtimeTime(imuSeries.X, rawRelativeTimeSec)

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
  const rawRelativeTimeSec = (data.timestamp - realtimeBaseTimestamp) / 1000
  const relativeTimeSec = normalizeRealtimeTime(gasSeries.value, rawRelativeTimeSec)

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
  const rawRelativeTimeSec = (data.timestamp - realtimeBaseTimestamp) / 1000
  const relativeTimeSec = normalizeRealtimeTime(audioSeries.value, rawRelativeTimeSec)

  // 添加到AUDIO序列中
  audioSeries.value.push([relativeTimeSec, data.amplitude])

  // 限制数据点数量
  const maxPoints = 10000
  if (audioSeries.value.length > maxPoints) {
    audioSeries.value.shift()
  }
}

// 处理实时预测结果
function handleRealtimePredictionResult(result: any) {
  console.log('收到实时预测结果:', result)

  // 检查是否有错误消息
  if (result.message) {
    showDetectionNotice({
      title: '预测结果',
      message: result.message,
      type: 'info',
      duration: 3000,
    })
    return
  }

  // 兼容两种字段名：swallowEvents（驼峰）和 swallow_events（下划线）
  const swallowEvents = result.swallowEvents || result.swallow_events

  // 检查是否检测到吞咽事件
  if (swallowEvents && swallowEvents.length > 0) {
    const totalEvents = swallowEvents.length

    // 获取当前相对时间（秒）- 这是从检测开始到现在的总时间
    const currentRelativeTime = Math.max(
      latestRealtimeSeriesTime(),
      (performance.now() - startTime + totalElapsed) / 1000
    )

    // ✅ 使用窗口结束时间（当前时间）作为基准，而不是起始时间
    // 这样吞咽段会出现在图表的右侧（最新位置），而不是中间
    const windowEndTime = currentRelativeTime
    realtimeRenderCursorSec = Math.max(realtimeRenderCursorSec, windowEndTime)

    // 后端预测窗口长度（秒）- 需要与后端保持一致
    const PREDICTION_WINDOW_SEC = 5

    console.log('当前相对时间:', currentRelativeTime.toFixed(2), 's')
    console.log('窗口结束时间:', windowEndTime.toFixed(2), 's')
    console.log('预测窗口长度:', PREDICTION_WINDOW_SEC, 's')

    // 将相对于预测窗口的时间转换为相对于检测开始的绝对时间
    // 使用窗口结束时间减去事件在窗口中的相对位置
    const events = swallowEvents.map(([start, end]: [number, number]) => [
      windowEndTime - (PREDICTION_WINDOW_SEC - start / 1000), // 窗口结束时间 - 距离窗口结束的时间
      windowEndTime - (PREDICTION_WINDOW_SEC - end / 1000),
    ])

    console.log('转换后的事件时间:', events)

    // 统计本次检测结果
    let aspirationCount = 0
    let dysphagiaCount = 0
    const aspirationEvents: { time: string; label: string }[] = []

    // 统计误吸
    if (result.aspiration) {
      result.aspiration.forEach((asp: any, idx: number) => {
        if (asp.predicted_class === 1 && events[idx]) {
          aspirationCount++
          const [start, end] = events[idx]
          aspirationEvents.push({
            time: `${start.toFixed(1)}s - ${end.toFixed(1)}s`,
            label: asp.label,
          })
          aspirationEventRanges.push({ start, end })
        }
      })
    }

    // 统计吞咽障碍
    if (result.dysphagia) {
      result.dysphagia.forEach((dys: any, idx: number) => {
        if (dys.predicted_class === 1 && events[idx]) {
          const [start, end] = events[idx]
          dysphagiaCount++
          dysphagiaEventRanges.push({ start, end })
        }
      })
    }

    // 更新累计统计数据
    realtimeStats.totalSwallows += totalEvents
    realtimeStats.aspirationSwallows += aspirationCount
    realtimeStats.dysphagiaSwallows += dysphagiaCount

    // 如果有吞咽障碍，标记为吞咽障碍患者
    if (dysphagiaCount > 0) {
      realtimeStats.hasDysphagia = true
    }

    // 计算正常吞咽次数（既不是误吸也不是吞咽障碍）
    realtimeStats.normalSwallows =
      realtimeStats.totalSwallows -
      Math.max(
        realtimeStats.aspirationSwallows,
        realtimeStats.dysphagiaSwallows
      )

    console.log('实时统计数据:', realtimeStats)

    // 更新图表数据
    events.forEach(([start, end]: [number, number], idx: number) => {
      // 获取吞咽障碍概率（取第二个类别的概率，即 predicted_class=1 的概率）
      let dysphagiaProb = 0
      if (result.dysphagia && result.dysphagia[idx]) {
        dysphagiaProb = readClassOneProbability(result.dysphagia[idx])
      }

      // 获取误吸概率（取第二个类别的概率，即 predicted_class=1 的概率）
      let aspirationProb = 0
      if (result.aspiration && result.aspiration[idx]) {
        aspirationProb = readClassOneProbability(result.aspiration[idx])
      }

      // 移除与新数据时间重叠的旧数据点
      // const lastTime =
      //   dysphagiaRealtimeSeries.length > 0
      //     ? dysphagiaRealtimeSeries[dysphagiaRealtimeSeries.length - 1][0]
      //     : -1

      // 如果最后一个点的时间在新事件的时间范围内，移除它
      while (
        dysphagiaRealtimeSeries.length > 0 &&
        dysphagiaRealtimeSeries[dysphagiaRealtimeSeries.length - 1][0] >=
          start - 0.2
      ) {
        dysphagiaRealtimeSeries.pop()
        aspirationRealtimeSeries.pop()
      }

      // 在吞咽段开始前添加一个0值点
      dysphagiaRealtimeSeries.push([start - 0.1, 0])
      aspirationRealtimeSeries.push([start - 0.1, 0])

      // 在吞咽段的时间范围内添加数据点
      const step = 0.1 // 100ms步长
      for (let t = start; t <= end; t = +(t + step).toFixed(3)) {
        // 添加吞咽障碍概率数据
        dysphagiaRealtimeSeries.push([t, dysphagiaProb])

        // 添加误吸概率数据
        aspirationRealtimeSeries.push([t, aspirationProb])
      }

      // 在吞咽段结束后添加一个0值点，形成下降
      dysphagiaRealtimeSeries.push([end + 0.1, 0])
      aspirationRealtimeSeries.push([end + 0.1, 0])
    })

    console.log(
      '更新后的 dysphagiaRealtimeSeries 长度:',
      dysphagiaRealtimeSeries.length
    )
    console.log('最后几个点:', dysphagiaRealtimeSeries.slice(-5))

    // 显示通知
    if (selectedTask.value === 'asp' && aspirationCount > 0) {
      const timeList = aspirationEvents.map((e) => e.time).join('、')
      showDetectionNotice({
        title: '危险提示',
        message: detectionNoticeSummary(totalEvents, '误吸提示', aspirationCount, timeList),
        type: 'error',
        duration: 8000,
      })

      // 显示风险提示
      // const maxRisk = Math.max(
      //   ...result.aspiration
      //     .filter((asp: any) => asp.predicted_class === 1)
      //     .map((asp: any) => asp.probabilitys[1] || 0)
      // )
      // showRiskAlert(maxRisk)
    } else if (selectedTask.value === 'dys' && dysphagiaCount > 0) {
      showDetectionNotice({
        title: '筛查提示',
        message: detectionNoticeSummary(totalEvents, '吞咽障碍', dysphagiaCount),
        type: 'warning',
        duration: 8000,
      })
    } else {
      const negativeText = selectedTask.value === 'asp' ? '未提示误吸' : '未提示吞咽障碍'
      showDetectionNotice({
        title: '预测结果',
        message: `吞咽事件：${totalEvents} 段；${negativeText}`,
        type: 'success',
        duration: 3000,
      })
    }
  }
}

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (hasPendingReport.value || hasPendingScreeningRecord.value) {
    // 有未完成的报告/预约筛查归档 ⇒ 阻止默认并提示
    e.preventDefault()
    // 大多数浏览器会忽略自定义文案，但必须设置 returnValue 才会弹出确认框
    e.returnValue = ''
  }
  // 无论如何尝试断开 WebSocket，防止后台残留连接
  disconnectWebSocket()
}

onMounted(() => {
  if (!hasChartStarted.value) {
    initCharts()
    hasChartStarted.value = true
  }

  void refreshInferenceStatus()
  inferenceStatusTimer = window.setInterval(() => {
    void refreshInferenceStatus()
  }, 10000)

  // 初始状态不加载设备，等用户点击下拉框时再发现设备
  loading.value = false

  // 页面卸载时断开WebSocket
  window.addEventListener('beforeunload', handleBeforeUnload)
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
    showMonitorNotice({
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
    showMonitorNotice({
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
    // audioCol: csvConfigForm.value.audioCol,
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
    showMonitorNotice({
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

const handleImuCsvChange = (file: UploadFile) => handleCsvSelect(file, 'imu')
const handleGasCsvChange = (file: UploadFile) => handleCsvSelect(file, 'gas')

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
    showMonitorNotice({
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
    filePayloadReady.value = false
    clearFileDetectionOutcome()
    canReset.value = hasAnyFileSignal()

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
    showMonitorNotice({
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
  const wasReady = filePayloadReady.value
  const ready = isFilePayloadComplete()
  filePayloadReady.value = ready

  if (ready && !wasReady) {
    ElMessage.success('所有信号已配置完成，可以开始检测')
  }
}

const submitCsvConfig = async () => {
  if (!csvConfigFormRef.value) return
  const valid = await csvConfigFormRef.value.validate()
  if (!valid) return

  filePayloadReady.value = false
  clearFileDetectionOutcome()

  // const { sampleRate, imuAxisMap, gasCol, audioCol } = csvConfigForm.value
  const { sampleRate, imuAxisMap, gasCol } = csvConfigForm.value
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
    const markAreas: any = aspirationSegments.map(([start, end]) => [
      { xAxis: start, itemStyle: { color: 'rgba(255, 77, 79, 0.15)' } },
      { xAxis: end },
    ])

    console.log('生成的markAreas:', markAreas)

    // 更新IMU图表 - 只为第一个系列添加遮罩（避免叠加）
    imuChart.setOption(
      {
        series: [
          {
            markArea: { silent: true, data: markAreas as any, label: { show: false } },
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
              data: markAreas as any,
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
              data: markAreas as any,
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
  if (isDetecting.value) {
    ElMessage.warning('检测过程中请先停止检测，再清空信号数据')
    return
  }

  const label =
    chartType === 'imu' ? '喉运动' : chartType === 'gas' ? '呼吸' : '声音'
  try {
    await ElMessageBox.confirm(
      `确定要清空${label}信号数据吗？清空后本次文件检测结果会失效，需要重新上传该信号后才能继续检测。`,
      '确认清空',
      { type: 'warning' }
    )
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
    invalidateFilePayloadAfterSourceChange('imu')

    // 对每个可能的 id 尝试“按引用删除”
    for (const id of idsToCheck) await maybeDeleteServerFile(id)
  } else if (chartType === 'gas') {
    const id = owner.gas
    gasSeries.value = []
    owner.gas = null
    invalidateFilePayloadAfterSourceChange('gas')
    await maybeDeleteServerFile(id)
  } else {
    const id = owner.audio
    audioSeries.value = []
    owner.audio = null
    invalidateFilePayloadAfterSourceChange('audio')
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
  } catch (error : any) {
    fileDetectSessionId.value = ''
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
      ElMessage.error(
        '模式切换失败: ' +
          ((error && error.message) ||
            (typeof error === 'string' ? error : '未知错误'))
      )
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (inferenceStatusTimer !== null) {
    window.clearInterval(inferenceStatusTimer)
    inferenceStatusTimer = null
  }
  disconnectWebSocket()
})

onBeforeRouteLeave((to, from, next) => {
  void to
  void from
  if (hasPendingScreeningRecord.value) {
    const message = hasPendingScreeningReport.value
      ? '当前预约筛查结果尚未导出报告。请先填写报告医生并下载报告，再完成建档归档，否则本次筛查会话文件无法安全归入患者档案。'
      : '当前预约筛查结果尚未完成建档归档。请先完成建档并归档后再离开本页，否则本次筛查会话文件无法安全归入患者档案。'
    ElMessageBox.alert(
      message,
      hasPendingScreeningReport.value ? '请先下载报告' : '请先建档归档',
      {
        type: 'warning',
        confirmButtonText: hasPendingScreeningReport.value ? '去下载报告' : '继续建档',
      }
    ).finally(() => {
      if (hasPendingScreeningReport.value) {
        openReportDialog()
      } else {
        reopenPendingScreeningArchive()
      }
    })
    next(false)
    return
  }

  if (hasPendingReport.value) {
    ElMessageBox.confirm(
      '当前检测已停止但尚未导出报告，离开本页将导致本次检测记录无法写入系统。是否仍然离开？',
      '提示',
      {
        type: 'warning',
        confirmButtonText: '仍然离开',
        cancelButtonText: '留在本页',
      }
    )
      .then(() => {
        disconnectWebSocket()
        next()
      })
      .catch(() => {
        next(false)
      })
  } else {
    disconnectWebSocket()
    next()
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

.subject-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
  width: 100%;
  height: 64px;
  min-width: 0;
  box-sizing: border-box;
  padding: 8px 12px;
  line-height: 1.2;
}

.subject-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.subject-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.subject-sub {
  display: flex;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  color: #5f6b7a;
  font-size: 12px;
}

.subject-sub span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subject-sub span:first-child {
  flex: 0 0 auto;
}

.subject-sub span:last-child {
  flex: 1 1 auto;
  min-width: 0;
}

:global(.subject-select-popper .el-select-dropdown__item) {
  height: 64px;
  padding: 0;
  line-height: normal;
}

:global(.subject-select-popper .el-select-dropdown__item > span) {
  width: 100%;
}

.archive-alert {
  margin-bottom: 16px;
}

.archive-form {
  padding-top: 4px;
}

.screening-followup {
  margin-top: 12px;
}

.screening-followup-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}
:deep(.el-card__header) {
  padding: 6px 0px;
}
.header-actions .el-divider--vertical.header-divider {
  align-self: stretch;
  height: auto;
  margin: 0 6px;
}

.start-button-wrapper {
  display: inline-flex;
}

.setting-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
}
.setting-item {
  flex: 1 1 0;
  min-width: 0;
}

.subject-select {
  flex: 1 1 0;
}

.task-select {
  flex: 0 0 160px;
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
  flex: 1 1 0;
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

.monitor-notice {
  width: 360px;
  max-width: calc(100vw - 32px);
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
}

.monitor-notice .el-notification__group {
  min-width: 0;
}

.monitor-notice .el-notification__title {
  font-size: 15px;
  line-height: 1.3;
  font-weight: 700;
}

.monitor-notice .el-notification__content {
  margin-top: 6px;
  color: #4b5563;
  line-height: 1.6;
  white-space: pre-line;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.monitor-notice .el-notification__closeBtn {
  top: 16px;
}

.monitor-notice-error {
  border-left: 5px solid #ef4444;
}

.monitor-notice-warning {
  border-left: 5px solid #f59e0b;
}

.monitor-notice-success {
  border-left: 5px solid #22c55e;
}

.monitor-notice-info {
  border-left: 5px solid #3b82f6;
}
</style>
