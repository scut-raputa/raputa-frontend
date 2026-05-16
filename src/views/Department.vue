<template>
  <div class="device-page">
    <div class="device-shell">
      <el-card shadow="hover" class="stat-card stat-card-total">
        <div class="stat-head">
          <div class="stat-icon">
            <el-icon><Box /></el-icon>
          </div>
          <div class="stat-title">登记设备</div>
        </div>
        <el-statistic :value="deviceTotal" class="stat-number" />
        <div class="stat-meta-row">
          <el-tag size="small" type="primary" effect="light">资产台账</el-tag>
          <span>{{ deviceTotal > 0 ? '已有登记设备' : '暂无登记设备' }}</span>
        </div>
        <el-progress :percentage="registeredPercentage" :show-text="false" :stroke-width="8" class="stat-progress" />
      </el-card>

      <el-card shadow="hover" class="stat-card stat-card-online">
        <div class="stat-head">
          <div class="stat-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-title">当前在线</div>
        </div>
        <el-statistic :value="onlineCount" class="stat-number" />
        <div class="stat-meta-row">
          <el-tag size="small" type="success" effect="light">在线率</el-tag>
          <span>{{ onlinePercentage }}%</span>
        </div>
        <el-progress
          :percentage="onlinePercentage"
          status="success"
          :show-text="false"
          :stroke-width="8"
          class="stat-progress"
        />
      </el-card>

      <el-card shadow="hover" class="stat-card stat-card-occupied">
        <div class="stat-head">
          <div class="stat-icon">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="stat-title">会话占用</div>
        </div>
        <el-statistic :value="occupiedCount" class="stat-number" />
        <div class="stat-meta-row">
          <el-tag size="small" type="warning" effect="light">占用率</el-tag>
          <span>{{ occupiedPercentage }}%</span>
        </div>
        <el-progress
          :percentage="occupiedPercentage"
          color="#e6a23c"
          :show-text="false"
          :stroke-width="8"
          class="stat-progress"
        />
      </el-card>

      <el-card shadow="hover" class="table-card">
        <template #header>
          <div class="card-header">
            <span>设备资产与会话</span>
            <el-button type="primary" size="small" :disabled="refreshingStatus" @click="refreshDevices">
              <el-icon class="icon-with-margin"><Refresh /></el-icon>
              手动刷新状态
            </el-button>
          </div>
        </template>

        <div class="controls-row">
          <el-input v-model="deviceSearchId" placeholder="搜索资产编号" size="small" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-input v-model="deviceSearchName" placeholder="搜索设备名称" size="small" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="deviceLocationFilter" placeholder="保管/部署位置" size="small" clearable>
            <template #prefix><el-icon><Location /></el-icon></template>
            <el-option v-for="loc in locationOptions" :key="loc" :label="loc" :value="loc" />
          </el-select>
          <el-select v-model="deviceStatusFilter" placeholder="在线状态" size="small" clearable>
            <template #prefix><el-icon><Link /></el-icon></template>
            <el-option label="在线" value="在线" />
            <el-option label="离线" value="离线" />
          </el-select>
        </div>

        <el-table
          v-loading="deviceLoading"
          :data="deviceRows"
          stripe
          border
          size="small"
          class="table"
          :row-class-name="deviceRowClassName"
          :row-style="row35Style"
          :cell-style="cell35Style"
        >
          <el-table-column prop="id" label="资产编号" width="145" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" width="110" show-overflow-tooltip />
          <el-table-column prop="ip" label="当前 IP" width="118" show-overflow-tooltip />
          <el-table-column prop="storageLocation" label="保管/部署位置" width="118" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="!row.__filler">{{ row.storageLocation || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="在线状态" width="88">
            <template #default="{ row }">
              <el-tag
                v-if="!row.__filler"
                :type="row.status === '在线' ? 'success' : 'info'"
                effect="light"
                size="small"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="会话占用" min-width="220">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <div v-if="row.occupied" class="occupancy-cell">
                  <el-tag type="warning" effect="light" size="small" class="occupancy-tag">
                    占用中
                  </el-tag>
                  <el-tooltip
                    :content="`${row.occupiedPatientName || '-'}（${row.occupiedPatientId || '-'}）`"
                    placement="top"
                  >
                    <span class="occupied-detail">
                      {{ row.occupiedPatientName || '-' }}（{{ row.occupiedPatientId || '-' }}）
                    </span>
                  </el-tooltip>
                </div>
                <span v-else class="muted">空闲</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <el-button size="small" @click="openDeviceEdit(row)">编辑</el-button>
                <el-tooltip
                  :disabled="row.occupied"
                  content="设备未被占用，无需强制释放"
                  placement="top"
                >
                  <span class="button-wrapper">
                    <el-button
                      size="small"
                      type="warning"
                      :disabled="!row.occupied"
                      @click="onForceRelease(row)"
                    >
                      强制释放
                    </el-button>
                  </span>
                </el-tooltip>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            :current-page="devicePage"
            :page-size="PAGE_SIZE"
            :total="deviceTotal"
            background
            size="small"
            layout="prev, pager, next"
            @current-change="devicePage = $event"
          />
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="deviceDialogVisible"
      title="编辑设备"
      width="640px"
      :close-on-click-modal="false"
      @closed="onDeviceDialogClosed"
    >
      <el-form ref="deviceFormRef" :model="deviceForm" :rules="deviceRules" label-width="128px" class="device-form">
        <el-form-item label="资产编号">
          <el-input :model-value="deviceReadonly.id" disabled />
        </el-form-item>
        <el-form-item label="当前 IP">
          <el-input :model-value="deviceReadonly.ip || '-'" disabled />
        </el-form-item>
        <el-form-item label="在线状态">
          <el-input :model-value="deviceReadonly.status || '-'" disabled />
        </el-form-item>
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="deviceForm.name" placeholder="如：吞咽记录仪 A1" />
        </el-form-item>
        <el-form-item label="硬件标识">
          <el-input :model-value="deviceReadonly.hardwareId || '-'" disabled />
          <div class="form-tip">
            由系统发现服务维护，通常来自 MAC 地址、序列号或设备 ID，不支持手动修改。
          </div>
        </el-form-item>
        <el-form-item label="保管/部署位置">
          <el-input v-model="deviceForm.storageLocation" placeholder="如：康复医学科治疗室" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="deviceForm.description" type="textarea" :rows="3" placeholder="设备备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deviceDialogVisible = false">取消</el-button>
        <el-button @click="resetDeviceDialogContent">恢复原值</el-button>
        <el-button type="primary" :loading="deviceSubmitting" @click="submitDevice">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Box, CircleCheck, Connection, Link, Location, Refresh, Search } from '@element-plus/icons-vue'
import type { DeviceFormData, DeviceRow } from '@/types/department'
import { forceReleaseDeviceLock, getDeviceLocations, listDevices, updateDevice } from '@/api/department'
import { quickDeviceDiscovery } from '@/api/device'

const PAGE_SIZE = 5
const DEVICE_MAX_FILLER_ROWS = PAGE_SIZE

const deviceLoading = ref(false)
const refreshingStatus = ref(false)
const deviceData = ref<DeviceRow[]>([])
const deviceTotal = ref(0)
const devicePage = ref(1)
const deviceSearchId = ref('')
const deviceSearchName = ref('')
const deviceStatusFilter = ref('')
const deviceLocationFilter = ref('')
const locationOptions = ref<string[]>([])

const deviceRows = computed(() => fillerRows(deviceData.value, PAGE_SIZE, DEVICE_MAX_FILLER_ROWS))
const onlineCount = computed(() => deviceData.value.filter((row) => row.status === '在线').length)
const occupiedCount = computed(() => deviceData.value.filter((row) => row.occupied).length)
const registeredPercentage = computed(() => (deviceTotal.value > 0 ? 100 : 0))
const onlinePercentage = computed(() => {
  if (!deviceTotal.value) return 0
  return Math.round((onlineCount.value / deviceTotal.value) * 100)
})
const occupiedPercentage = computed(() => {
  if (!deviceTotal.value) return 0
  return Math.round((occupiedCount.value / deviceTotal.value) * 100)
})

const deviceDialogVisible = ref(false)
const deviceEditingId = ref('')
const deviceSubmitting = ref(false)
const deviceFormRef = ref<FormInstance>()
const deviceEditOriginal = ref<DeviceFormState | null>(null)
const deviceReadonly = ref({
  id: '',
  ip: '',
  status: '',
  hardwareId: '',
  occupied: false,
})

type DeviceFormState = {
  name: string
  description: string
  storageLocation: string
}

function emptyDeviceForm(): DeviceFormState {
  return {
    name: '',
    description: '',
    storageLocation: '',
  }
}

const deviceForm = ref<DeviceFormState>(emptyDeviceForm())
const deviceRules = {
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
}

onMounted(() => {
  fetchDevices()
  fetchLocations()
})

watch(devicePage, () => fetchDevices())
watch([deviceSearchId, deviceSearchName, deviceStatusFilter, deviceLocationFilter], () => {
  devicePage.value = 1
  fetchDevices()
})

function row35Style() {
  return { height: '35px' }
}

function cell35Style() {
  return { paddingTop: '0px', paddingBottom: '0px', height: '35px', lineHeight: '35px' }
}

function fillerRows<T>(data: T[], size: number, maxFillers: number): Array<T | { __filler: true; __key: number }> {
  const pad = Math.min(size - data.length, maxFillers)
  if (pad <= 0) return data
  return data.concat(Array.from({ length: pad }, (_, i) => ({ __filler: true, __key: i }) as T))
}

function deviceRowClassName({ row }: { row: DeviceRow & { __filler?: boolean } }) {
  return row.__filler ? 'is-filler' : ''
}

async function fetchDevices(options: { silent?: boolean } = {}) {
  if (!options.silent) {
    deviceLoading.value = true
  }
  try {
    const data = await listDevices({
      page: devicePage.value,
      size: PAGE_SIZE,
      id: deviceSearchId.value || undefined,
      name: deviceSearchName.value || undefined,
      status: deviceStatusFilter.value || undefined,
      storageLocation: deviceLocationFilter.value || undefined,
    })
    deviceData.value = data.items
    deviceTotal.value = data.total
  } finally {
    if (!options.silent) {
      deviceLoading.value = false
    }
  }
}

async function fetchLocations() {
  try {
    locationOptions.value = await getDeviceLocations()
  } catch {
    locationOptions.value = []
  }
}

async function refreshDevices() {
  refreshingStatus.value = true
  try {
    const discoveredDevice = await quickDeviceDiscovery()
    if (discoveredDevice?.status === 'ONLINE') {
      ElMessage.success(`发现在线设备：${discoveredDevice.deviceName || discoveredDevice.deviceIp || discoveredDevice.deviceId}`)
    } else {
      ElMessage.warning('未发现在线设备，已刷新设备状态')
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('未发现设备')) {
      ElMessage.warning('未发现在线设备，已将未响应设备标记为离线')
    } else {
      ElMessage.error(message || '刷新设备状态失败')
    }
  } finally {
    try {
      await fetchDevices({ silent: true })
      await fetchLocations()
    } finally {
      refreshingStatus.value = false
    }
  }
}

function openDeviceEdit(row: DeviceRow) {
  deviceEditingId.value = row.id
  deviceReadonly.value = {
    id: row.id,
    ip: row.ip || '',
    status: row.status || '',
    hardwareId: row.hardwareId || '',
    occupied: Boolean(row.occupied),
  }
  const form = {
    name: row.name ?? '',
    description: row.description ?? '',
    storageLocation: row.storageLocation ?? '',
  }
  deviceEditOriginal.value = { ...form }
  applyDeviceForm(form)
  deviceDialogVisible.value = true
}

function applyDeviceForm(form: DeviceFormState | null) {
  deviceForm.value = { ...(form ?? emptyDeviceForm()) }
  nextTick(() => deviceFormRef.value?.clearValidate())
}

function resetDeviceDialogContent() {
  if (deviceEditOriginal.value) {
    applyDeviceForm(deviceEditOriginal.value)
  }
}

function onDeviceDialogClosed() {
  deviceEditOriginal.value = null
  applyDeviceForm(null)
  deviceReadonly.value = { id: '', ip: '', status: '', hardwareId: '', occupied: false }
}

async function submitDevice() {
  const valid = await deviceFormRef.value?.validate().catch(() => false)
  if (!valid) return

  const dto: DeviceFormData = {
    name: deviceForm.value.name.trim(),
    description: deviceForm.value.description.trim(),
    storageLocation: deviceForm.value.storageLocation.trim(),
  }

  deviceSubmitting.value = true
  try {
    await updateDevice(deviceEditingId.value, dto)
    ElMessage.success('设备信息已更新')
    deviceDialogVisible.value = false
    await refreshDevices()
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  } finally {
    deviceSubmitting.value = false
  }
}

async function onForceRelease(row: DeviceRow) {
  if (!row.occupied) return
  try {
    await ElMessageBox.confirm(
      `确认通知正在使用【${row.name}】的检测端停止检测并释放设备？`,
      '强制释放确认',
      {
        type: 'warning',
        confirmButtonText: '发送释放请求',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }

  try {
    await forceReleaseDeviceLock(row.id)
    ElMessage.success('已向占用端发送强制释放请求')
    await fetchDevices()
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '强制释放失败')
  }
}
</script>

<style scoped>
.device-page {
  width: 100%;
  display: flex;
  justify-content: center;
}
.device-shell {
  width: min(1304px, calc(100vw - 260px));
  max-width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px 24px;
}
.stat-card,
.table-card {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 22px rgba(31, 41, 55, 0.08);
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
  background: #2f7df6;
}
.stat-card-online::before {
  background: #67c23a;
}
.stat-card-occupied::before {
  background: #e6a23c;
}
.stat-card :deep(.el-card__body) {
  height: 100%;
  padding: 24px;
}
.table-card {
  grid-column: 1 / -1;
}
.table-card :deep(.el-card__body) {
  padding: 18px 20px 20px;
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
.stat-card-online .stat-icon {
  color: #3a9f2f;
  background: #edf8e9;
}
.stat-card-occupied .stat-icon {
  color: #b7791f;
  background: #fff7e6;
}
.stat-title {
  color: #1f2937;
  font-size: 16px;
  font-weight: 650;
}
.stat-number {
  margin-top: 18px;
}
.stat-number :deep(.el-statistic__number) {
  color: #1f2937;
  font-size: 30px;
  line-height: 1;
  font-weight: 700;
}
.stat-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: #606266;
  font-size: 13px;
}
.stat-progress {
  margin-top: 10px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 1.2rem;
  font-weight: 600;
}
:deep(.el-card__header) {
  padding: 18px 20px 12px;
  border-bottom: 1px solid #e5e7eb;
}
.controls-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 6px;
}
.controls-row > :deep(.el-input),
.controls-row > :deep(.el-select) {
  width: 100% !important;
  min-width: 0;
}
.table {
  width: 100%;
  margin-bottom: 16px;
}
:deep(.table .el-table__header th) {
  color: #606f7b;
  background: #f8fafc;
  font-weight: 650;
}
:deep(.table .cell) {
  white-space: nowrap;
}
.button-wrapper {
  display: inline-flex;
  margin-left: 8px;
}
.pagination-wrapper {
  display: flex;
  justify-content: center;
}
.icon-with-margin {
  margin-right: 4px;
}
.muted {
  color: #909399;
}
.occupancy-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.occupancy-tag {
  flex: 0 0 auto;
}
.occupied-detail {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #e6a23c;
}
.device-form :deep(.el-input),
.device-form :deep(.el-textarea) {
  font-size: 14px;
}
.form-tip {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}
:deep(.el-table__body tr.is-filler .cell) {
  visibility: hidden;
  pointer-events: none;
}
@media (max-width: 1100px) {
  .device-shell {
    width: 100%;
  }
  .device-shell,
  .controls-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .table-card {
    grid-column: 1 / -1;
  }
}
</style>
