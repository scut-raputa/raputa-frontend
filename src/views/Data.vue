<template>
  <div class="data-container">

    <el-card class="card console-card" shadow="hover">
      <template #header>
        <div class="card-header">患者数据管理控制台</div>
      </template>

      <div class="toolbar-panel data-console-toolbar">

        <div class="console-row patient-picker-row">
          <el-select-v2
            v-model="selectedPatients"
            filterable
            :filter-method="handleFilterPatients"
            multiple
            collapse-tags
            :max-collapse-tags="5"
            size="small"
            :options="patientOptions"
            placeholder="请选择指定的患者"
            class="console-full"
            clearable
            teleported
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>

            <template #header>
              <el-checkbox
                v-model="checkAllPatients"
                :indeterminate="indeterminatePatients"
                @change="handleCheckAllPatients"
              >
                全选患者
              </el-checkbox>
            </template>
          </el-select-v2>
        </div>

        <div class="console-row console-filter-row">
          <el-input
            v-model="searchId"
            placeholder="搜索患者 ID"
            size="small"
            clearable
            class="console-item"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-input
            v-model="searchName"
            placeholder="搜索患者姓名"
            size="small"
            clearable
            class="console-item"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-date-picker
            v-model="searchDate"
            type="date"
            placeholder="请选择日期"
            size="small"
            clearable
            class="console-item"
          >
            <template #prefix>
              <el-icon><Calendar /></el-icon>
            </template>
          </el-date-picker>

          <el-select
            v-model="fileTypes"
            multiple
            placeholder="请选择文件类型"
            size="small"
            clearable
            class="console-item"
          >
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
            <el-option label="csv" value="csv" />
            <el-option label="wav" value="wav" />
            <el-option label="pdf" value="pdf" />
          </el-select>

          <el-input
            v-model="searchFile"
            placeholder="搜索文件名"
            size="small"
            clearable
            class="console-item"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-button
            type="primary"
            size="small"
            class="export-btn"
            dark
            @click="onExportAll"
          >
            <el-icon style="margin-right: 4px"><Download /></el-icon>
            批量导出
          </el-button>
        </div>
      </div>
    </el-card>

    <div class="card-grid">
      <template v-if="paginatedData.length > 0">
        <el-card
          v-for="patient in paginatedData"
          :key="patient.name"
          class="card patient-card"
          shadow="hover"
        >
          <template #header>
            <div class="card-header">
              <div>{{ patient.name }}</div>
              <div style="font-size: 13px; font-weight: normal; color: #888">
                患者 ID: {{ patient.id }}
              </div>
            </div>
          </template>

          <div class="card-content">
            <div class="toolbar-panel card-filters">
              <div class="patient-controls-row">
                <el-date-picker
                  v-model="patientFilters[patient.id].searchDate"
                  type="date"
                  size="small"
                  placeholder="请选择日期"
                  clearable
                  class="filter-date"
                />
                <el-select
                  v-model="patientFilters[patient.id].fileTypes"
                  multiple
                  size="small"
                  placeholder="请选择文件类型"
                  clearable
                  class="filter-type"
                >
                  <template #prefix>
                    <el-icon><Document /></el-icon>
                  </template>
                  <el-option label="csv" value="csv" />
                  <el-option label="wav" value="wav" />
                  <el-option label="pdf" value="pdf" />
                </el-select>
              </div>

              <div class="patient-controls-row">
                <el-input
                  v-model="patientFilters[patient.id].searchFile"
                  size="small"
                  placeholder="搜索文件名"
                  clearable
                  class="file-search-input"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-button
                  type="primary"
                  size="small"
                  dark
                  @click="() => onExportSinglePatient(patient.name, patient.id)"
                >
                  <el-icon style="margin-right: 4px"><Download /></el-icon>
                  批量导出
                </el-button>
              </div>
            </div>

            <div class="card-files">
              <div class="file-section">
                <template v-if="getFilteredGroupsByDate(patient).length > 0">
                  <div
                    v-for="(group, gIdx) in getFilteredGroupsByDate(patient)"
                    :key="gIdx"
                    class="file-group"
                  >
                    <div class="file-date-label">
                      <el-icon class="file-date-icon"><FolderOpened /></el-icon>
                      {{ group.date }}
                    </div>

                    <div
                      v-for="(slot, sIdx) in group.slots"
                      :key="sIdx"
                      class="time-slot"
                    >
                      <div class="time-slot-title">
                        <span class="tree-branch">
                          {{ sIdx === group.slots.length - 1 ? '└──' : '├──' }}
                        </span>
                        <span>时间：{{ slot.time }}</span>
                      </div>
                      <div class="file-list">
                        <div v-for="(file, i) in slot.files" :key="i" class="file-cell">
                          <span class="tree-branch file-branch">
                            {{ i === slot.files.length - 1 ? '└──' : '├──' }}
                          </span>
                          <el-tooltip :content="file.name" placement="top" effect="dark" :show-after="300">
                            <span class="file-name">{{ file.name }}</span>
                          </el-tooltip>
                          <el-button
                            size="small"
                            text
                            type="primary"
                            @click="() => onDownload(file.name, file.id)"
                          >
                            下载
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <el-empty :image-size="130" description="无匹配文件" />
                </template>
              </div>
            </div>
          </div>
        </el-card>
      </template>
      <template v-else>
        <div class="empty-wrapper">
          <el-empty description="暂无符合条件的患者数据" />
        </div>
      </template>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="filteredData.length"
        background
        layout="prev, pager, next"
        @current-change="(val: number) => (page = val)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watchEffect, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { CheckboxValueType } from 'element-plus'
import {
  User,
  Calendar,
  Document,
  Download,
  Search,
  FolderOpened,
} from '@element-plus/icons-vue'
import axios from 'axios'

type FileItem = { id: string; name: string; type: string }
type TimeGroup = { time: string; files: FileItem[] }                // HH:mm:ss
type DateGroup = { date: string; slots: TimeGroup[] }               // yyyy-MM-dd
type PatientFiles = { id: string; name: string; dates: DateGroup[] }

const searchId = ref('')
const searchName = ref('')
const searchFile = ref('')
const searchDate = ref<Date | null>(null)
const fileTypes = ref<string[]>([])

const page = ref(1)
const pageSize = 3

const patientOptions = ref<{ value: string; label: string }[]>([])

const allData = ref<PatientFiles[]>([])

const selectedPatients = ref<string[]>([])
const checkAllPatients = ref(false)
const indeterminatePatients = ref(false)

async function fetchPatients() {
  const { data } = await axios.get('/api/patient', { params: { page: 1, size: 1000 } })
  const items = data?.data?.items ?? []
  patientOptions.value = items.map((x: any) => ({
    value: String(x.id),
    label: `${x.name} (${x.id})`,
  }))
}

async function fetchOverview() {
  const params: any = {}
  if (searchDate.value) {
    const d = searchDate.value
    params.date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }
  if (selectedPatients.value.length) params.patientIds = selectedPatients.value.join(',')
  if (fileTypes.value.length) params.types = fileTypes.value.join(',')
  if (searchFile.value) params.filename = searchFile.value

  const { data } = await axios.get('/api/patient-file/overview', { params })
  allData.value = data?.data ?? []
}

onMounted(async () => {
  await fetchPatients()
  await fetchOverview()
})

watch([selectedPatients, searchDate, fileTypes, searchFile], () => {
  fetchOverview().catch(() => {})
})

const currentQuery = ref('')

const matchedOptions = computed<{ value: string; label: string }[]>(() => {
  const lower = currentQuery.value.toLowerCase()
  const list = patientOptions.value ?? []
  return list.filter((opt: { value: string; label: string }) =>
    opt.label.toLowerCase().includes(lower)
  )
})

watch([selectedPatients, matchedOptions], () => {
  const selectedInView = matchedOptions.value.filter((opt) =>
    selectedPatients.value.includes(opt.value),
  )

  if (selectedInView.length === 0) {
    checkAllPatients.value = false
    indeterminatePatients.value = false
  } else if (selectedInView.length === matchedOptions.value.length) {
    checkAllPatients.value = true
    indeterminatePatients.value = false
  } else {
    checkAllPatients.value = false
    indeterminatePatients.value = true
  }
})

const handleFilterPatients = (query: string) => {
  currentQuery.value = query
}

const handleCheckAllPatients = (val: CheckboxValueType) => {
  indeterminatePatients.value = false
  if (val) {
    selectedPatients.value = Array.from(
      new Set([
        ...selectedPatients.value,
        ...matchedOptions.value.map((opt) => opt.value),
      ]),
    )
  } else {
    selectedPatients.value = selectedPatients.value.filter(
      (v) => !matchedOptions.value.some((opt) => opt.value === v),
    )
  }
}

const patientFilters: Record<
  string,
  {
    searchDate: Date | null
    searchFile: string
    fileTypes: string[]
  }
> = reactive({})

watchEffect(() => {
  for (const patient of allData.value) {
    if (!patientFilters[patient.id]) {
      patientFilters[patient.id] = { searchDate: null, searchFile: '', fileTypes: [] }
    }
  }
})

function getFilteredGroupsByDate(patient: PatientFiles) {
  const filter = patientFilters[patient.id]
  if (!filter) return []

  const { searchDate, searchFile, fileTypes } = filter
  const res: { date: string; slots: { time: string; files: FileItem[] }[] }[] = []

  for (const group of patient.dates) {
    const matchDate =
      !searchDate ||
      new Date(group.date).toDateString() === searchDate.toDateString()
    if (!matchDate) continue

    const slots = group.slots
      .map(slot => {
        const matchedFiles = slot.files.filter(file => {
          const matchName = !searchFile || file.name.includes(searchFile)
          const matchType = fileTypes.length === 0 || fileTypes.includes(file.type)
          return matchName && matchType
        })
        return { time: slot.time, files: matchedFiles }
      })
      .filter(s => s.files.length > 0)

    if (slots.length > 0) {
      res.push({ date: group.date, slots })
    }
  }

  return res
}

const filteredData = computed(() => {
  return allData.value
    .filter((patient) => {
      if (selectedPatients.value.length > 0 && !selectedPatients.value.includes(patient.id)) {
        return false
      }
      if (searchId.value && !patient.id.includes(searchId.value)) return false
      if (searchName.value && !patient.name.includes(searchName.value)) return false
      return true
    })
})

const paginatedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

watchEffect(() => {
  const totalPages = Math.ceil(filteredData.value.length / pageSize)
  if (page.value > totalPages) {
    page.value = 1
  }
})

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function onDownload(fileName: string, fileId: string) {
  try {
    const { data } = await axios.get('/api/download/file', {
      params: { fileId },
      responseType: 'blob',
    })
    saveBlob(data, fileName)
  } catch (e: any) {
    ElMessage.error('下载失败')
  }
}

async function onExportSinglePatient(user: string, patientId: string) {
  try {
    const f = patientFilters[patientId]
    const payload: any = {
      patientId,
      types: f.fileTypes?.length ? f.fileTypes : undefined,
      filenameLike: f.searchFile || undefined,
    }
    if (f.searchDate) {
      const d = f.searchDate
      payload.date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    }

    const { data } = await axios.post('/api/download/patient-zip', payload, { responseType: 'blob' })
    const zipName = `patient_${patientId}_${payload.date ?? 'all'}.zip`
    saveBlob(data, zipName)
    ElMessage.success(`已导出 ${user} 的打包文件`)
  } catch (e: any) {
    ElMessage.error('导出失败')
  }
}

async function onExportAll() {
  try {
    const payload: any = {
      patientIds: selectedPatients.value.length ? selectedPatients.value : undefined,
      types: fileTypes.value.length ? fileTypes.value : undefined,
      filenameLike: searchFile.value || undefined,
    }
    if (searchDate.value) {
      const d = searchDate.value
      payload.date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    }

    const { data } = await axios.post('/api/download/all-zip', payload, { responseType: 'blob' })
    const zipName = `export_${payload.date ?? 'all'}.zip`
    saveBlob(data, zipName)
    ElMessage.success('已导出打包文件')
  } catch (e: any) {
    ElMessage.error('导出失败')
  }
}
</script>

<style scoped>
.data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
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

.console-card {
  width: min(1304px, calc(100vw - 260px));
  max-width: 100%;
  margin-bottom: 24px;
}

.console-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.console-item {
  width: 100% !important;
  min-width: 160px;
}

.console-row {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.data-console-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-console-toolbar .console-row {
  margin-bottom: 0;
}

.patient-picker-row {
  grid-template-columns: 1fr;
}

.console-filter-row {
  grid-template-columns: repeat(5, minmax(0, 1fr)) max-content;
}

.console-full {
  width: 100%;
}

.export-btn {
  align-self: center;
}

.card-grid {
  width: min(1304px, calc(100vw - 260px));
  max-width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(408px, 1fr));
  gap: 20px;
  margin-bottom: 16px;
  min-height: 480px;
  position: relative;
}

.patient-card {
  max-height: 480px;
  display: flex;
  flex-direction: column;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-filters {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.card-files {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 4px;
}

.patient-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.patient-controls .el-button {
  min-width: 80px;
}

.file-cell {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  border: none;
  background-color: transparent;
  min-width: 0;
}

.file-name {
  font-family: monospace;
  font-size: 13px;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.empty-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  grid-column: 1 / -1;
  height: 480px;
}

.patient-controls-row {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.filter-date {
  width: 20%;
  min-width: 120px;
}

.filter-type {
  width: 80%;
  min-width: 200px;
}

.file-search-input {
  flex: 3;
}

.file-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.file-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-date-label {
  display: flex;
  align-items: center;
  height: 24px;
  font-weight: 600;
  color: #4b5563;
  font-size: 14px;
  margin-bottom: 6px;
}

.file-date-icon {
  margin-right: 8px;
  flex-shrink: 0;
}

.time-slot {
  margin: 0 0 10px 0;
  padding-left: 20px;
}

.time-slot-title {
  display: flex;
  align-items: center;
  color: #5f6b7a;
  font-size: 13px;
  margin: 0 0 4px 0;
  line-height: 24px;
}

.tree-branch {
  flex: 0 0 34px;
  width: 34px;
  color: #9aa3af;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  letter-spacing: 0;
  white-space: pre;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: 34px;
}

.file-branch {
  color: #c0c4cc;
}

.file-cell :deep(.el-button) {
  padding: 0 2px;
}
@media (max-width: 1200px) {
  .console-filter-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
