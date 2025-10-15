<template>
  <div class="data-container">
    <!-- 控制台 -->
    <el-card class="card console-card" shadow="hover">
      <template #header>
        <div class="card-header">患者数据管理控制台</div>
      </template>

      <!-- 第一行：可过滤多选 -->
      <div class="console-row">
        <el-select-v2
          v-model="selectedPatients"
          filterable
          :filter-method="handleFilterPatients"
          multiple
          collapse-tags
          :max-collapse-tags="8"
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

      <!-- 第二行：其他条件与按钮 -->
      <div class="console-row">
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
    </el-card>

    <!-- 用户卡片分页 -->
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
            <div class="card-filters">
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
                  @click="() => onExportSinglePatient(patient.name)"
                >
                  <el-icon style="margin-right: 4px"><Download /></el-icon>
                  批量导出
                </el-button>
              </div>
            </div>

            <div class="card-files">
              <div class="file-section">
                <template v-if="getFilteredFilesByDate(patient).length > 0">
                  <div
                    v-for="(group, gIdx) in getFilteredFilesByDate(patient)"
                    :key="gIdx"
                    class="file-group"
                  >
                    <div class="file-date-label">
                      <el-icon class="file-date-icon"><FolderOpened /></el-icon>
                      {{ group.date }}
                    </div>
                    <div class="file-grid">
                      <div
                        v-for="(file, i) in group.files"
                        :key="i"
                        class="file-cell"
                      >
                        <el-tooltip
                          :content="file.name"
                          placement="top"
                          effect="dark"
                          :show-after="300"
                        >
                          <span class="file-name">{{ file.name }}</span>
                        </el-tooltip>
                        <el-button
                          size="small"
                          text
                          type="primary"
                          @click="() => onDownload(patient.name, file.name)"
                        >
                          下载
                        </el-button>
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

    <!-- 分页器 -->
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
import { ref, computed, reactive, watchEffect, watch } from 'vue'
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
import { fileData } from '@/mock/FileData'
import type { PatientFile } from '@/mock/FileData'

// 1. 搜索条件
const searchId = ref('')
const searchName = ref('')
const searchFile = ref('')
const searchDate = ref<Date | null>(null)
const fileTypes = ref<string[]>([])

// 2. 分页
const page = ref(1)
const pageSize = 3

// 3. 所有患者选项（原始）
const patientOptions = fileData.map((p) => ({
  value: p.id,
  label: `${p.name} (${p.id})`,
}))

// 4. 已选患者 & 全选控制
const selectedPatients = ref<string[]>([])
const checkAllPatients = ref(false)
const indeterminatePatients = ref(false)

// 5. 当前 el-select 输入框的搜索关键词
const currentQuery = ref('')

// 6. 实时计算当前匹配的选项（用于判断“全选”状态）
const matchedOptions = computed(() => {
  const lower = currentQuery.value.toLowerCase()
  return patientOptions.filter((opt) => opt.label.toLowerCase().includes(lower))
})

// 7. 监听 selectedPatients + currentQuery 变化自动更新 check 状态
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

// 8. 自定义过滤方法：只记录输入值，匹配逻辑在 matchedOptions 中完成
const handleFilterPatients = (query: string) => {
  currentQuery.value = query
}

// 9. “全选”逻辑（只选当前 view 中匹配的项）
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

// 10. 每个患者的独立筛选条件
const patientFilters: Record<
  string,
  {
    searchDate: Date | null
    searchFile: string
    fileTypes: string[]
  }
> = reactive({})

watchEffect(() => {
  for (const patient of fileData) {
    if (!patientFilters[patient.id]) {
      patientFilters[patient.id] = {
        searchDate: null,
        searchFile: '',
        fileTypes: [],
      }
    }
  }
})

// 11. 卡片内部文件过滤逻辑
function getFilteredFilesByDate(patient: PatientFile) {
  const filter = patientFilters[patient.id]
  if (!filter) return []

  const { searchDate, searchFile, fileTypes } = filter
  const result: { date: string; files: { name: string; type: string }[] }[] = []

  for (const folder of patient.dates) {
    const matchDate =
      !searchDate ||
      new Date(folder.date).toDateString() === searchDate.toDateString()
    if (!matchDate) continue

    const matchedFiles = folder.files.filter((file) => {
      const matchName = !searchFile || file.name.includes(searchFile)
      const matchType = fileTypes.length === 0 || fileTypes.includes(file.type)
      return matchName && matchType
    })

    if (matchedFiles.length > 0) {
      result.push({ date: folder.date, files: matchedFiles })
    }
  }

  return result
}

// 12. 控制台过滤数据（基于 searchXXX 条件）
const filteredData = computed(() => {
  return fileData
    .filter((patient) => {
      // ⭐ 关键修改：如果 selectedPatients 非空，只保留被选中的患者
      if (
        selectedPatients.value.length > 0 &&
        !selectedPatients.value.includes(patient.id)
      ) {
        return false
      }
      return true
    })
    .map((patient) => {
      const matchId = !searchId.value || patient.id.includes(searchId.value)
      const matchName =
        !searchName.value || patient.name.includes(searchName.value)
      if (!matchId || !matchName) return null

      const hasNoRecords = patient.dates.length === 0
      const hasFilters =
        searchDate.value || searchFile.value || fileTypes.value.length > 0
      if (hasNoRecords) {
        return hasFilters ? null : { ...patient, dates: [] }
      }

      const filteredDates = patient.dates
        .map((d) => {
          const matchDate =
            !searchDate.value ||
            new Date(d.date).toDateString() === searchDate.value.toDateString()

          const matchedFiles = d.files.filter(
            (f) =>
              (!searchFile.value || f.name.includes(searchFile.value)) &&
              (fileTypes.value.length === 0 ||
                fileTypes.value.includes(f.type)),
          )

          return matchDate && matchedFiles.length > 0
            ? { date: d.date, files: matchedFiles }
            : null
        })
        .filter(Boolean)

      return filteredDates.length > 0
        ? { ...patient, dates: filteredDates }
        : null
    })
    .filter(Boolean) as PatientFile[]
})

// 13. 分页数据
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

// 14. 下载与导出
function onDownload(user: string, file: string) {
  ElMessage.success(`模拟下载：${user} 的 ${file}`)
}

function onExportAll() {
  ElMessage.success('模拟导出：当前筛选结果中的所有文件')
}

function onExportSinglePatient(user: string) {
  ElMessage.success(`模拟导出：${user} 卡片内部筛选文件`)
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
  width: 1304px;
  margin-bottom: 24px;
}

.console-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.console-item {
  flex: 1 1 200px;
}

.console-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.console-full {
  flex: 1 1 100%;
}

.console-item {
  flex: 1 1 200px;
  min-width: 160px;
}

.export-btn {
  flex: 0 0 auto;
}

.card-grid {
  width: 1304px;
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
  padding-right: 4px; /* 避免滚动条遮挡内容 */
}

.patient-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.patient-controls .el-button {
  min-width: 80px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 16px;
}

.file-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fafafa;
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
  gap: 10px;
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
  gap: 16px;
}

.file-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-date-label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.file-date-icon {
  margin-right: 6px;
  vertical-align: middle;
}
</style>
