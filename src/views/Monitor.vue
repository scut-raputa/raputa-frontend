<template>
  <div class="monitor-container">

    <el-card class="card" shadow="hover">
      <template #header>
        <div class="card-header-row">
          <div class="card-header">快速设置</div>
          <div class="header-actions">

            <el-switch
              v-model="isFileMode"
              active-text="文件模式"
              inactive-text="实时模式"
              active-color="#1890ff"
              inactive-color="#ccc"
              size="small"
            />

            <el-divider direction="vertical" class="header-divider" />

            <div class="action-button-group">

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
                    {{ startButtonText }}
                  </el-button>
                </span>
              </el-tooltip>

              <el-tooltip
                :content="stopTooltipContent"
                placement="top"
                :disabled="stopTooltipDisabled"
              >
                <span class="stop-button-wrapper" @click="handleStopButtonClick">
                  <el-button
                    type="danger"
                    size="small"
                    :disabled="!canStopDetection"
                    @click.stop="stopDetection"
                  >
                    <el-icon style="margin-right: 4px"><VideoPause /></el-icon>
                    停止检测
                  </el-button>
                </span>
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
        </div>
      </template>

      <div class="setting-row">

        <el-select
          v-model="selectedTask"
          placeholder="请选择检测任务"
          size="small"
          class="setting-item task-select"
          :disabled="isDetecting || hasStopped"
          @change="onTaskManualChange"
        >
          <template #prefix>
            <el-icon><Operation /></el-icon>
          </template>
          <el-option label="吞咽障碍筛查" value="dys" />
          <el-option label="误吸" value="asp" />
        </el-select>

        <el-select
          v-model="selectedSubjectType"
          placeholder="请选择受试者身份"
          size="small"
          class="setting-item subject-type-select"
          :disabled="isDetecting || hasStopped"
          clearable
          @change="onSubjectTypeChange"
          @clear="onSubjectTypeClear"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
          <el-option label="预约者" value="APPOINTMENT" />
          <el-option label="患者" value="PATIENT" />
        </el-select>

        <el-select-v2
          v-model="selectedPatientId"
          class="setting-item subject-select"
          :options="subjectOptions"
          :remote="true"
          :loading="patientLoading"
          :remote-method="remotePatientQuery"
          size="small"
          filterable
          clearable
          placeholder="请选择受试者"
          :disabled="!selectedSubjectType || isDetecting || hasStopped"
          :item-height="64"
          :height="320"
          popper-class="subject-select-popper"
          @visible-change="onPatientSelectVisible"
          @clear="clearSubjectSelection"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
          <template #empty>
            <el-empty class="subject-empty" :image-size="130" description="无匹配受试者" />
          </template>
          <template #default="{ item }">
            <div class="subject-option">
              <div class="subject-main">
                <span class="subject-name">{{ item.name }}</span>
                <el-tag size="small" :type="item.type === 'PATIENT' ? 'success' : 'warning'" effect="plain">
                  {{ item.type === 'PATIENT' ? '患者' : '预约者' }}
                </el-tag>
              </div>
              <div class="subject-sub" :title="`${item.id}${item.dept ? ' / ' + item.dept : ''}`">
                <span>编号：{{ item.id }}</span>
                <span v-if="item.dept">{{ item.type === 'APPOINTMENT' ? '预约科室' : '科室' }}：{{ item.dept }}</span>
              </div>
            </div>
          </template>
        </el-select-v2>

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

            <div v-if="!isFileMode" class="segmentation-mode-control">
              <span>自动分割吞咽段</span>
              <el-switch
                v-model="manualSegmentationEnabled"
                size="small"
                :disabled="isDetecting && (manualSwallowActive || manualSwallowResultPending)"
                @change="handleSegmentationModeChange"
              />
              <span>手动分割吞咽段</span>
            </div>

            <el-divider
              v-if="!isFileMode"
              direction="vertical"
              class="chart-header-divider"
            />

            <el-tooltip
              v-if="!isFileMode"
              :content="manualSwallowTooltip"
              placement="top"
              :disabled="canUseManualSwallowButton"
            >
              <span class="manual-swallow-wrapper">
                <el-button
                  type="primary"
                  size="small"
                  plain
                  :disabled="!canUseManualSwallowButton"
                  @click="handleManualSwallowClick"
                >
                  {{ manualSwallowButtonText }}
                </el-button>
              </span>
            </el-tooltip>

            <el-divider
              v-if="!isFileMode"
              direction="vertical"
              class="chart-header-divider"
            />

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

        <div class="chart-box chart-span-all">
          <div ref="swallowRef" class="echart-container" />
        </div>

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
      <el-button @click="resetArchiveEditableFields">恢复默认</el-button>
      <el-button type="primary" :loading="archiveSubmitting" @click="submitScreeningArchive">
        建档并归档
      </el-button>
    </template>
  </el-dialog>

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

    <el-form
      ref="csvConfigFormRef"
      :model="csvConfigForm"
      label-width="120px"
      class="csv-config-form"
      style="margin-top: 20px"
    >

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

    </el-form>

    <template #footer>
      <el-button @click="csvConfigDialogVisible = false">取消</el-button>
      <el-button @click="resetCsvConfigFormToDefaults">重置配置</el-button>
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
import MedicalReport from '@/components/MedicalReport.vue'
import ScreeningReport from '@/components/ScreeningReport.vue'
import { reportData } from '@/state/reportData'
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
import { Client } from '@stomp/stompjs'
import { getUser } from '@/utils/auth'
import type { UserVO } from '@/types/user'

import { createPatient, listPatients, getPatientById, type CreatePatientPayload } from '@/api/patient'
import { listAppointments } from '@/api/appointment'
import type { AppointmentRow } from '@/types/appointment'
import { listDevices } from '@/api/deviceManagement'
import type { DeviceRow } from '@/types/deviceManagement'
import { listRuntimeModels } from '@/api/model'
import {
  archiveScreeningRecord,
  createScreeningRecord,
  type ScreeningRecordRow,
} from '@/api/screening'

import { uploadReportPdf } from '@/api/report'
import {
  finalizeRealtimeSession,
  setRealtimeSegmentationMode,
  submitManualSwallowSegment,
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
const selectedSubjectType = ref<SubjectType | ''>('')
const selectedPatientId = ref<string>('')
const loadedSubjectQueryKey = ref('')
let inFlightSubjectQueryKey = ''
let subjectFetchSeq = 0

const subjectOptions = computed(() => {
  if (!selectedSubjectType.value) return []
  return patientOptions.value.filter(option => option.type === selectedSubjectType.value)
})

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

const currentUser = ref<UserVO | null>(getUser())

const currentDepartmentName = computed(
  () => currentUser.value?.departmentName ?? ''
)

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
        gender: (p as any).gender,
        age: p.age ?? undefined,

        outpatientId: (p as any).outpatientId ?? undefined,
        dept: p.dept ?? undefined,
      }
    } else {

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
    label: `预约者 | ${a.id} - ${a.name}`,
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

function subjectQueryKey(type: SubjectType, keyword = '') {
  return `${type}:${keyword.trim()}`
}

function resetSubjectOptionLoadState() {
  loadedSubjectQueryKey.value = ''
  inFlightSubjectQueryKey = ''
  subjectFetchSeq += 1
}

const checkRecordsSaved = ref(false)

async function persistCheckRecords(): Promise<boolean> {
  if (!isPatientSubject.value) {
    ElMessage.warning('预约筛查对象需先保存为筛查记录，建档后再归入患者检测记录')
    return false
  }

  const patientId = selectedPatientRecordId.value
  const patientName = selectedPatientName.value
  const staff = reportData.value.doctor?.trim() || ''

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

async function fetchPatients(keyword = '') {
  const subjectType = selectedSubjectType.value
  if (!subjectType) {
    patientOptions.value = []
    return
  }

  const normalizedKeyword = keyword.trim()
  const queryKey = subjectQueryKey(subjectType, normalizedKeyword)
  if (loadedSubjectQueryKey.value === queryKey || inFlightSubjectQueryKey === queryKey) {
    return
  }

  const requestSeq = ++subjectFetchSeq
  inFlightSubjectQueryKey = queryKey
  patientLoading.value = true
  try {
    const base = { page: 1, size: 100 }
    const apptBase = { page: 1, size: 100 }
    let options: PatientOption[] = []

    if (!normalizedKeyword) {
      if (subjectType === 'PATIENT') {
        const patientPage = await listPatients(base)
        options = (patientPage.items ?? []).map(toPatientOption)
      } else {
        const appointmentPage = await listAppointments(apptBase)
        options = (appointmentPage.items ?? []).map(toAppointmentOption)
      }
    } else {

      if (subjectType === 'PATIENT') {
        const [byIdPage, byNamePage] = await Promise.all([
          listPatients({ ...base, id: normalizedKeyword }),
          listPatients({ ...base, name: normalizedKeyword }),
        ])
        const merged = mergeById(byIdPage.items ?? [], byNamePage.items ?? [])
        options = merged.map(toPatientOption)
      } else {
        const [apptByIdPage, apptByNamePage] = await Promise.all([
          listAppointments({ ...apptBase, id: normalizedKeyword }),
          listAppointments({ ...apptBase, name: normalizedKeyword }),
        ])
        const apptMerged = mergeById(apptByIdPage.items ?? [], apptByNamePage.items ?? [])
        options = apptMerged.map(toAppointmentOption)
      }
    }

    if (requestSeq !== subjectFetchSeq || selectedSubjectType.value !== subjectType) return

    patientOptions.value = options
    loadedSubjectQueryKey.value = queryKey
  } catch (e: any) {
    if (requestSeq !== subjectFetchSeq) return
    ElMessage.error(e?.message || '筛查对象列表加载失败')
    patientOptions.value = []
    loadedSubjectQueryKey.value = ''
  } finally {
    if (requestSeq === subjectFetchSeq) {
      inFlightSubjectQueryKey = ''
      patientLoading.value = false
    }
  }
}

const remotePatientQuery = (q: string) => {
  if (!selectedSubjectType.value) {
    patientOptions.value = []
    return
  }
  if ((remotePatientQuery as any)._t) clearTimeout((remotePatientQuery as any)._t)
  ;(remotePatientQuery as any)._t = setTimeout(() => fetchPatients(q), 200)
}

function clearSubjectSelection() {
  selectedPatientId.value = ''
  currentPatient.value = null
}

function onSubjectTypeChange() {
  clearSubjectSelection()
  patientOptions.value = []
  resetSubjectOptionLoadState()
  void fetchPatients('')
}

function onSubjectTypeClear() {
  clearSubjectSelection()
  patientOptions.value = []
  resetSubjectOptionLoadState()
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

function onPatientSelectVisible(visible: boolean) {
  if (
    visible &&
    selectedSubjectType.value &&
    loadedSubjectQueryKey.value !== subjectQueryKey(selectedSubjectType.value, '')
  ) {
    fetchPatients('')
  }
}

const firstSelectedDevice = computed(() => {
  const firstId = selectedDevice.value?.[0]
  if (!firstId) return null
  return deviceList.value.find((d) => d.id === firstId) || null
})

const currentDeviceId = computed(() => firstSelectedDevice.value?.id ?? '')

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

function resetArchiveEditableFields() {
  archiveForm.dept = currentDepartmentName.value || ''
  archiveForm.onsetDate = getBeijingTimestamp(false)
  archiveForm.pastHistory = ''
  archiveForm.bedNumber = '不适用（预约筛查，未住院）'
  archiveForm.course = ''
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
    selectedSubjectType.value = 'PATIENT'
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
const durationLong = 20

const modeGuard = ref(false)

const loading = ref(true)

const deviceip = ref('')

let stompClient: Client | null = null
const wsConnected = ref(false)

const realtimeBaseTimestamps = {
  imu: 0,
  gas: 0,
  audio: 0,
}
let realtimeRenderCursorSec = 0

const imuRef = ref<HTMLDivElement>()
const gasRef = ref<HTMLDivElement>()
const audioRef = ref<HTMLDivElement>()
const swallowRef = ref<HTMLDivElement>()

let imuChart: echarts.ECharts
let gasChart: echarts.ECharts
let audioChart: echarts.ECharts
let swallowChart: echarts.ECharts

const imuSeries = { X: [], Y: [], Z: [] } as Record<string, [number, number][]>
const gasSeries = ref<[number, number][]>([])
const audioSeries = ref<[number, number][]>([])
let dysphagiaRealtimeSeries: [number, number][] = []
let aspirationRealtimeSeries: [number, number][] = []

let dysphagiaDisplaySeries: [number, number][] = []
let aspirationDisplaySeries: [number, number][] = []
let swallowPlaybackRows: {
  time: number
  dysphagia: number
  aspiration: number
}[] = []
let swallowPlayTimer: number | null = null
let fileDetectTimer: number | null = null
let aspirationSegments: [number, number][] = []
type DetectionTask = 'dys' | 'asp'
type DetectionEventRange = { start: number; end: number }
let dysphagiaEventRanges: DetectionEventRange[] = []
let aspirationEventRanges: DetectionEventRange[] = []
let realtimeSwallowEventRanges: DetectionEventRange[] = []
let fileSwallowSegments: [number, number][] = []
let fileRiskSegments: [number, number][] = []

const DYSPHAGIA_PROBABILITY_COLOR = '#2563EB'
const ASPIRATION_PROBABILITY_COLOR = '#DC2626'
const FILE_SWALLOW_AREA_COLOR = 'rgba(148, 163, 184, 0.14)'
const DYSPHAGIA_RISK_AREA_COLOR = 'rgba(37, 99, 235, 0.14)'
const ASPIRATION_RISK_AREA_COLOR = 'rgba(220, 38, 38, 0.14)'
const MANUAL_SWALLOW_AREA_COLOR = 'rgba(245, 158, 11, 0.16)'
const MAX_REALTIME_SIGNAL_POINTS = 120000
const MAX_REALTIME_PROBABILITY_POINTS = 60000

function rangesToSegments(ranges: DetectionEventRange[]): [number, number][] {
  return ranges.map(({ start, end }) => [start, end])
}

function appendUniqueRange(target: DetectionEventRange[], range: DetectionEventRange) {
  if (!Number.isFinite(range.start) || !Number.isFinite(range.end) || range.end <= range.start) {
    return
  }
  const exists = target.some(
    (item) =>
      Math.abs(item.start - range.start) < 0.01 &&
      Math.abs(item.end - range.end) < 0.01
  )
  if (!exists) {
    target.push({ start: +range.start.toFixed(3), end: +range.end.toFixed(3) })
  }
}

function currentFileRiskAreaColor() {
  return selectedTask.value === 'dys'
    ? DYSPHAGIA_RISK_AREA_COLOR
    : ASPIRATION_RISK_AREA_COLOR
}

function createFileSegmentMarkArea(
  swallowSegments: [number, number][],
  riskSegments: [number, number][]
): any | undefined {
  if (swallowSegments.length === 0 && riskSegments.length === 0) {
    return undefined
  }

  return {
    silent: true,
    data: [
      ...swallowSegments.map(([start, end]) => [
        { xAxis: start, itemStyle: { color: FILE_SWALLOW_AREA_COLOR } },
        { xAxis: end },
      ]),
      ...riskSegments.map(([start, end]) => [
        { xAxis: start, itemStyle: { color: currentFileRiskAreaColor() } },
        { xAxis: end },
      ]),
    ],
    label: { show: false },
  }
}

function toAreaData(
  ranges: DetectionEventRange[],
  color: string
): Array<[Record<string, unknown>, Record<string, unknown>]> {
  return ranges
    .filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end) && end > start)
    .map(({ start, end }) => [
      { xAxis: +start.toFixed(3), itemStyle: { color } },
      { xAxis: +end.toFixed(3) },
    ])
}

function createRealtimeSegmentOverlay(): Record<string, unknown> {
  const areaData = [
    ...toAreaData(realtimeSwallowEventRanges, FILE_SWALLOW_AREA_COLOR),
    ...toAreaData(dysphagiaEventRanges, DYSPHAGIA_RISK_AREA_COLOR),
    ...toAreaData(aspirationEventRanges, ASPIRATION_RISK_AREA_COLOR),
    ...toAreaData(manualSwallowSegments.value, MANUAL_SWALLOW_AREA_COLOR),
  ]

  const markLines: Array<{ name: string; xAxis: number }> = []
  manualSwallowSegments.value.forEach((seg) => {
    markLines.push({ name: '开始', xAxis: +seg.start.toFixed(3) })
    markLines.push({ name: '结束', xAxis: +seg.end.toFixed(3) })
  })
  if (manualSwallowActive.value && manualSwallowStartSec.value != null) {
    markLines.push({ name: '开始', xAxis: +manualSwallowStartSec.value.toFixed(3) })
  }

  const overlay: Record<string, unknown> = {}
  if (areaData.length > 0) {
    overlay.markArea = {
      silent: true,
      data: areaData,
      label: { show: false },
    }
  }
  if (markLines.length > 0) {
    overlay.markLine = {
      silent: true,
      symbol: 'none',
      lineStyle: { color: '#f59e0b', type: 'dashed', width: 2 },
      label: {
        show: true,
        position: 'middle',
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        borderWidth: 1,
        borderRadius: 4,
        padding: [2, 5],
        color: '#b45309',
        formatter: (params: any) => params?.name || '',
      },
      data: markLines,
    }
  }
  return overlay
}

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

watch(selectedTask, () => {
  inferenceStatusChecked.value = false
  inferenceAvailable.value = false
  void refreshInferenceStatus()
})

function runtimeTaskKeyword() {
  if (selectedTask.value === 'dys') return '筛查'
  if (selectedTask.value === 'asp') return '误吸'
  return ''
}

async function refreshInferenceStatus(showUnavailableMessage = false): Promise<boolean> {
  const keyword = runtimeTaskKeyword()
  if (!keyword) {
    inferenceAvailable.value = true
    inferenceStatusChecked.value = true
    return true
  }

  inferenceStatusLoading.value = true
  try {
    const models = await listRuntimeModels({
      taskType: keyword,
      available: true,
    })
    const available = models.length > 0
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

const realtimeStats = reactive({
  totalSwallows: 0,
  dysphagiaSwallows: 0,
  aspirationSwallows: 0,
  normalSwallows: 0,
  hasDysphagia: false,
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

const imuUploadRef = ref<any>(null)
const gasUploadRef = ref<any>(null)
const audioUploadRef = ref<any>(null)

const uploadedFiles = reactive({
  audio: null as File | null,
  imu: null as File | null,
  gas: null as File | null,
})

type FileSignalType = 'imu' | 'gas' | 'audio'

const isFileMode = ref(false)

const isDeviceSelectionFrozen = computed(
  () => !isFileMode.value && (isDetecting.value || !!realtimeSessionId.value)
)

const filePayloadReady = ref(false)

const currentTempId = ref<string | null>(null)

const allTempIds = ref<Set<string>>(new Set())

const owner = reactive({
  imu: {
    X: null as string | null,
    Y: null as string | null,
    Z: null as string | null,
  },
  gas: null as string | null,
  audio: null as string | null,
})

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

const csvConfigDialogVisible = ref(false)
const csvPreviewData = ref<any[]>([])
const csvHeaders = ref<string[]>([])
const rawCsvData = ref<any[]>([])
const currentSignalType = ref<'imu' | 'gas'>('imu')

const csvConfigForm = ref({
  sampleRate: 4000,
  imuAxisMap: { X: '', Y: '', Z: '' },
  gasCol: '',
})
const csvConfigFormRef = ref<FormInstance | null>(null)

const imuAxisUsed = ref({ X: false, Y: false, Z: false })

const isInitial = ref(true)

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
])

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

function unbindInsideZoomReset(chart: echarts.ECharts) {
  chart.off('dblclick')
}

const deviceQuery = ref('')

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

async function handleDeviceDiscovery() {
  if (loading.value) return

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

    const existingIndex = deviceList.value.findIndex(
      (d) => d.ip === newDevice.ip
    )
    if (existingIndex >= 0) {

      const previousId = deviceList.value[existingIndex].id
      deviceList.value[existingIndex] = newDevice
      if (previousId !== newDevice.id) {
        selectedDevice.value = selectedDevice.value.map((id) =>
          id === previousId ? newDevice.id : id
        )
      }
      ElMessage.success(`设备 ${newDevice.ip} 状态已更新`)
    } else {

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
    const message = error?.message || '设备发现失败'
    if (message.includes('未发现设备')) {
      deviceList.value = []
      selectedDevice.value = []
      deviceip.value = ''
      ElMessage.warning(message)
      return
    }
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

function handleSelectVisibleChange(visible: boolean) {
  if (visible && !isFileMode.value && !isDeviceSelectionFrozen.value) {

    handleDeviceDiscovery()
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

  const now = new Date()

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

  reportData.value.outpatientId =
    isPatientSubject.value
      ? patient?.outpatientId || reportData.value.outpatientId
      : subject?.id || ''

  reportData.value.department =
    (isPatientSubject.value ? patient?.dept : currentDepartmentName.value) ||
    currentDepartmentName.value
  reportData.value.appointmentDept = isAppointmentSubject.value ? subject?.dept || '' : ''
  reportData.value.checkDept = currentDepartmentName.value
  reportData.value.appointmentTime = isAppointmentSubject.value ? subject?.time || '' : ''

  reportData.value.date = formatDateTime(now)

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

  if (!doctorName) {
    const doctorLabel = selectedTask.value === 'asp' ? '报告医生' : '筛查医生'
    ElMessage.warning(`请先在报告中填写“${doctorLabel}”后再下载`)
    return
  }

  if (isDownloadingReport.value) {
    return
  }
  isDownloadingReport.value = true

  reportData.value.time = formatDateTime(new Date())

  reportData.value.doctor = doctorName
  if (suggestionStr) {
    reportData.value.suggestions = suggestionStr.split('\n')
  } else {
    reportData.value.suggestions = []
  }

  if (isPatientSubject.value) {
    const saved = await persistCheckRecords()
    if (!saved) {
      isDownloadingReport.value = false
      return
    }
  }

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
    const { default: html2pdf } = await import('html2pdf.js')
    const worker = (html2pdf() as any)
      .set({
        margin: 0,
        filename,
        html2canvas: { scale: 10 },
        jsPDF: { unit: 'px', format: [794, 1123] },
      })
      .from(content)
      .toPdf()

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

    await worker.save()
    if (isAppointmentSubject.value && savedScreeningRecord) {
      screeningReportDownloaded.value = true
    }

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

    reportDialogVisible.value = false
  } finally {

    if (parent && pre && textarea) {
      parent.replaceChild(textarea, pre)
    }
    if (doctorParent && doctorSpan && doctorInput) {
      doctorParent.replaceChild(doctorInput, doctorSpan)
    }

    isDownloadingReport.value = false
  }
}

const canStartPrerequisites = computed(() => {
  if (hasStopped.value) {
    return false
  }

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

const startButtonText = computed(() =>
  isInitial.value || hasStopped.value ? '开始检测' : '继续检测'
)

const startTooltipContent = computed(() => {
  if (!inferenceStatusChecked.value && inferenceStatusLoading.value) {
    return '正在检查推理服务状态'
  }
  if (!inferenceAvailable.value) {
    return INFERENCE_UNAVAILABLE_MESSAGE
  }
  if (isDetecting.value) {
    return '检测正在进行中'
  }
  if (hasStopped.value) {
    return checkRecordsSaved.value
      ? '当前检测已结束，请先复位后重新开始'
      : '当前检测已结束，请先下载报告或复位后重新开始'
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
  if (hasStopped.value) {
    ElMessage.warning(startTooltipContent.value)
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

let totalElapsed = 0
let startTime = 0

let animationId: number | null = null
let lastRender = 0
const FPS = 20
const FRAME_GAP = 1000 / FPS

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

function resetRealtimeClock() {
  totalElapsed = 0
  startTime = 0
  lastRender = 0
  realtimeRenderCursorSec = 0
  realtimeBaseTimestamps.imu = 0
  realtimeBaseTimestamps.gas = 0
  realtimeBaseTimestamps.audio = 0
}

function normalizeRealtimeTimestamp(
  source: keyof typeof realtimeBaseTimestamps,
  timestamp: number,
  series: [number, number][]
): number {
  const currentTimestamp = Number(timestamp)
  if (!Number.isFinite(currentTimestamp)) {
    return normalizeRealtimeTime(series, 0)
  }

  if (realtimeBaseTimestamps[source] === 0) {
    realtimeBaseTimestamps[source] = currentTimestamp
  }

  const rawRelativeTimeSec =
    (currentTimestamp - realtimeBaseTimestamps[source]) / 1000
  return normalizeRealtimeTime(series, rawRelativeTimeSec)
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

const manualSegmentationEnabled = ref(false)
const manualSwallowActive = ref(false)
const manualSwallowStartSec = ref<number | null>(null)
const manualSwallowSegments = ref<DetectionEventRange[]>([])
const manualSwallowResultPending = ref(false)
const pendingManualSwallowSegment = ref<DetectionEventRange | null>(null)
const forceReleasePending = ref(false)
const forceReleaseDialogOpen = ref(false)
let forceReleaseFallbackTimer: number | null = null

const manualSwallowButtonText = computed(() =>
  manualSwallowActive.value ? '结束吞咽' : '开始吞咽'
)

const canStopDetection = computed(
  () =>
    isDetecting.value &&
    !manualSwallowActive.value &&
    !manualSwallowResultPending.value
)

const stopTooltipContent = computed(() => {
  if (manualSwallowActive.value) {
    return '请先结束当前人工吞咽段，再等待分类结果返回'
  }
  if (manualSwallowResultPending.value) {
    const segment = pendingManualSwallowSegment.value
    if (segment) {
      return `正在等待 ${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s 的分类结果`
    }
    return '正在等待最新人工吞咽段的分类结果'
  }
  if (!isDetecting.value) {
    return '仅在检测过程中启用'
  }
  return ''
})

const stopTooltipDisabled = computed(() => canStopDetection.value)

const canUseManualSwallowButton = computed(
  () =>
    !isFileMode.value &&
    manualSegmentationEnabled.value &&
    isDetecting.value &&
    !!currentDeviceId.value
)

const manualSwallowTooltip = computed(() => {
  if (!manualSegmentationEnabled.value) return '切换到手动分割吞咽段后可使用'
  if (!isDetecting.value) return '实时检测开始后可记录吞咽段'
  if (!currentDeviceId.value) return '请先选择检测设备'
  return manualSwallowActive.value
    ? '点击记录本次吞咽结束点'
    : '点击记录本次吞咽起始点'
})

function resetManualSwallowState(resetMode = false) {
  cancelForceReleaseFallbackTimer()
  forceReleasePending.value = false
  manualSwallowActive.value = false
  manualSwallowStartSec.value = null
  manualSwallowSegments.value = []
  manualSwallowResultPending.value = false
  pendingManualSwallowSegment.value = null
  if (resetMode) {
    manualSegmentationEnabled.value = false
  }
}

function handleStopButtonClick() {
  if (manualSwallowActive.value) {
    ElMessage.warning(stopTooltipContent.value)
    return
  }
  if (manualSwallowResultPending.value) {
    ElMessage.warning(stopTooltipContent.value)
    return
  }
  if (!isDetecting.value) {
    ElMessage.warning(stopTooltipContent.value)
  }
}

function markManualSwallowResultPending(segment: DetectionEventRange) {
  manualSwallowResultPending.value = true
  pendingManualSwallowSegment.value = { ...segment }
}

function clearManualSwallowResultPending(options: { deferForcedRelease?: boolean } = {}) {
  manualSwallowResultPending.value = false
  pendingManualSwallowSegment.value = null
  if (forceReleasePending.value && !options.deferForcedRelease) {
    finalizeForcedReleaseStop('当前人工吞咽段分类已返回，系统将释放设备')
  }
}

function cancelForceReleaseFallbackTimer() {
  if (forceReleaseFallbackTimer != null) {
    window.clearTimeout(forceReleaseFallbackTimer)
    forceReleaseFallbackTimer = null
  }
}

function finalizeForcedReleaseStop(message?: string) {
  cancelForceReleaseFallbackTimer()
  forceReleasePending.value = false
  if (message) {
    ElMessage.warning(message)
  }
  void stopDetection({ force: true })
}

function showForceReleaseRequestDialog(reason?: string) {
  if (forceReleaseDialogOpen.value) return
  forceReleaseDialogOpen.value = true
  void ElMessageBox.alert(
    reason || '其他账户请求释放当前设备，会自动停止本次检测。',
    '设备释放请求',
    {
      type: 'warning',
      confirmButtonText: '我知道了',
      closeOnClickModal: false,
      closeOnPressEscape: true,
      customClass: 'force-release-dialog',
    },
  )
    .catch(() => undefined)
    .finally(() => {
      forceReleaseDialogOpen.value = false
    })
}

function requestForcedReleaseStop(reason?: string, timeoutSeconds = 15) {
  showForceReleaseRequestDialog(reason)

  if (!isDetecting.value) {
    return
  }

  if (manualSwallowActive.value) {
    manualSwallowActive.value = false
    manualSwallowStartSec.value = null
    ElMessage.warning('已取消未完成的人工吞咽标注，并停止检测')
    void stopDetection({ force: true })
    return
  }

  if (manualSwallowResultPending.value) {
    forceReleasePending.value = true
    const waitMs = Math.max(timeoutSeconds, 5) * 1000
    cancelForceReleaseFallbackTimer()
    forceReleaseFallbackTimer = window.setTimeout(() => {
      if (forceReleasePending.value) {
        finalizeForcedReleaseStop('等待人工吞咽段分类超时，系统将释放设备')
      }
    }, waitMs)
    ElMessage.warning('正在等待当前人工吞咽段分类结果，完成后将自动释放设备')
    return
  }

  void stopDetection({ force: true })
}

function getCurrentRealtimeSecond() {
  const elapsed =
    startTime > 0 ? (performance.now() - startTime + totalElapsed) / 1000 : 0
  return +Math.max(
    latestRealtimeSeriesTime(),
    realtimeRenderCursorSec,
    elapsed,
    0
  ).toFixed(3)
}

async function syncSegmentationModeToBackend() {
  if (isFileMode.value || !currentDeviceId.value || !realtimeSessionId.value) {
    return
  }
  await setRealtimeSegmentationMode(
    currentDeviceId.value,
    manualSegmentationEnabled.value ? 'MANUAL' : 'AUTO'
  )
}

async function handleSegmentationModeChange() {
  manualSwallowActive.value = false
  manualSwallowStartSec.value = null
  manualSwallowSegments.value = []
  if (!isDetecting.value) {
    return
  }
  try {
    await syncSegmentationModeToBackend()
  } catch (e: any) {
    showMonitorNotice({
      title: '分割模式设置失败',
      message: e?.message || '无法同步实时分割模式，请检查后端服务状态。',
      type: 'warning',
    })
  }
}

async function handleManualSwallowClick() {
  if (!canUseManualSwallowButton.value) {
    ElMessage.warning(manualSwallowTooltip.value)
    return
  }

  const nowSec = getCurrentRealtimeSecond()
  if (!manualSwallowActive.value) {
    manualSwallowStartSec.value = nowSec
    manualSwallowActive.value = true
    ElMessage.success(`已标记吞咽开始：${nowSec.toFixed(2)}s`)
    return
  }

  const start = manualSwallowStartSec.value
  if (start == null) {
    manualSwallowActive.value = false
    ElMessage.warning('缺少吞咽起始点，请重新标记')
    return
  }

  const end = nowSec
  if (end <= start + 0.05) {
    ElMessage.warning('吞咽结束点需要晚于开始点')
    return
  }

  const segment = {
    start: +start.toFixed(3),
    end: +end.toFixed(3),
  }
  manualSwallowSegments.value.push(segment)
  manualSwallowActive.value = false
  manualSwallowStartSec.value = null
  markManualSwallowResultPending(segment)

  try {
    await submitManualSwallowSegment({
      deviceId: currentDeviceId.value,
      startSec: segment.start,
      endSec: segment.end,
    })
    showMonitorNotice({
      title: '人工吞咽段已提交',
      message: `${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s`,
      type: 'success',
      duration: 2500,
    })
  } catch (e: any) {
    clearManualSwallowResultPending()
    showMonitorNotice({
      title: '人工吞咽段提交失败',
      message: e?.message || '模型推理不会收到本次人工分割段，请重试。',
      type: 'error',
    })
  }
}

function resetUiInputs() {
  selectedSubjectType.value = ''
  selectedPatientId.value = ''
  selectedTask.value = ''
  taskManuallySelected.value = false
  selectedDevice.value = []
  pendingScreeningRecord.value = null
  screeningPromptShown.value = false
  pendingScreeningPdf.value = null
  screeningReportDownloaded.value = false
  archiveDialogVisible.value = false
  resetManualSwallowState(true)
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
  aspirationSegments = []
  dysphagiaEventRanges = []
  aspirationEventRanges = []
  fileSwallowSegments = []
  fileRiskSegments = []
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

function getConfigDialogTitle() {
  const titles = {
    imu: '三轴信号配置',
    gas: '鼻气流信号配置',
  }
  return titles[currentSignalType.value]
}

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

function setDefaultMapping(signalType: 'imu' | 'gas') {

  csvConfigForm.value = {
    sampleRate: 4000,
    imuAxisMap: { X: '', Y: '', Z: '' },
    gasCol: '',
  }

  if (signalType === 'imu') {
    csvConfigForm.value.sampleRate = 2000

    const headers = csvHeaders.value
    if (headers.includes('X')) csvConfigForm.value.imuAxisMap.X = 'X'
    if (headers.includes('Y')) csvConfigForm.value.imuAxisMap.Y = 'Y'
    if (headers.includes('Z')) csvConfigForm.value.imuAxisMap.Z = 'Z'
  } else if (signalType === 'gas') {
    csvConfigForm.value.sampleRate = 100

    const headers = csvHeaders.value
    if (headers.includes('value')) csvConfigForm.value.gasCol = 'value'
    else if (headers.includes('flow')) csvConfigForm.value.gasCol = 'flow'
    else if (headers.includes('gas')) csvConfigForm.value.gasCol = 'gas'
    else if (headers.length >= 2) csvConfigForm.value.gasCol = headers[1]
  }
}

function resetCsvConfigFormToDefaults() {
  setDefaultMapping(currentSignalType.value)
  nextTick(() => csvConfigFormRef.value?.clearValidate())
}

function clearRealtimeRunData() {
  resetRealtimeClock()

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
  aspirationSegments = []
  dysphagiaEventRanges = []
  aspirationEventRanges = []
  realtimeSwallowEventRanges = []
  resetManualSwallowState()
  resetRealtimeStats()
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
  clearRealtimeRunData()
  fileRiskSegments = []

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
  overlay: Record<string, unknown> = {},
  autoXAxis = false
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
    xAxis: autoXAxis ? createXAxisAuto() : createXAxis(start, end),
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
        ...overlay,
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
    ElMessage.warning(startTooltipContent.value || '给定必填项后才能开始检测')
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

  if (isFileMode.value) {
    isInitial.value = false
    startFileModeDetection()
    return
  }

  clearRealtimeRunData()
  renderEmptyCharts()
  checkRecordsSaved.value = false
  isInitial.value = false

  const primaryId = selectedDevice.value?.[0] || ''
  const primaryIp = deviceList.value.find((d) => d.id === primaryId)?.ip || ''

  if (!primaryId || !primaryIp) {

    ElMessage.error('请先选择在线设备（deviceId/deviceIp 不能为空）')
    return
  }

  let hasConnectedDevice = false
  try {
    if (selectedDevice.value.length === 0) {
      ElMessage.error('请先选择设备')
      return
    }

    const firstDeviceId = selectedDevice.value[0]

    const device = deviceList.value.find((d) => d.id === firstDeviceId)
    if (!device) {
      ElMessage.error(`设备不存在: ${firstDeviceId}`)
      return
    }

    ElMessage.info('正在连接设备...')

    const connectResult = await connectRealtimeDevice(
      primaryIp,
      primaryId,
      device.name || primaryId,
      selectedRuntimeSubjectId.value,
      selectedPatientName.value,
      selectedTask.value
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
    await syncSegmentationModeToBackend()

    await connectWebSocket(primaryId)

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

      }
    }

    realtimeSessionId.value = ''
    ElMessage.error(error?.message || '连接设备失败')
    isDetecting.value = false
  }
}

async function stopDetection(options: { force?: boolean } = {}) {
  if (!options.force && manualSwallowActive.value) {
    ElMessage.warning(stopTooltipContent.value)
    return
  }
  if (!options.force && manualSwallowResultPending.value) {
    ElMessage.warning(stopTooltipContent.value)
    return
  }
  cancelForceReleaseFallbackTimer()
  forceReleasePending.value = false

  if (isFileMode.value) {

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

  isDetecting.value = false
  hasStopped.value = true
  canReset.value = true
  checkRecordsSaved.value = false
  totalElapsed += performance.now() - startTime
  if (animationId != null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  preserveRealtimeReviewChartsAfterStop()

  disconnectWebSocket()

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

    } catch (error: any) {
      console.error('断开设备失败:', error)
    }
  }

  await finalizeAppointmentScreeningAfterDetection()
  preserveRealtimeReviewChartsAfterStop()
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

  unbindInsideZoomReset(imuChart)
  unbindInsideZoomReset(gasChart)
  unbindInsideZoomReset(audioChart)
  unbindInsideZoomReset(swallowChart)

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

const SIGNAL_GRID = { top: 48, bottom: 28, left: 52, right: 20 }
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
  end: number,
  overlay: Record<string, unknown> = {},
  autoXAxis = false
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
    xAxis: autoXAxis ? createXAxisAuto() : createXAxis(start, end),
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
        ...overlay,
      },
    ],
  }
}

function createSwallowOption(
  dysphagia: [number, number][],
  aspiration: [number, number][],
  start: number,
  end: number,
  overlay: Record<string, unknown> = {},
  autoXAxis = false
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
    xAxis: autoXAxis ? createXAxisAuto() : createXAxis(start, end),
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
        lineStyle: { width: 2, color: DYSPHAGIA_PROBABILITY_COLOR },
        data: dysphagia,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
        ...overlay,
      },
      {
        name: '误吸概率',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: ASPIRATION_PROBABILITY_COLOR },
        data: aspiration,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
    ],
  }
}

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
        lineStyle: { width: 2, color: ASPIRATION_PROBABILITY_COLOR },
        data: risk,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
      },
    ],
  }
}

function createSwallowRiskOptionFile(
  dysphagia: [number, number][],
  aspiration: [number, number][],
  swallowSegments: [number, number][],
  riskSegments: [number, number][]
): echarts.EChartsOption {
  const segmentMarkArea = createFileSegmentMarkArea(swallowSegments, riskSegments)

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
        lineStyle: { width: 2, color: DYSPHAGIA_PROBABILITY_COLOR },
        data: dysphagia,
        animation: false,
        sampling: 'lttb',
        progressive: 2000,
        progressiveThreshold: 3000,
        markArea: segmentMarkArea,
      },
      {
        name: '误吸概率',
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: ASPIRATION_PROBABILITY_COLOR },
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
  dataZ: [number, number][],
  swallowSegments: [number, number][] = [],
  riskSegments: [number, number][] = []
): echarts.EChartsOption {
  const segmentMarkArea = createFileSegmentMarkArea(swallowSegments, riskSegments)

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
        markArea: segmentMarkArea,
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
  data: [number, number][],
  swallowSegments: [number, number][] = [],
  riskSegments: [number, number][] = []
): echarts.EChartsOption {
  const segmentMarkArea = createFileSegmentMarkArea(swallowSegments, riskSegments)

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
        markArea: segmentMarkArea,
      },
    ],
  }
}

function applyManualSwallowOverlayToCharts(
  startShort: number,
  endShort: number,
  startLong: number,
  endLong: number
) {
  void startShort
  void endShort
  void startLong
  void endLong
  if (isFileMode.value) return
  const overlay = createRealtimeSegmentOverlay()
  if (!Object.keys(overlay).length) return
  const apply = (
    chart: echarts.ECharts,
    seriesCount: number,
    seriesOverlay: Record<string, unknown>
  ) => {
    chart.setOption(
      {
        series: Array.from({ length: seriesCount }, (_, idx) =>
          idx === 0 ? seriesOverlay : {}
        ),
      },
      { notMerge: false, silent: true }
    )
  }

  apply(imuChart, 3, overlay)
  apply(gasChart, 1, overlay)
  apply(audioChart, 1, overlay)
  apply(swallowChart, 2, overlay)
}

function currentRealtimeChartWindows() {
  const currentSec = +Math.max(
    realtimeRenderCursorSec,
    latestRealtimeSeriesTime(),
    getSeriesTailTime(dysphagiaRealtimeSeries),
    getSeriesTailTime(aspirationRealtimeSeries),
    0
  ).toFixed(3)
  const startShort = +Math.max(0, currentSec - durationShort).toFixed(3)
  const endShort = +(startShort + durationShort).toFixed(3)
  const startLong = +Math.max(0, currentSec - durationLong).toFixed(3)
  const endLong = +(startLong + durationLong).toFixed(3)
  return { startShort, endShort, startLong, endLong }
}

function refreshRealtimeProbabilityChartPreservingManualOverlay() {
  if (isFileMode.value || !swallowChart) return
  const { startShort, endShort, startLong, endLong } = currentRealtimeChartWindows()
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
  applyManualSwallowOverlayToCharts(startShort, endShort, startLong, endLong)
}

function latestRealtimeReviewTime(): number {
  const segmentEnd = Math.max(
    ...realtimeSwallowEventRanges.map(seg => seg.end),
    ...manualSwallowSegments.value.map(seg => seg.end),
    ...dysphagiaEventRanges.map(seg => seg.end),
    ...aspirationEventRanges.map(seg => seg.end),
    0
  )
  return Math.max(latestRealtimeSeriesTime(), realtimeRenderCursorSec, segmentEnd, 1)
}

function createReviewZoom(maxTime: number, windowSec: number) {
  const endValue = +Math.max(maxTime, windowSec).toFixed(3)
  const startValue = +Math.max(0, endValue - windowSec).toFixed(3)
  return [{ ...INSIDE_ZOOM, startValue, endValue }]
}

function renderRealtimeReviewCharts() {
  if (isFileMode.value || !imuChart || !gasChart || !audioChart || !swallowChart) return

  const maxTime = latestRealtimeReviewTime()
  const overlay = createRealtimeSegmentOverlay()
  const shortZoom = createReviewZoom(maxTime, durationShort)
  const longZoom = createReviewZoom(maxTime, durationLong)

  imuChart.setOption(
    {
      ...createImuXYZOption(
        imuSeries.X,
        imuSeries.Y,
        imuSeries.Z,
        0,
        maxTime,
        overlay,
        true
      ),
      dataZoom: shortZoom,
    },
    { notMerge: true }
  )
  gasChart.setOption(
    {
      ...createSingleOption('呼吸信号', gasSeries.value, 0, maxTime, overlay, true),
      dataZoom: shortZoom,
    },
    { notMerge: true }
  )
  audioChart.setOption(
    {
      ...createSingleOption('吞咽声音信号', audioSeries.value, 0, maxTime, overlay, true),
      dataZoom: shortZoom,
    },
    { notMerge: true }
  )
  swallowChart.setOption(
    {
      ...createSwallowOption(
        dysphagiaRealtimeSeries,
        aspirationRealtimeSeries,
        0,
        maxTime,
        overlay,
        true
      ),
      dataZoom: longZoom,
    },
    { notMerge: true }
  )

  bindInsideZoomReset(imuChart, maxTime)
  bindInsideZoomReset(gasChart, maxTime)
  bindInsideZoomReset(audioChart, maxTime)
  bindInsideZoomReset(swallowChart, maxTime)
}

function preserveRealtimeReviewChartsAfterStop() {
  renderRealtimeReviewCharts()
  requestAnimationFrame(() => renderRealtimeReviewCharts())
  window.setTimeout(() => renderRealtimeReviewCharts(), 120)
}

function finalizeForcedReleaseAfterPredictionRendered() {
  if (!forceReleasePending.value) return
  refreshRealtimeProbabilityChartPreservingManualOverlay()
  requestAnimationFrame(() => {
    refreshRealtimeProbabilityChartPreservingManualOverlay()
    window.setTimeout(() => {
      finalizeForcedReleaseStop('当前人工吞咽段分类已返回，系统将释放设备')
    }, 80)
  })
}

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
  const realtimeOverlay = createRealtimeSegmentOverlay()

  const swallowTailSec = Math.max(
    getSeriesTailTime(dysphagiaRealtimeSeries),
    getSeriesTailTime(aspirationRealtimeSeries)
  )
  if (swallowTailSec === 0 || swallowTailSec < tSec - 1.0) {
    const baselineSec = +Math.max(tSec, swallowTailSec + 0.001).toFixed(3)
    dysphagiaRealtimeSeries.push([baselineSec, 0])
    aspirationRealtimeSeries.push([baselineSec, 0])
  }

  capSeries(audioSeries.value, MAX_REALTIME_SIGNAL_POINTS)
  capSeries(dysphagiaRealtimeSeries, MAX_REALTIME_PROBABILITY_POINTS)
  capSeries(aspirationRealtimeSeries, MAX_REALTIME_PROBABILITY_POINTS)

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
          ...realtimeOverlay,
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
          ...realtimeOverlay,
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
          ...realtimeOverlay,
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
        endLong,
        realtimeOverlay
      ),
      ...AXIS_UPDATE_ANIM,
    },
    AXIS_UPDATE_SETOPTION
  )

  applyManualSwallowOverlayToCharts(startShort, endShort, startLong, endLong)

  animationId = requestAnimationFrame(frame)
}

async function startFileModeDetection() {
  if (!filePayloadReady.value || !isFilePayloadComplete()) {
    filePayloadReady.value = false
    ElMessage.warning('请先上传所有信号文件')
    return
  }

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

    const result: DetectionResponse = await uploadAndPredict(
      uploadedFiles.audio,
      uploadedFiles.imu,
      uploadedFiles.gas,
      patientId,
      patientName,
      selectedTask.value
    )

    fileDetectSessionId.value = result.sessionId || ''

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

    if (result.swallow_events && result.swallow_events.length > 0) {

      const maxTime = Math.max(
        imuSeries.X.at(-1)?.[0] || 0,
        imuSeries.Y.at(-1)?.[0] || 0,
        imuSeries.Z.at(-1)?.[0] || 0,
        gasSeries.value.at(-1)?.[0] || 0,
        audioSeries.value.at(-1)?.[0] || 0,
        10
      )

      const events = result.swallow_events.map(([start, end]) => [
        start / 1000,
        end / 1000,
      ])
      fileSwallowSegments = events.map(([start, end]) => [start, end])

      const totalEvents = result.swallow_events.length
      let dysphagiaCount = 0

      const aspirationEvents: { time: string; label: string }[] = []
      const dysphagiaEvents: { time: string; label: string }[] = []
      aspirationSegments = []
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
            dysphagiaEvents.push({
              time: `${start.toFixed(1)}s - ${end.toFixed(1)}s`,
              label: dys.label,
            })
            dysphagiaEventRanges.push({ start, end })
          }
        })
      }

      fileRiskSegments =
        selectedTask.value === 'dys'
          ? rangesToSegments(dysphagiaEventRanges)
          : rangesToSegments(aspirationEventRanges)
      renderFileModeCharts()

      swallowPlaybackRows = []
      const step = 0.05

      for (let t = 0; t <= maxTime; t = +(t + step).toFixed(2)) {

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

        let dysphagiaProb = 0
        let aspirationProb = 0

        if (inEvent && eventIndex >= 0) {

          if (result.dysphagia && result.dysphagia[eventIndex]) {
            dysphagiaProb = readClassOneProbability(result.dysphagia[eventIndex])
          }

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

      const base = createSwallowRiskOptionFile([], [], fileSwallowSegments, fileRiskSegments)
      swallowChart.setOption(
        { ...base, dataZoom: [{ ...INSIDE_ZOOM }] },
        { notMerge: true }
      )
      bindInsideZoomReset(swallowChart, maxTime)
      dysphagiaDisplaySeries = []
      aspirationDisplaySeries = []

      let idx = 0
      const batch = 5
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
          fileSwallowSegments,
          fileRiskSegments
        )
        swallowChart.setOption(
          { ...opt, dataZoom: [{ ...INSIDE_ZOOM }] },
          { notMerge: true }
        )

        if (idx >= swallowPlaybackRows.length) {
          if (swallowPlayTimer != null) {
            clearInterval(swallowPlayTimer)
            swallowPlayTimer = null
          }
        }
      }, 50)

      realtimeStats.totalSwallows = totalEvents
      realtimeStats.aspirationSwallows = aspirationEvents.length
      realtimeStats.dysphagiaSwallows = dysphagiaCount
      realtimeStats.hasDysphagia = dysphagiaCount > 0
      realtimeStats.normalSwallows = Math.max(
        totalEvents - Math.max(aspirationEvents.length, dysphagiaCount),
        0
      )

      if (selectedTask.value === 'asp' && aspirationEvents.length > 0) {
        const timeList = aspirationEvents.map((e) => e.time).join('、')
        showDetectionNotice({
          title: '危险提示',
          message: detectionNoticeSummary(totalEvents, '误吸提示', aspirationEvents.length, timeList),
          type: 'error',
          duration: 10000,
        })
      } else if (selectedTask.value === 'dys' && dysphagiaCount > 0) {
        const timeList = dysphagiaEvents.map((e) => e.time).join('、')
        showDetectionNotice({
          title: '筛查提示',
          message: detectionNoticeSummary(totalEvents, '吞咽障碍', dysphagiaCount, timeList),
          type: 'warning',
          duration: 8000,
        })
      } else {
        const negativeText = selectedTask.value === 'asp' ? '未提示误吸' : '未提示吞咽障碍'
        showDetectionNotice({
          title: '检测完成',
          message: `吞咽事件 ${totalEvents} 段，${negativeText}`,
          type: 'success',
          duration: 5000,
        })
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
}

type DeviceControlCommand = {
  type?: string
  reason?: string
  timeoutSeconds?: number
}

function handleDeviceControlCommand(command: DeviceControlCommand) {
  if (command?.type !== 'FORCE_RELEASE_REQUEST') {
    return
  }
  requestForcedReleaseStop(command.reason, command.timeoutSeconds)
}

function connectWebSocket(deviceId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {

      const socket = new SockJS(`${window.location.origin}/ws`)
      stompClient = new Client({
        webSocketFactory: () => socket as any,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          wsConnected.value = true

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

          stompClient?.subscribe(
            `/topic/device/${deviceId}/control`,
            (message: any) => {
              try {
                const command = JSON.parse(message.body)
                handleDeviceControlCommand(command)
              } catch (error) {
                console.error('解析设备控制指令失败:', error)
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

function disconnectWebSocket() {
  if (stompClient && wsConnected.value) {
    stompClient.deactivate()
    stompClient = null
    wsConnected.value = false
  }
}

function handleRealtimeImuData(data: {
  timestamp: number
  x: number
  y: number
  z: number
}) {
  const relativeTimeSec = normalizeRealtimeTimestamp('imu', data.timestamp, imuSeries.X)

  imuSeries.X.push([relativeTimeSec, data.x])
  imuSeries.Y.push([relativeTimeSec, data.y])
  imuSeries.Z.push([relativeTimeSec, data.z])

  const maxPoints = MAX_REALTIME_SIGNAL_POINTS
  if (imuSeries.X.length > maxPoints) {
    imuSeries.X.shift()
    imuSeries.Y.shift()
    imuSeries.Z.shift()
  }
}

function handleRealtimeGasData(data: { timestamp: number; flow: number }) {
  const relativeTimeSec = normalizeRealtimeTimestamp('gas', data.timestamp, gasSeries.value)

  gasSeries.value.push([relativeTimeSec, data.flow])

  const maxPoints = MAX_REALTIME_SIGNAL_POINTS
  if (gasSeries.value.length > maxPoints) {
    gasSeries.value.shift()
  }
}

function handleRealtimeAudioData(data: {
  timestamp: number
  amplitude: number
}) {
  const relativeTimeSec = normalizeRealtimeTimestamp('audio', data.timestamp, audioSeries.value)

  audioSeries.value.push([relativeTimeSec, data.amplitude])

  const maxPoints = MAX_REALTIME_SIGNAL_POINTS
  if (audioSeries.value.length > maxPoints) {
    audioSeries.value.shift()
  }
}

function handleRealtimePredictionResult(result: any) {

  const swallowEvents = result.swallowEvents || result.swallow_events

  if (result.message) {
    if (manualSwallowResultPending.value && swallowEvents?.length > 0) {
      clearManualSwallowResultPending({ deferForcedRelease: true })
    }
    showDetectionNotice({
      title: '预测结果',
      message: result.message,
      type: 'info',
      duration: 3000,
    })
    if (forceReleasePending.value && !swallowEvents?.length) {
      finalizeForcedReleaseStop('人工吞咽段分类未返回有效结果，系统将释放设备')
    }
    return
  }

  if (swallowEvents && swallowEvents.length > 0) {
    const shouldFinalizeForcedReleaseAfterRender =
      manualSwallowResultPending.value && forceReleasePending.value
    if (manualSwallowResultPending.value) {
      clearManualSwallowResultPending({
        deferForcedRelease: shouldFinalizeForcedReleaseAfterRender,
      })
    }

    const totalEvents = swallowEvents.length

    const currentRelativeTime = Math.max(
      latestRealtimeSeriesTime(),
      (performance.now() - startTime + totalElapsed) / 1000
    )

    const windowEndTime = currentRelativeTime
    realtimeRenderCursorSec = Math.max(realtimeRenderCursorSec, windowEndTime)

    const predictionWindowSec = Number(
      result.predictionWindowSeconds || result.prediction_window_seconds || 5
    )
    const PREDICTION_WINDOW_SEC = Number.isFinite(predictionWindowSec)
      ? Math.max(1, predictionWindowSec)
      : 5

    const events = swallowEvents.map(([start, end]: [number, number]) => [
      windowEndTime - (PREDICTION_WINDOW_SEC - start / 1000),
      windowEndTime - (PREDICTION_WINDOW_SEC - end / 1000),
    ])
    events.forEach(([start, end]: [number, number]) => {
      appendUniqueRange(realtimeSwallowEventRanges, { start, end })
    })

    let aspirationCount = 0
    let dysphagiaCount = 0
    const aspirationEvents: { time: string; label: string }[] = []

    if (result.aspiration) {
      result.aspiration.forEach((asp: any, idx: number) => {
        if (asp.predicted_class === 1 && events[idx]) {
          aspirationCount++
          const [start, end] = events[idx]
          aspirationEvents.push({
            time: `${start.toFixed(1)}s - ${end.toFixed(1)}s`,
            label: asp.label,
          })
          appendUniqueRange(aspirationEventRanges, { start, end })
        }
      })
    }

    if (result.dysphagia) {
      result.dysphagia.forEach((dys: any, idx: number) => {
        if (dys.predicted_class === 1 && events[idx]) {
          const [start, end] = events[idx]
          dysphagiaCount++
          appendUniqueRange(dysphagiaEventRanges, { start, end })
        }
      })
    }

    realtimeStats.totalSwallows += totalEvents
    realtimeStats.aspirationSwallows += aspirationCount
    realtimeStats.dysphagiaSwallows += dysphagiaCount

    if (dysphagiaCount > 0) {
      realtimeStats.hasDysphagia = true
    }

    realtimeStats.normalSwallows =
      realtimeStats.totalSwallows -
      Math.max(
        realtimeStats.aspirationSwallows,
        realtimeStats.dysphagiaSwallows
      )

    events.forEach(([start, end]: [number, number], idx: number) => {

      let dysphagiaProb = 0
      if (result.dysphagia && result.dysphagia[idx]) {
        dysphagiaProb = readClassOneProbability(result.dysphagia[idx])
      }

      let aspirationProb = 0
      if (result.aspiration && result.aspiration[idx]) {
        aspirationProb = readClassOneProbability(result.aspiration[idx])
      }

      while (
        dysphagiaRealtimeSeries.length > 0 &&
        dysphagiaRealtimeSeries[dysphagiaRealtimeSeries.length - 1][0] >=
          start - 0.2
      ) {
        dysphagiaRealtimeSeries.pop()
        aspirationRealtimeSeries.pop()
      }

      dysphagiaRealtimeSeries.push([start - 0.1, 0])
      aspirationRealtimeSeries.push([start - 0.1, 0])

      const step = 0.1
      for (let t = start; t <= end; t = +(t + step).toFixed(3)) {

        dysphagiaRealtimeSeries.push([t, dysphagiaProb])

        aspirationRealtimeSeries.push([t, aspirationProb])
      }

      dysphagiaRealtimeSeries.push([end + 0.1, 0])
      aspirationRealtimeSeries.push([end + 0.1, 0])
    })

    if (selectedTask.value === 'asp' && aspirationCount > 0) {
      const timeList = aspirationEvents.map((e) => e.time).join('、')
      showDetectionNotice({
        title: '危险提示',
        message: detectionNoticeSummary(totalEvents, '误吸提示', aspirationCount, timeList),
        type: 'error',
        duration: 8000,
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
      showDetectionNotice({
        title: '预测结果',
        message: `吞咽事件：${totalEvents} 段；${negativeText}`,
        type: 'success',
        duration: 3000,
      })
    }
    if (shouldFinalizeForcedReleaseAfterRender || forceReleasePending.value) {
      finalizeForcedReleaseAfterPredictionRendered()
    }
  }
}

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (hasPendingReport.value || hasPendingScreeningRecord.value) {

    e.preventDefault()

    e.returnValue = ''
  }

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

  loading.value = false

  window.addEventListener('beforeunload', handleBeforeUnload)
})

async function deleteAllServerTempFiles() {
  for (const id of Array.from(allTempIds.value)) {
    try {
      await deleteTempFileApi(id)
    } catch {

    }
  }
  allTempIds.value.clear()
  currentTempId.value = null
  owner.audio = owner.gas = null
  owner.imu.X = owner.imu.Y = owner.imu.Z = null
}

async function maybeDeleteServerFile(id: string | null) {
  if (!id) return
  const still = usingIds()
  if (still.has(id)) {

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
  }
  await submitCsvMapping(currentTempId.value, payload)

  currentTempId.value = null
}

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

  currentSignalType.value = signalType

  const reader = new FileReader()
  reader.onload = async (e) => {
    const csvText = e.target?.result as string
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
    const headers = parsed.meta.fields || []

    if (!validateColumnCount(signalType, headers)) {

      clearUploadFileList(signalType)
      return
    }

    try {
      await uploadTempCsvToServer(raw)
    } catch {
      clearUploadFileList(signalType)
      return
    }

    if (signalType === 'imu') {
      uploadedFiles.imu = raw
    } else if (signalType === 'gas') {
      uploadedFiles.gas = raw
    }

    rawCsvData.value = parsed.data as any[]
    csvHeaders.value = headers
    csvPreviewData.value = (parsed.data as any[]).slice(0, 5)

    setDefaultMapping(signalType)

    csvConfigDialogVisible.value = true
  }
  reader.readAsText(raw)
}

const handleImuCsvChange = (file: UploadFile) => handleCsvSelect(file, 'imu')
const handleGasCsvChange = (file: UploadFile) => handleCsvSelect(file, 'gas')

function clearUploadFileList(signalType: 'imu' | 'gas') {
  const uploadRef =
    signalType === 'imu' ? imuUploadRef.value : gasUploadRef.value

  if (uploadRef) {
    uploadRef.clearFiles()
  }
}

const handleAudioSelect = async (file: UploadFile) => {
  const raw = file.raw
  if (!raw) return

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

    const arrayBuffer = await raw.arrayBuffer()
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate
    const duration = audioBuffer.duration

    const downsampleRate = Math.max(1, Math.floor(sampleRate / 50))
    const audioData: [number, number][] = []

    for (let i = 0; i < channelData.length; i += downsampleRate) {
      const time = i / sampleRate
      audioData.push([+time.toFixed(3), channelData[i]])
    }

    audioSeries.value = audioData

    uploadedFiles.audio = raw
    filePayloadReady.value = false
    clearFileDetectionOutcome()
    canReset.value = hasAnyFileSignal()

    renderFileModeCharts()

    ElMessage.success(
      `音频文件加载成功（时长: ${duration.toFixed(
        2
      )}秒，采样率: ${sampleRate}Hz）`
    )

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

  const { sampleRate, imuAxisMap, gasCol } = csvConfigForm.value
  const timeStep = 1 / sampleRate

  if (currentSignalType.value === 'imu') {

    const downsampleRate = Math.max(1, Math.floor(sampleRate / 50))

    Object.entries(imuAxisMap).forEach(([axis, col]) => {
      if (!col) return
      const axisKey = axis as 'X' | 'Y' | 'Z'

      const seriesData: [number, number][] = []
      for (let i = 0; i < rawCsvData.value.length; i += downsampleRate) {
        seriesData.push([+(i * timeStep).toFixed(3), +rawCsvData.value[i][col]])
      }

      imuSeries[axisKey] = seriesData
      imuAxisUsed.value[axisKey] = true
    })

    if (currentTempId.value) {
      const cid = currentTempId.value
      if (imuAxisMap.X) owner.imu.X = cid
      if (imuAxisMap.Y) owner.imu.Y = cid
      if (imuAxisMap.Z) owner.imu.Z = cid
    }
  } else if (currentSignalType.value === 'gas') {

    gasSeries.value = gasCol
      ? rawCsvData.value.map((row, idx) => [
          +(idx * timeStep).toFixed(3),
          +row[gasCol],
        ])
      : []

    if (currentTempId.value && gasCol) {
      owner.gas = currentTempId.value
    }
  }

  renderFileModeCharts()

  await submitCsvMappingToServer()

  checkAllSignalsReady()

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

  {
    const base = createImuXYZOptionFile(
      imuSeries.X,
      imuSeries.Y,
      imuSeries.Z,
      fileSwallowSegments,
      fileRiskSegments
    )
    imuChart.setOption(
      { ...base, grid: base.grid, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true }
    )
    bindInsideZoomReset(imuChart, maxTime)
  }
  {
    const base = createSingleOptionFile(
      '呼吸信号',
      gasSeries.value,
      fileSwallowSegments,
      fileRiskSegments
    )
    gasChart.setOption(
      { ...base, grid: base.grid, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true }
    )
    bindInsideZoomReset(gasChart, maxTime)
  }
  {
    const base = createSingleOptionFile(
      '吞咽声音信号',
      audioSeries.value,
      fileSwallowSegments,
      fileRiskSegments
    )
    audioChart.setOption(
      { ...base, grid: base.grid, dataZoom: [{ ...INSIDE_ZOOM }] },
      { notMerge: true }
    )
    bindInsideZoomReset(audioChart, maxTime)
  }
}

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

    const idsToCheck = new Set<string>()
    if (imuSeries.X.length && owner.imu.X) idsToCheck.add(owner.imu.X)
    if (imuSeries.Y.length && owner.imu.Y) idsToCheck.add(owner.imu.Y)
    if (imuSeries.Z.length && owner.imu.Z) idsToCheck.add(owner.imu.Z)

    imuSeries.X = []
    imuSeries.Y = []
    imuSeries.Z = []
    imuAxisUsed.value = { X: false, Y: false, Z: false }

    owner.imu.X = owner.imu.Y = owner.imu.Z = null
    invalidateFilePayloadAfterSourceChange('imu')

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

  renderFileModeCharts()
}

watch(isFileMode, async (newVal, oldVal) => {
  if (modeGuard.value) return

  try {
    await ElMessageBox.confirm(
      '切换模式会清空当前页面的所有数据，是否继续？',
      '确认切换',
      { confirmButtonText: '继续', cancelButtonText: '取消', type: 'warning' }
    )

    await resetAllState()
    if (!newVal && hasChartStarted.value) initCharts()
  } catch (error : any) {
    fileDetectSessionId.value = ''

    if (error === 'cancel' || error === 'close') {

      modeGuard.value = true
      await nextTick()
      isFileMode.value = oldVal
      await nextTick()
      modeGuard.value = false
    } else {

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
  width: min(1304px, calc(100vw - 260px));
  max-width: 100%;
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

.action-button-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.start-button-wrapper,
.stop-button-wrapper {
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

.subject-select,
.device-select {
  flex: 1 1 0;
  min-width: 0;
}

.task-select,
.subject-type-select {
  flex: 0 0 160px;
}

.subject-empty {
  padding: 10px 0 14px;
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
  align-items: center;
  gap: 8px;
}
.upload-btn {
  margin-right: 8px;
}

.segmentation-mode-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4b5563;
  font-size: 13px;
  white-space: nowrap;
}

.chart-header-divider {
  align-self: stretch;
  height: auto;
  margin: 0 4px;
}

.manual-swallow-wrapper {
  display: inline-flex;
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
  flex-direction: column;
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

.force-release-dialog {
  width: 440px;
  max-width: calc(100vw - 40px);
  border-radius: 8px;
  padding: 18px 20px 16px;
}

.force-release-dialog .el-message-box__header {
  padding-bottom: 10px;
}

.force-release-dialog .el-message-box__title {
  font-size: 18px;
  font-weight: 700;
}

.force-release-dialog .el-message-box__content {
  color: #374151;
  font-size: 15px;
  line-height: 1.7;
}
</style>
