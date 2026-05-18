<template>
  <div class="model-container">
    <div class="grid-wrapper">
      <el-card shadow="hover" class="stat-card stat-card-service">
        <div class="stat-head">
          <div class="stat-icon">
            <el-icon><Cpu /></el-icon>
          </div>
          <div class="stat-title">推理服务状态</div>
        </div>
        <div class="stat-main">
          <el-tag :type="serviceStatusTag" size="large" effect="light">{{ serviceStatusText }}</el-tag>
        </div>
        <div class="stat-sub">最近探活：{{ formatDateTime(runtimeSummary.lastHealthCheckAt) }}</div>
        <div class="service-status-strip">
          <div class="service-status-pill">
            <el-icon><CircleCheck /></el-icon>
            <span>探活</span>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="stat-card stat-card-load">
        <div class="stat-head">
          <div class="stat-icon">
            <el-icon><Files /></el-icon>
          </div>
          <div class="stat-title">模型加载概览</div>
        </div>
        <el-statistic :value="runtimeSummary.loadedModelCount" class="stat-number">
          <template #suffix>/ {{ runtimeSummary.discoveredModelCount }}</template>
        </el-statistic>
        <div class="stat-sub">已加载模型 / 发现模型</div>
        <el-progress :percentage="loadPercentage" :stroke-width="8" class="stat-progress" />
      </el-card>

      <el-card shadow="hover" class="stat-card stat-card-available">
        <div class="stat-head">
          <div class="stat-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-title">模型可用概览</div>
        </div>
        <el-statistic :value="runtimeSummary.availableModelCount" class="stat-number">
          <template #suffix>/ {{ runtimeSummary.discoveredModelCount }}</template>
        </el-statistic>
        <div class="stat-sub">可用模型 / 发现模型</div>
        <el-progress :percentage="availablePercentage" status="success" :stroke-width="8" class="stat-progress" />
      </el-card>

      <el-card shadow="hover" class="table-card">
        <template #header>
          <div class="card-header">
            <span>模型运行态监测</span>
            <el-button type="primary" size="small" :disabled="tableLoading || summaryLoading" @click="refreshAll">
              <el-icon class="icon-with-margin"><Refresh /></el-icon>
              手动刷新状态
            </el-button>
          </div>
        </template>

        <div class="filter-row">
          <el-input
            v-model="filters.name"
            placeholder="模型名称"
            clearable
            size="small"
            class="filter-control"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-input
            v-model="filters.taskType"
            placeholder="任务类型"
            clearable
            size="small"
            class="filter-control"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select
            v-model="filters.loaded"
            clearable
            placeholder="加载状态"
            size="small"
            class="filter-control"
          >
            <template #prefix><el-icon><Files /></el-icon></template>
            <el-option label="已加载" value="true" />
            <el-option label="未加载" value="false" />
          </el-select>

          <el-select
            v-model="filters.available"
            clearable
            placeholder="可用状态"
            size="small"
            class="filter-control"
          >
            <template #prefix><el-icon><CircleCheck /></el-icon></template>
            <el-option label="可用" value="true" />
            <el-option label="不可用" value="false" />
          </el-select>
        </div>

        <el-table
          v-loading="tableLoading"
          :data="runtimeModels"
          stripe
          border
          size="small"
          class="model-table"
          table-layout="fixed"
        >
          <template #empty>
            <div class="empty-state">
              <div class="empty-title">{{ emptyStateTitle }}</div>
              <div class="empty-desc">{{ emptyStateDescription }}</div>
            </div>
          </template>

          <el-table-column prop="name" label="模型名称" width="112" show-overflow-tooltip />
          <el-table-column prop="taskType" label="任务类型" width="88" show-overflow-tooltip />
          <el-table-column prop="modelVersion" label="版本" width="84" show-overflow-tooltip />
          <el-table-column prop="deployPath" label="部署位置" min-width="230" show-overflow-tooltip />

          <el-table-column label="加载" width="82">
            <template #default="{ row }">
              <el-tag :type="row.loaded ? 'success' : 'info'">{{ row.loaded ? '已加载' : '未加载' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="服务" width="82">
            <template #default="{ row }">
              <el-tag :type="getServiceTagType(row)">{{ getServiceText(row) }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="可用" width="82">
            <template #default="{ row }">
              <el-tag :type="isModelAvailable(row) ? 'success' : 'danger'">
                {{ isModelAvailable(row) ? '可用' : '不可用' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="最近探活" width="132">
            <template #default="{ row }">
              {{ formatDateTime(row.lastHealthCheckAt) }}
            </template>
          </el-table-column>

          <el-table-column label="最近错误" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.lastHealthError || '-' }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, Cpu, Files, Refresh, Search } from '@element-plus/icons-vue'
import { getRuntimeSummary, listRuntimeModels } from '@/api/model'
import type { RuntimeModelRow, RuntimeSummary } from '@/types/model'

type SelectBool = '' | 'true' | 'false'

const summaryLoading = ref(false)
const tableLoading = ref(false)

const filters = reactive<{
  name: string
  taskType: string
  loaded: SelectBool
  available: SelectBool
}>({
  name: '',
  taskType: '',
  loaded: '',
  available: '',
})

const runtimeSummary = reactive<RuntimeSummary>({
  serviceLive: false,
  serviceReady: false,
  discoveredModelCount: 0,
  loadedModelCount: 0,
  availableModelCount: 0,
  unavailableModelCount: 0,
  lastHealthCheckAt: '',
  lastHealthError: null,
})

const runtimeModels = ref<RuntimeModelRow[]>([])

const hasActiveFilters = computed(() => {
  return Boolean(filters.name || filters.taskType || filters.loaded || filters.available)
})

const serviceStatusText = computed(() => {
  if (!runtimeSummary.serviceLive) return '未启动/不可达'
  if (!runtimeSummary.serviceReady) return '已启动未就绪'
  return '运行中'
})

const serviceStatusTag = computed(() => {
  if (!runtimeSummary.serviceLive) return 'danger'
  if (!runtimeSummary.serviceReady) return 'warning'
  return 'success'
})

const loadPercentage = computed(() => {
  if (!runtimeSummary.discoveredModelCount) return 0
  return Math.round((runtimeSummary.loadedModelCount / runtimeSummary.discoveredModelCount) * 100)
})

const availablePercentage = computed(() => {
  if (!runtimeSummary.discoveredModelCount) return 0
  return Math.round((runtimeSummary.availableModelCount / runtimeSummary.discoveredModelCount) * 100)
})

const emptyStateTitle = computed(() => {
  if (!runtimeSummary.serviceLive) return '推理服务未启动或不可达'
  if (!runtimeSummary.serviceReady) return '服务已启动，模型加载中'
  if (hasActiveFilters.value) return '当前筛选条件下无匹配模型'
  return '当前未发现已接入模型'
})

const emptyStateDescription = computed(() => {
  const checkedAt = formatDateTime(runtimeSummary.lastHealthCheckAt)
  if (runtimeSummary.lastHealthError) {
    return `最近错误：${runtimeSummary.lastHealthError}`
  }
  if (!runtimeSummary.serviceLive) {
    return '请检查推理服务进程、端口与网络连通性。'
  }
  if (!runtimeSummary.serviceReady) {
    return `最近探活时间：${checkedAt}`
  }
  if (hasActiveFilters.value) {
    if (filters.loaded === 'false' && runtimeSummary.discoveredModelCount > 0 && runtimeSummary.loadedModelCount === runtimeSummary.discoveredModelCount) {
      return '当前发现的模型均已加载，请调整加载状态筛选条件。'
    }
    if (filters.available === 'false' && runtimeSummary.discoveredModelCount > 0 && runtimeSummary.availableModelCount === runtimeSummary.discoveredModelCount) {
      return '当前发现的模型均可用，请调整可用状态筛选条件。'
    }
    return '请调整模型名称、任务类型或状态筛选条件。'
  }
  return `最近探活时间：${checkedAt}`
})

function toOptionalBool(value: SelectBool): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function formatDateTime(input?: string | null): string {
  if (!input) return '-'
  const value = input.replace('T', ' ').replace('Z', '')
  return value.length > 16 ? value.slice(0, 16) : value
}

function isModelAvailable(row: RuntimeModelRow): boolean {
  return row.loaded && row.serviceLive && row.serviceReady
}

function getServiceText(row: RuntimeModelRow): string {
  if (!row.serviceLive) return '不可达'
  if (!row.serviceReady) return '未就绪'
  return '正常'
}

function getServiceTagType(row: RuntimeModelRow): 'success' | 'warning' | 'danger' {
  if (!row.serviceLive) return 'danger'
  if (!row.serviceReady) return 'warning'
  return 'success'
}

async function fetchRuntimeSummary() {
  summaryLoading.value = true
  try {
    const summary = await getRuntimeSummary()
    Object.assign(runtimeSummary, summary)
  } catch (error: any) {
    ElMessage.error(error?.message ?? '获取推理服务状态失败')
  } finally {
    summaryLoading.value = false
  }
}

async function fetchRuntimeModels() {
  tableLoading.value = true
  try {
    runtimeModels.value = await listRuntimeModels({
      name: filters.name || undefined,
      taskType: filters.taskType || undefined,
      loaded: toOptionalBool(filters.loaded),
      available: toOptionalBool(filters.available),
    })
  } catch (error: any) {
    runtimeModels.value = []
    ElMessage.error(error?.message ?? '获取运行态模型列表失败')
  } finally {
    tableLoading.value = false
  }
}

async function refreshAll() {
  await Promise.all([fetchRuntimeSummary(), fetchRuntimeModels()])
}

watch(
  () => [filters.name, filters.taskType, filters.loaded, filters.available],
  () => {
    fetchRuntimeModels()
  },
)

onMounted(() => {
  refreshAll()
})
</script>

<style scoped>
.model-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.grid-wrapper {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px 24px;
  width: min(1304px, calc(100vw - 260px));
  max-width: 100%;
}

.stat-card,
.table-card {
  min-width: 0;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 8px 22px rgba(31, 41, 55, 0.08);
  border: 1px solid #e5e7eb;
}

.stat-card {
  position: relative;
  min-height: 152px;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: #409eff;
}

.stat-card-load::before {
  background: #2f7df6;
}

.stat-card-available::before {
  background: #67c23a;
}

.stat-card :deep(.el-card__body) {
  height: 100%;
  padding: 24px;
}

.table-card :deep(.el-card__body) {
  padding: 18px 20px 20px;
}

.table-card {
  grid-column: 1 / span 3;
}

:deep(.el-card__header) {
  padding: 28px 20px 8px;
  border-bottom: 1px solid #e5e7eb;
}

.stat-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #2f7df6;
  background: #ecf5ff;
  font-size: 18px;
}

.stat-card-service .stat-icon {
  color: #0f766e;
  background: #e8f7f3;
}

.stat-card-available .stat-icon {
  color: #3a9f2f;
  background: #edf8e9;
}

.stat-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stat-main {
  margin-top: 14px;
}

.stat-number {
  margin-top: 14px;
}

.stat-number :deep(.el-statistic__number) {
  font-size: 30px;
  line-height: 1;
  font-weight: 700;
  color: #1f2937;
}

.stat-number :deep(.el-statistic__suffix) {
  margin-left: 6px;
  color: #1f2937;
}

.stat-sub {
  margin-top: 10px;
  color: #606266;
  font-size: 13px;
}

.service-status-strip {
  min-height: 22px;
  margin-top: 8px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.service-status-pill {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #409eff;
  font-size: 12px;
  font-weight: 600;
}

.service-status-pill span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-progress {
  margin-top: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 32px;
  font-size: 1.1rem;
  font-weight: 600;
}

.card-header .el-button {
  align-self: center;
}

.icon-with-margin {
  margin-right: 4px;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 14px;
  padding: 10px;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 6px;
}

.filter-control {
  width: 100%;
}

.model-table {
  width: 100%;
}

:deep(.model-table .el-table__cell) {
  padding: 6px 0;
}

:deep(.model-table .el-table__header th) {
  color: #606f7b;
  background: #f8fafc;
  font-weight: 650;
}

:deep(.model-table .cell) {
  padding: 0 8px;
  white-space: nowrap;
}

.empty-state {
  padding: 20px 0;
  color: #606266;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
}

.empty-desc {
  margin-top: 6px;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .grid-wrapper {
    min-width: 0;
    width: 100%;
    grid-template-columns: 1fr;
  }

  .table-card {
    grid-column: auto;
  }

  .filter-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
