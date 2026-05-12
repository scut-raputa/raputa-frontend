<template>
  <div class="system-container">
    <div class="grid-wrapper">
      <!-- ─── 设备信息 ─────────────────────────────── -->
      <el-card shadow="hover" class="card wide">
        <template #header>
          <div class="card-header">设备信息</div>
        </template>

        <div class="controls-row">
          <el-input v-model="deviceSearchId" placeholder="搜索资产编号" size="small"
            clearable style="width: 200px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-input v-model="deviceSearchName" placeholder="搜索设备名称" size="small"
            clearable style="width: 200px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-input v-model="deviceSearchOwner" placeholder="搜索负责人" size="small"
            clearable style="width: 160px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="deviceStatusFilter" placeholder="设备状态" size="small"
            clearable style="width: 140px">
            <template #prefix><el-icon><Link /></el-icon></template>
            <el-option label="在线" value="在线" />
            <el-option label="离线" value="离线" />
          </el-select>

          <el-select v-model="deviceLocationFilter" placeholder="设备保管地点" size="small"
            clearable style="width: 180px">
            <template #prefix><el-icon><Location /></el-icon></template>
            <el-option v-for="loc in locationOptions" :key="loc" :label="loc" :value="loc" />
          </el-select>

          <el-button type="primary" size="small" @click="openDeviceCreate">
            <el-icon class="icon-with-margin"><Plus /></el-icon>添加设备
          </el-button>
        </div>

        <el-table v-loading="deviceLoading" :data="deviceRows" stripe border size="small"
          class="table" style="margin-bottom: 16px"
          :row-class-name="deviceRowClassName"
          :row-style="row35Style" :cell-style="cell35Style">
          <el-table-column prop="id" label="资产编号" min-width="110" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="ip" label="当前IP" min-width="130" />
          <el-table-column label="设备状态" width="90">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <el-tag :type="row.status === '在线' ? 'success' : 'info'" effect="light" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </template>
          </el-table-column>
          <el-table-column label="会话占用" min-width="180">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <el-tag v-if="row.occupied" type="warning" effect="light" size="small">
                  占用中
                </el-tag>
                <span v-else class="muted">空闲</span>
                <el-tooltip
                  v-if="row.occupied"
                  :content="`${row.occupiedPatientName || '-'}（${row.occupiedPatientId || '-'}）`"
                  placement="top"
                >
                  <span class="occupied-detail">
                    {{ row.occupiedPatientName || '-' }}（{{ row.occupiedPatientId || '-' }}）
                  </span>
                </el-tooltip>
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="responsible" label="负责人" min-width="100" show-overflow-tooltip />
          <el-table-column label="操作" width="270" fixed="right">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <el-button size="small" :type="row.status === '在线' ? 'primary' : 'default'"
                  :plain="row.status !== '在线'" :loading="togglingId === row.id"
                  @click="onToggleConnect(row)">
                  {{ row.status === '在线' ? '断连' : '连接' }}
                </el-button>
                <el-button
                  v-if="row.occupied"
                  size="small"
                  type="warning"
                  @click="onForceRelease(row)"
                >
                  强制释放
                </el-button>
                <el-button size="small" @click="openDeviceEdit(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="onDeleteDevice(row)">删除</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination :current-page="devicePage" :page-size="PAGE_SIZE"
            :total="deviceTotal" background size="small" layout="prev, pager, next"
            @current-change="devicePage = $event" />
        </div>
      </el-card>

      <!-- ─── 科室医生管理 ──────────────────────────── -->
      <el-card shadow="hover" class="card wide">
        <template #header>
          <div class="card-header">科室医生管理</div>
        </template>

        <div class="controls-row">
          <el-input v-model="docSearchId" placeholder="搜索工号" clearable size="small" style="width: 160px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-input v-model="docSearchName" placeholder="搜索姓名" clearable size="small" style="width: 160px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-input v-model="docSearchDept" placeholder="搜索科室" clearable size="small" style="width: 160px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-input v-model="docSearchPhone" placeholder="搜索联系电话" clearable size="small" style="width: 180px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="docTitleFilter" placeholder="选择职称" clearable size="small" style="width: 160px">
            <template #prefix><el-icon><Filter /></el-icon></template>
            <el-option v-for="t in TITLE_OPTIONS" :key="t" :label="t" :value="t" />
          </el-select>
          <el-button type="primary" size="small" @click="openDoctorCreate">
            <el-icon class="icon-with-margin"><Plus /></el-icon>添加医生
          </el-button>
        </div>

        <el-table v-loading="docLoading" :data="doctorRows" stripe border size="small"
          class="table" style="margin-bottom: 16px"
          :row-class-name="docRowClassName"
          :row-style="row35Style" :cell-style="cell35Style">
          <el-table-column prop="id" label="工号" min-width="100" show-overflow-tooltip />
          <el-table-column prop="name" label="姓名" min-width="100" show-overflow-tooltip />
          <el-table-column prop="department" label="所属科室" min-width="140" show-overflow-tooltip />
          <el-table-column prop="title" label="职称" min-width="110" show-overflow-tooltip />
          <el-table-column prop="phone" label="联系电话" min-width="130" show-overflow-tooltip />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <el-button size="small" @click="openDoctorEdit(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="onDeleteDoctor(row)">删除</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination :current-page="docPage" :page-size="DOC_PAGE_SIZE"
            :total="docTotal" background size="small" layout="prev, pager, next"
            @current-change="docPage = $event" />
        </div>
      </el-card>
    </div>

    <!-- ─── 设备 对话框 ─────────────────────────────── -->
    <el-dialog v-model="deviceDialogVisible"
      :title="deviceDialogMode === 'create' ? '添加设备' : '编辑设备'"
      width="520px" :close-on-click-modal="false" @closed="resetDeviceForm">
      <el-form ref="deviceFormRef" :model="deviceForm" :rules="deviceRules"
        label-width="100px" size="small">
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="deviceForm.name" placeholder="如：吞咽记录仪 A1" />
        </el-form-item>
        <el-form-item label="硬件标识">
          <el-input v-model="deviceForm.hardwareId" placeholder="MAC / 序列号，用于固定识别设备" />
        </el-form-item>
        <el-form-item label="当前IP" prop="ip">
          <el-input v-model="deviceForm.ip" placeholder="局域网当前地址，可由发现服务自动更新" />
        </el-form-item>
        <el-form-item label="设备状态" prop="status">
          <el-select v-model="deviceForm.status" style="width: 100%">
            <el-option label="在线" value="在线" />
            <el-option label="离线" value="离线" />
          </el-select>
        </el-form-item>
        <el-form-item label="保管地点">
          <el-input v-model="deviceForm.storageLocation" placeholder="如：一号设备间" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="deviceForm.responsible" placeholder="如：王医生" />
        </el-form-item>
        <el-form-item label="上次连接时间">
          <el-date-picker v-model="deviceConnectedTime" type="datetime"
            placeholder="选择时间（可选）" style="width: 100%"
            :disabled-date="disabledFuture" />
        </el-form-item>
        <el-form-item label="设备描述">
          <el-input v-model="deviceForm.description" type="textarea" :rows="2"
            placeholder="设备描述信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deviceDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="deviceSubmitting" @click="submitDevice">确认</el-button>
      </template>
    </el-dialog>

    <!-- ─── 医生 对话框 ─────────────────────────────── -->
    <el-dialog v-model="doctorDialogVisible"
      :title="doctorDialogMode === 'create' ? '添加医生' : '编辑医生'"
      width="480px" :close-on-click-modal="false" @closed="resetDoctorForm">
      <el-form ref="doctorFormRef" :model="doctorForm" :rules="doctorRules"
        label-width="90px" size="small">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="doctorForm.name" placeholder="如：王医生" />
        </el-form-item>
        <el-form-item label="所属科室">
          <el-input v-model="doctorForm.department" placeholder="如：神经内科" />
        </el-form-item>
        <el-form-item label="职称">
          <el-select v-model="doctorForm.title" placeholder="请选择职称" clearable style="width: 100%">
            <el-option v-for="t in TITLE_OPTIONS" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="doctorForm.phone" placeholder="11位手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="doctorDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="doctorSubmitting" @click="submitDoctor">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Link, Location, Filter } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import type { DeviceRow, DoctorRow } from '@/types/department'
import {
  listDevices, getDeviceLocations, createDevice, updateDevice, deleteDevice, toggleDeviceStatus, forceReleaseDeviceLock,
  listDoctors, createDoctor, updateDoctor, deleteDoctor,
} from '@/api/department'

// ─── 常量 ──────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8
const DOC_PAGE_SIZE = 8
const DEVICE_MAX_FILLER_ROWS = 3
const DOCTOR_MAX_FILLER_ROWS = 5
const TITLE_OPTIONS = ['主任医师', '副主任医师', '主治医师', '住院医师']

// ─── 通用辅助 ───────────────────────────────────────────────────────────────
function row35Style() { return { height: '35px' } }
function cell35Style() {
  return { paddingTop: '0px', paddingBottom: '0px', height: '35px', lineHeight: '35px' }
}
function disabledFuture(date: Date) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return date.getTime() > today.getTime()
}
function toIsoLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
function fillerRows<T>(data: T[], size: number, maxFillers: number): any[] {
  const pad = Math.min(size - data.length, maxFillers)
  if (pad <= 0) return data as any[]
  return (data as any[]).concat(Array.from({ length: pad }, (_, i) => ({ __filler: true, __key: i })))
}

// ══════════════════════════════════════════════════════════════════════════════
// 设备信息
// ══════════════════════════════════════════════════════════════════════════════
const deviceLoading = ref(false)
const deviceData = ref<DeviceRow[]>([])
const deviceTotal = ref(0)
const devicePage = ref(1)
const deviceSearchId = ref('')
const deviceSearchName = ref('')
const deviceSearchOwner = ref('')
const deviceStatusFilter = ref('')
const deviceLocationFilter = ref('')
const locationOptions = ref<string[]>([])
const togglingId = ref<string | null>(null)

const deviceRows = computed(() => fillerRows(deviceData.value, PAGE_SIZE, DEVICE_MAX_FILLER_ROWS))
function deviceRowClassName({ row }: { row: any }) { return row.__filler ? 'is-filler' : '' }

async function fetchDevices() {
  deviceLoading.value = true
  try {
    const data = await listDevices({
      page: devicePage.value, size: PAGE_SIZE,
      id: deviceSearchId.value || undefined,
      name: deviceSearchName.value || undefined,
      responsible: deviceSearchOwner.value || undefined,
      status: deviceStatusFilter.value || undefined,
      storageLocation: deviceLocationFilter.value || undefined,
    })
    deviceData.value = data.items
    deviceTotal.value = data.total
  } finally {
    deviceLoading.value = false
  }
}

async function fetchLocations() {
  try { locationOptions.value = await getDeviceLocations() } catch { /**/ }
}

onMounted(() => { fetchDevices(); fetchLocations(); fetchDoctors() })

watch(devicePage, fetchDevices)
watch([deviceSearchId, deviceSearchName, deviceSearchOwner, deviceStatusFilter, deviceLocationFilter], () => {
  devicePage.value = 1; fetchDevices()
})

// 连接/断连
async function onToggleConnect(row: DeviceRow) {
  togglingId.value = row.id
  try {
    const updated = await toggleDeviceStatus(row.id)
    const idx = deviceData.value.findIndex(d => d.id === row.id)
    if (idx !== -1) deviceData.value[idx] = updated as DeviceRow
    ElMessage.success(updated.status === '在线' ? `已连接：${row.name}` : `已断连：${row.name}`)
    fetchLocations()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  } finally {
    togglingId.value = null
  }
}

async function onForceRelease(row: DeviceRow) {
  try {
    await ElMessageBox.confirm(`确认强制释放设备【${row.name}】当前占用会话？`, '强制释放确认', { type: 'warning' })
  } catch {
    return
  }

  try {
    await forceReleaseDeviceLock(row.id)
    ElMessage.success('设备占用已强制释放')
    fetchDevices()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '强制释放失败')
  }
}

// 删除
async function onDeleteDevice(row: DeviceRow) {
  try {
    await ElMessageBox.confirm(`确认删除设备【${row.name}】？`, '删除确认', { type: 'warning' })
  } catch { return }
  try {
    await deleteDevice(row.id)
    ElMessage.success('删除成功')
    fetchDevices(); fetchLocations()
  } catch (e: any) { ElMessage.error(e?.message ?? '删除失败') }
}

// ─── 设备对话框 ────────────────────────────────────────────────────────────
const deviceDialogVisible = ref(false)
const deviceDialogMode = ref<'create' | 'edit'>('create')
const deviceEditingId = ref('')
const deviceSubmitting = ref(false)
const deviceFormRef = ref<FormInstance>()
const deviceConnectedTime = ref<Date | null>(null)
const deviceForm = ref({ name: '', ip: '', hardwareId: '', status: '离线', description: '', storageLocation: '', responsible: '' })
const deviceRules = {
  name:   [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择设备状态', trigger: 'change' }],
}

function resetDeviceForm() {
  deviceForm.value = { name: '', ip: '', hardwareId: '', status: '离线', description: '', storageLocation: '', responsible: '' }
  deviceConnectedTime.value = null
  deviceFormRef.value?.clearValidate()
}
function openDeviceCreate() {
  resetDeviceForm(); deviceDialogMode.value = 'create'; deviceDialogVisible.value = true
}
function openDeviceEdit(row: DeviceRow) {
  resetDeviceForm()
  deviceForm.value = {
    name: row.name ?? '',
    ip: row.ip ?? '',
    hardwareId: row.hardwareId ?? '',
    status: row.status ?? '离线',
    description: row.description ?? '',
    storageLocation: row.storageLocation ?? '',
    responsible: row.responsible ?? '',
  }
  deviceConnectedTime.value = row.lastConnectedTime ? new Date(row.lastConnectedTime.replace(' ', 'T')) : null
  deviceEditingId.value = row.id
  deviceDialogMode.value = 'edit'
  deviceDialogVisible.value = true
}
async function submitDevice() {
  const valid = await deviceFormRef.value?.validate().catch(() => false)
  if (!valid) return
  const dto = {
    ...deviceForm.value,
    // 后端/DB 可能对 lastConnectedTime 有非空约束：
    // 用户不选择时间时，为避免 POST /api/device 直接 500，这里用当前时间兜底。
    lastConnectedTime: deviceConnectedTime.value
      ? toIsoLocal(deviceConnectedTime.value)
      : toIsoLocal(new Date()),
  }
  deviceSubmitting.value = true
  try {
    if (deviceDialogMode.value === 'create') {
      await createDevice(dto as any)
      ElMessage.success('添加成功')
    } else {
      await updateDevice(deviceEditingId.value, dto as any)
      ElMessage.success('编辑成功')
    }
    deviceDialogVisible.value = false
    fetchDevices(); fetchLocations()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  } finally {
    deviceSubmitting.value = false
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 科室医生管理
// ══════════════════════════════════════════════════════════════════════════════
const docLoading = ref(false)
const doctorData = ref<DoctorRow[]>([])
const docTotal = ref(0)
const docPage = ref(1)
const docSearchId = ref('')
const docSearchName = ref('')
const docSearchDept = ref('')
const docSearchPhone = ref('')
const docTitleFilter = ref('')

const doctorRows = computed(() => fillerRows(doctorData.value, DOC_PAGE_SIZE, DOCTOR_MAX_FILLER_ROWS))
function docRowClassName({ row }: { row: any }) { return row.__filler ? 'is-filler' : '' }

async function fetchDoctors() {
  docLoading.value = true
  try {
    const data = await listDoctors({
      page: docPage.value, size: DOC_PAGE_SIZE,
      id: docSearchId.value || undefined,
      name: docSearchName.value || undefined,
      department: docSearchDept.value || undefined,
      phone: docSearchPhone.value || undefined,
      title: docTitleFilter.value || undefined,
    })
    doctorData.value = data.items
    docTotal.value = data.total
  } finally {
    docLoading.value = false
  }
}

watch(docPage, fetchDoctors)
watch([docSearchId, docSearchName, docSearchDept, docSearchPhone, docTitleFilter], () => {
  docPage.value = 1; fetchDoctors()
})

// 删除
async function onDeleteDoctor(row: DoctorRow) {
  try {
    await ElMessageBox.confirm(`确认删除医生【${row.name}】？`, '删除确认', { type: 'warning' })
  } catch { return }
  try {
    await deleteDoctor(row.id)
    ElMessage.success('删除成功')
    fetchDoctors()
  } catch (e: any) { ElMessage.error(e?.message ?? '删除失败') }
}

// ─── 医生对话框 ────────────────────────────────────────────────────────────
const doctorDialogVisible = ref(false)
const doctorDialogMode = ref<'create' | 'edit'>('create')
const doctorEditingId = ref('')
const doctorSubmitting = ref(false)
const doctorFormRef = ref<FormInstance>()
const doctorForm = ref({ name: '', department: '', title: '', phone: '' })
const doctorRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
}

function resetDoctorForm() {
  doctorForm.value = { name: '', department: '', title: '', phone: '' }
  doctorFormRef.value?.clearValidate()
}
function openDoctorCreate() {
  resetDoctorForm(); doctorDialogMode.value = 'create'; doctorDialogVisible.value = true
}
function openDoctorEdit(row: DoctorRow) {
  resetDoctorForm()
  doctorForm.value = {
    name: row.name ?? '',
    department: row.department ?? '',
    title: row.title ?? '',
    phone: row.phone ?? '',
  }
  doctorEditingId.value = row.id
  doctorDialogMode.value = 'edit'
  doctorDialogVisible.value = true
}
async function submitDoctor() {
  const valid = await doctorFormRef.value?.validate().catch(() => false)
  if (!valid) return
  doctorSubmitting.value = true
  try {
    if (doctorDialogMode.value === 'create') {
      await createDoctor(doctorForm.value)
      ElMessage.success('添加成功')
    } else {
      await updateDoctor(doctorEditingId.value, doctorForm.value)
      ElMessage.success('编辑成功')
    }
    doctorDialogVisible.value = false
    fetchDoctors()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  } finally {
    doctorSubmitting.value = false
  }
}
</script>

<style scoped>
.system-container {
  width: 100%;
  display: flex;
  justify-content: center;
}
.grid-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 1304px;
}
.card {
  width: 100%;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}
.card-header {
  font-size: 1.2rem;
  font-weight: 600;
}
:deep(.el-card__header) {
  padding: 6px 0px;
}
.table {
  width: 100%;
}
.pagination-wrapper {
  display: flex;
  justify-content: center;
}
.controls-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) max-content;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}
.controls-row > :deep(.el-input),
.controls-row > :deep(.el-select) {
  width: 100% !important;
  max-width: none !important;
  min-width: 0;
}
.icon-with-margin {
  margin-right: 4px;
}
.muted {
  color: #909399;
}
.occupied-detail {
  display: inline-block;
  max-width: calc(100% - 52px);
  margin-left: 6px;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #e6a23c;
}
:deep(.el-table__body tr.is-filler .cell) {
  visibility: hidden;
  pointer-events: none;
}
@media (max-width: 1200px) {
  .controls-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
