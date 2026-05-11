<template>
  <div class="model-container">
    <div class="grid-wrapper">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-title">推理服务状态</div>
        <div class="stat-main">
          <el-tag :type="serviceStatusTag" size="large">{{ serviceStatusText }}</el-tag>
        </div>
        <div class="stat-sub">最近探活：{{ formatDateTime(runtimeSummary.lastHealthCheckAt) }}</div>
        <div v-if="runtimeSummary.lastHealthError" class="stat-error">{{ runtimeSummary.lastHealthError }}</div>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="stat-title">模型加载概览</div>
        <div class="stat-number">{{ runtimeSummary.loadedModelCount }} / {{ runtimeSummary.discoveredModelCount }}</div>
        <div class="stat-sub">已加载模型 / 发现模型</div>
        <el-progress :percentage="loadPercentage" :stroke-width="8" />
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <div class="stat-title">模型可用概览</div>
        <div class="stat-number">{{ runtimeSummary.availableModelCount }} / {{ runtimeSummary.discoveredModelCount }}</div>
        <div class="stat-sub">可用模型 / 发现模型</div>
        <el-progress :percentage="availablePercentage" status="success" :stroke-width="8" />
      </el-card>

      <el-card shadow="hover" class="table-card">
        <template #header>
          <div class="card-header">
            <span>模型运行态管理</span>
            <el-button type="primary" size="small" :loading="tableLoading || summaryLoading" @click="refreshAll">
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
            style="max-width: 220px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-input
            v-model="filters.taskType"
            placeholder="任务类型"
            clearable
            size="small"
            style="max-width: 220px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="filters.loaded" clearable placeholder="加载状态" size="small" style="max-width: 180px">
            <el-option label="已加载" value="true" />
            <el-option label="未加载" value="false" />
          </el-select>

          <el-select
            v-model="filters.available"
            clearable
            placeholder="可用状态"
            size="small"
            style="max-width: 180px"
          >
            <el-option label="可用" value="true" />
            <el-option label="不可用" value="false" />
          </el-select>
        </div>

        <el-table v-loading="tableLoading" :data="runtimeModels" stripe border size="small" class="model-table">
          <template #empty>
            <div class="empty-state">
              <div class="empty-title">{{ emptyStateTitle }}</div>
              <div class="empty-desc">{{ emptyStateDescription }}</div>
            </div>
          </template>

          <el-table-column prop="name" label="模型名称" min-width="150" />
          <el-table-column prop="taskType" label="任务类型" min-width="120" />
          <el-table-column prop="modelVersion" label="模型版本" min-width="160" />
          <el-table-column prop="deployPath" label="部署位置" min-width="220" show-overflow-tooltip />

          <el-table-column label="是否已加载" min-width="110">
            <template #default="{ row }">
              <el-tag :type="row.loaded ? 'success' : 'info'">{{ row.loaded ? '已加载' : '未加载' }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="服务状态" min-width="130">
            <template #default="{ row }">
              <el-tag :type="getServiceTagType(row)">{{ getServiceText(row) }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="模型可用" min-width="110">
            <template #default="{ row }">
              <el-tag :type="isModelAvailable(row) ? 'success' : 'danger'">
                {{ isModelAvailable(row) ? '可用' : '不可用' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="最近探活时间" min-width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.lastHealthCheckAt) }}
            </template>
          </el-table-column>

          <el-table-column label="最近错误" min-width="240" show-overflow-tooltip>
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
import { Refresh, Search } from '@element-plus/icons-vue'
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
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  min-width: 1304px;
}

.stat-card,
.table-card {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.table-card {
  grid-column: 1 / span 3;
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
  font-size: 30px;
  font-weight: 700;
  color: #303133;
}

.stat-sub {
  margin-top: 10px;
  color: #606266;
  font-size: 13px;
}

.stat-error {
  margin-top: 8px;
  color: #f56c6c;
  font-size: 13px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
}

.icon-with-margin {
  margin-right: 4px;
}

.filter-row {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.model-table {
  width: 100%;
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

@media (max-width: 1360px) {
  .grid-wrapper {
    min-width: 0;
    width: 100%;
    grid-template-columns: 1fr;
  }

  .table-card {
    grid-column: auto;
  }
}
</style>