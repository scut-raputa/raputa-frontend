<template>
  <div class="system-container">
    <div class="grid-wrapper">
      <!-- 设备信息（保留并改版） -->
      <el-card shadow="hover" class="card wide">
        <template #header>
          <div class="card-header">设备信息</div>
        </template>

        <!-- 控制行：搜索设备编号、搜索设备名称、搜索负责人、选择设备状态、选择设备保管地点、添加设备 -->
        <div class="controls-row">
          <el-input
            v-model="deviceSearchId"
            placeholder="搜索设备编号"
            size="small"
            clearable
            style="width: 220px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-input
            v-model="deviceSearchName"
            placeholder="搜索设备名称"
            size="small"
            clearable
            style="width: 220px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-input
            v-model="deviceSearchOwner"
            placeholder="搜索负责人"
            size="small"
            clearable
            style="width: 220px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="deviceStatus"
            placeholder="设备状态"
            size="small"
            clearable
            style="width: 220px"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
            <el-option label="在线" value="在线" />
            <el-option label="离线" value="离线" />
          </el-select>

          <el-select
            v-model="deviceLocation"
            placeholder="设备保管地点"
            size="small"
            clearable
            style="width: 220px"
          >
            <template #prefix>
              <el-icon><Location /></el-icon>
            </template>
            <el-option
              v-for="loc in locationOptions"
              :key="loc"
              :label="loc"
              :value="loc"
            />
          </el-select>

          <el-button type="primary" size="small" @click="onAddDevice">
            <el-icon class="icon-with-margin"><Plus /></el-icon>
            添加设备
          </el-button>
        </div>

        <el-table
          :data="deviceRows"
          stripe
          border
          size="small"
          class="table"
          style="margin-bottom: 16px"
          :row-class-name="deviceRowClassName"
          :row-style="row35Style"
          :cell-style="cell35Style"
        >
          <el-table-column prop="id" label="设备编号" min-width="120" />
          <el-table-column prop="name" label="设备名称" min-width="140" />
          <el-table-column
            prop="lastConnected"
            label="上次连接时间"
            min-width="160"
          />
          <el-table-column label="设备状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="row.status === '在线' ? 'success' : 'info'"
                effect="light"
                size="small"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="desc"
            label="设备描述"
            min-width="220"
            show-overflow-tooltip
          />
          <el-table-column
            prop="location"
            label="设备保管地点"
            min-width="140"
          />
          <el-table-column prop="owner" label="负责人" min-width="100" />
          <el-table-column label="操作" width="210">
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                plain
                @click="toggleConnect(row)"
              >
                {{ row.status === '在线' ? '断连' : '连接' }}
              </el-button>
              <el-button size="small" @click="onEditDevice(row)"
                >编辑</el-button
              >
              <el-button size="small" type="danger" @click="onDeleteDevice(row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            :current-page="devicePage"
            :page-size="PAGE_SIZE"
            :total="filteredDevices.length"
            background
            size="small"
            layout="prev, pager, next"
            @current-change="devicePage = $event"
            small
          />
        </div>
      </el-card>

      <!-- 医生信息（下：科室医生管理） -->
      <el-card shadow="hover" class="card wide">
        <template #header>
          <div class="card-header">科室医生管理</div>
        </template>

        <!-- 控制行：搜索工号 / 搜索姓名 / 搜索科室 / 搜索联系电话 / 选择职称 / 添加医生 -->
        <div class="controls-row">
          <el-input
            v-model="docSearchId"
            placeholder="搜索工号"
            clearable
            size="small"
            style="width: 220px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-input
            v-model="docSearchName"
            placeholder="搜索姓名"
            clearable
            size="small"
            style="width: 220px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-input
            v-model="docSearchDept"
            placeholder="搜索科室"
            clearable
            size="small"
            style="width: 220px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-input
            v-model="docSearchPhone"
            placeholder="搜索联系电话"
            clearable
            size="small"
            style="width: 220px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="docSearchTitle"
            placeholder="选择职称"
            clearable
            size="small"
            style="width: 220px"
          >
            <template #prefix>
              <el-icon><Filter /></el-icon>
            </template>
            <el-option
              v-for="t in docTitleOptions"
              :key="t"
              :label="t"
              :value="t"
            />
          </el-select>

          <el-button type="primary" size="small" @click="onAddDoctor">
            <el-icon class="icon-with-margin"><Plus /></el-icon>
            添加医生
          </el-button>
        </div>

        <!-- 表格样式与设备表格一致：border/size=small/35px 行高/占位空行 -->
        <el-table
          :data="doctorRows"
          stripe
          border
          size="small"
          class="table"
          style="margin-bottom: 16px"
          :row-class-name="docRowClassName"
          :row-style="row35Style"
          :cell-style="cell35Style"
        >
          <el-table-column prop="id" label="工号" min-width="100" />
          <el-table-column prop="name" label="姓名" min-width="100" />
          <el-table-column prop="dept" label="所属科室" min-width="120" />
          <el-table-column prop="title" label="职称" min-width="100" />
          <el-table-column prop="phone" label="联系电话" min-width="130" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button size="small" @click="() => onEditDoctor(row)"
                >编辑</el-button
              >
              <el-button
                size="small"
                type="danger"
                @click="() => onDeleteDoctor(row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            :current-page="docPage"
            :page-size="DOC_PAGE_SIZE"
            :total="filteredDoctors.length"
            background
            layout="prev, pager, next"
            @current-change="docPage = $event"
            small
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Link, Location, Filter } from '@element-plus/icons-vue'
import { deviceTable } from '@/mock/StatsData'

/** —— 公共 —— */
const PAGE_SIZE = 4

function formatYYYYMMDDHHMMSS(d: Date): string {
  const yy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const se = String(d.getSeconds()).padStart(2, '0')
  return `${yy}-${mm}-${dd} ${hh}:${mi}:${se}`
}

function row35Style() {
  return { height: '35px' }
}
function cell35Style() {
  return {
    paddingTop: '0px',
    paddingBottom: '0px',
    height: '35px',
    lineHeight: '35px',
  }
}

/** —— 设备信息 —— */
type Device = {
  id: string
  name: string
  lastConnected: string
  status: '在线' | '离线'
  desc: string
  location: string
  owner: string
}

const devices = reactive<Device[]>(
  deviceTable.map((d: any, idx: number) => ({
    id: d.id,
    name: d.name ?? `设备-${idx + 1}`,
    lastConnected: d.lastConnected,
    status: (d.status as '在线' | '离线') ?? '离线',
    desc: d.desc ?? '—',
    location: d.location ?? (idx % 2 === 0 ? '一号设备间' : '二号设备间'),
    owner: d.owner ?? (idx % 2 === 0 ? '王工' : '李工'),
  })),
)

const deviceSearchId = ref('')
const deviceSearchName = ref('')
const deviceSearchOwner = ref('')
const deviceStatus = ref<string>('') // '在线' | '离线' | ''
const deviceLocation = ref<string>('') // 地点 | ''
const locationOptions = computed(() => {
  const set = new Set(devices.map((d) => d.location).filter(Boolean))
  return Array.from(set)
})

const devicePage = ref(1)

const filteredDevices = computed(() => {
  return devices.filter((d) => {
    const idOk = !deviceSearchId.value || d.id.includes(deviceSearchId.value)
    const nameOk =
      !deviceSearchName.value || d.name.includes(deviceSearchName.value)
    const ownerOk =
      !deviceSearchOwner.value || d.owner.includes(deviceSearchOwner.value)
    const statusOk = !deviceStatus.value || d.status === deviceStatus.value
    const locOk = !deviceLocation.value || d.location === deviceLocation.value
    return idOk && nameOk && ownerOk && statusOk && locOk
  })
})

const paginatedDevices = computed(() => {
  const start = (devicePage.value - 1) * PAGE_SIZE
  return filteredDevices.value.slice(start, start + PAGE_SIZE)
})

const deviceRows = computed(() => {
  const rows = paginatedDevices.value
  const pad = PAGE_SIZE - rows.length
  if (pad <= 0) return rows
  const fillers = Array.from({ length: pad }, (_, i) => ({
    __filler: true,
    __key: `device-filler-${i}`,
  }))
  return rows.concat(fillers as any)
})
function deviceRowClassName({ row }: { row: any }) {
  return row.__filler ? 'is-filler' : ''
}

function onAddDevice() {
  ElMessage.info('新增设备（示例：请接入实际表单/弹窗）')
}
function onEditDevice(row: Device) {
  ElMessage.info(`编辑 ${row.name}`)
}
function onDeleteDevice(row: Device) {
  ElMessageBox.confirm(`确认删除 ${row.name}？`, '删除确认', {
    type: 'warning',
  }).then(() => ElMessage.success('已删除（模拟）'))
}
function toggleConnect(row: Device) {
  if (row.status === '在线') {
    row.status = '离线'
    ElMessage.info(`已断连：${row.name}`)
  } else {
    row.status = '在线'
    row.lastConnected = formatYYYYMMDDHHMMSS(new Date())
    ElMessage.success(`已连接：${row.name}`)
  }
}

/** —— 医生信息（对齐设备表格样式与占位行） —— */
type Doctor = {
  id: string
  name: string
  dept: string
  title: string
  phone: string
}

const doctorData = reactive<Doctor[]>([
  {
    id: 'D001',
    name: '王医生',
    dept: '神经内科',
    title: '主任医师',
    phone: '13800000001',
  },
  {
    id: 'D002',
    name: '李医生',
    dept: '康复医学科',
    title: '副主任医师',
    phone: '13800000002',
  },
  {
    id: 'D003',
    name: '赵医生',
    dept: '耳鼻咽喉科',
    title: '主治医师',
    phone: '13800000003',
  },
  {
    id: 'D004',
    name: '周医生',
    dept: '消化内科',
    title: '住院医师',
    phone: '13800000004',
  },
])

const DOC_PAGE_SIZE = 4
const docSearchId = ref('')
const docSearchName = ref('')
const docSearchDept = ref('')
const docSearchPhone = ref('')
const docSearchTitle = ref<string>('')

const docTitleOptions = computed(() => {
  const set = new Set(doctorData.map((d) => d.title).filter(Boolean))
  return Array.from(set)
})

const docPage = ref(1)

const filteredDoctors = computed(() => {
  return doctorData.filter((d) => {
    const idOk = !docSearchId.value || d.id.includes(docSearchId.value)
    const nameOk = !docSearchName.value || d.name.includes(docSearchName.value)
    const deptOk = !docSearchDept.value || d.dept.includes(docSearchDept.value)
    const phoneOk =
      !docSearchPhone.value || d.phone.includes(docSearchPhone.value)
    const titleOk = !docSearchTitle.value || d.title === docSearchTitle.value
    return idOk && nameOk && deptOk && phoneOk && titleOk
  })
})

const paginatedDoctors = computed(() => {
  const start = (docPage.value - 1) * DOC_PAGE_SIZE
  return filteredDoctors.value.slice(start, start + DOC_PAGE_SIZE)
})

// 占位空行（与设备表格一致）
const doctorRows = computed(() => {
  const rows = paginatedDoctors.value
  const pad = DOC_PAGE_SIZE - rows.length
  if (pad <= 0) return rows
  const fillers = Array.from({ length: pad }, (_, i) => ({
    __filler: true,
    __key: `doc-filler-${i}`,
  }))
  return rows.concat(fillers as any)
})
function docRowClassName({ row }: { row: any }) {
  return row.__filler ? 'is-filler' : ''
}

function onAddDoctor() {
  ElMessage.info('新增医生（示例：请接入实际表单/弹窗）')
}
function onEditDoctor(row: Doctor) {
  ElMessage.info(`编辑 ${row.name}`)
}
function onDeleteDoctor(row: Doctor) {
  ElMessageBox.confirm(`确认删除 ${row.name}？`, '删除确认', {
    type: 'warning',
  }).then(() => ElMessage.success('已删除（模拟）'))
}
</script>

<style scoped>
.system-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* 1304px 总宽度；上行单列设备卡片，下行医生卡片通栏 */
.grid-wrapper {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 1304px;
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

.wide {
  grid-column: 1 / -1;
}

.table {
  width: 100%;
  min-height: 160px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.icon-with-margin {
  margin-right: 4px;
}

/* 占位行隐藏内容：设备 & 医生表格通用 */
:deep(.el-table__body tr.is-filler .cell) {
  visibility: hidden;
  pointer-events: none;
}
</style>
