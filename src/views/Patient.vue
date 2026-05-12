<template>
  <div class="patient-container">
    <div class="grid-wrapper">
      <!-- 患者预约情况 -->
      <el-card shadow="hover" class="card">
        <template #header>
          <div class="card-header">患者预约情况</div>
        </template>

        <div class="controls-row appointment-controls">
          <el-date-picker
            v-model="apptSelectedDate"
            type="date"
            placeholder="请选择日期"
            :disabled-date="disabledDate"
            clearable
            size="small"
            style="width: 180px"
            @clear="onClearApptDate"
          />
          <el-input
            v-model="apptSearchName"
            placeholder="搜索患者"
            size="small"
            clearable
            style="width: 180px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-input
            v-model="apptSearchDept"
            placeholder="搜索科室"
            size="small"
            clearable
            style="width: 180px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" size="small" @click="onOpenCreateAppt">
            <el-icon class="icon-with-margin"><Plus /></el-icon>
            添加预约
          </el-button>
        </div>

        <!-- 患者表格 -->
        <el-table
          v-loading="apptLoading"
          :data="apptRows"
          stripe
          border
          size="small"
          class="table"
          style="margin-bottom: 16px"
          :row-class-name="apptRowClassName"
          :row-style="row35Style"
          :cell-style="cell35Style"
        >
          <el-table-column prop="id" label="就诊编号" min-width="150" show-overflow-tooltip />
          <el-table-column prop="name" label="患者姓名" min-width="70" show-overflow-tooltip />
          <el-table-column prop="dept" label="预约科室" min-width="90" show-overflow-tooltip />
          <el-table-column prop="time" label="预约时间" width="100" />
          <el-table-column label="操作" width="130">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <el-button size="small" @click="() => onOpenEditAppt(row)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="() => onDeleteAppt(row)"
                  >删除</el-button
                >
              </template>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页器 -->
        <div class="pagination-wrapper">
          <el-pagination
            :current-page="apptPage"
            :page-size="PAGE_SIZE"
            :total="apptTotal"
            background
            size="small"
            layout="prev, pager, next"
            @current-change="apptPage = $event"
          />
        </div>

        <!-- 添加预约对话框 -->
        <el-dialog
          v-model="createApptVisible"
          title="新增预约"
          width="520px"
          :close-on-click-modal="false"
        >
          <el-form
            ref="createApptRef"
            :model="createApptForm"
            :rules="createApptRules"
            label-width="96px"
          >
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="createApptForm.name"
                placeholder="请输入姓名"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="科室" prop="dept">
              <el-input
                v-model="createApptForm.dept"
                placeholder="请输入科室"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="预约时间" prop="time">
              <el-date-picker
                v-model="createApptForm.time"
                type="date"
                placeholder="请选择预约时间"
                :disabled-date="disabledPastDate"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="createApptVisible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="createApptSubmitting"
              @click="onCreateApptSubmit"
            >
              确认
            </el-button>
          </template>
        </el-dialog>

        <!-- 编辑预约对话框 -->
        <el-dialog
          v-model="editApptVisible"
          title="编辑预约信息"
          width="520px"
          :close-on-click-modal="false"
        >
          <el-form
            ref="editApptRef"
            :model="editApptForm"
            :rules="editApptRules"
            label-width="96px"
          >
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="editApptForm.name"
                placeholder="请输入姓名"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="科室" prop="dept">
              <el-input
                v-model="editApptForm.dept"
                placeholder="请输入科室"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="预约时间" prop="time">
              <el-date-picker
                v-model="editApptForm.time"
                type="date"
                placeholder="请选择预约时间"
                :disabled-date="disabledPastDate"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="editApptVisible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="editApptSubmitting"
              @click="onEditApptSubmit"
            >
              保存
            </el-button>
          </template>
        </el-dialog>
      </el-card>

      <!-- 患者检测记录 -->
      <el-card shadow="hover" class="card">
        <template #header>
          <div class="card-header">患者检测记录</div>
        </template>

        <div class="controls-row check-controls">
          <el-date-picker
            v-model="checkSelectedDate"
            type="date"
            placeholder="请选择日期"
            :disabled-date="checkDisabledDate"
            clearable
            size="small"
            style="width: 160px"
            @clear="onClearCheckDate"
          />

          <el-input
            v-model="checkSearchName"
            placeholder="搜索患者"
            size="small"
            clearable
            style="width: 160px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-input
            v-model="checkSearchStaff"
            placeholder="搜索检测者"
            size="small"
            clearable
            style="width: 160px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="checkResult"
            placeholder="选择检测结果"
            size="small"
            clearable
            style="width: 220px"
          >
            <template #prefix>
              <el-icon><Filter /></el-icon>
            </template>
            <el-option
              v-for="opt in CHECK_RESULT_OPTIONS"
              :key="opt"
              :label="opt"
              :value="opt"
            />
          </el-select>
        </div>

        <!-- 检测记录表格 -->
        <el-table
          v-loading="checkLoading"
          :data="checkRows"
          stripe
          border
          size="small"
          class="table"
          style="margin-bottom: 16px"
          :row-class-name="checkRowClassName"
          :row-style="row35Style"
          :cell-style="cell35Style"
        >
          <el-table-column prop="id" label="患者编号" min-width="120" show-overflow-tooltip />
          <el-table-column prop="name" label="患者姓名" min-width="90" show-overflow-tooltip />
          <el-table-column prop="staff" label="检测者" min-width="90" show-overflow-tooltip />
          <el-table-column label="检测结果" min-width="90">
            <template #default="{ row }">
              <el-tag
                :type="resultTagType(row.result)"
                effect="light"
                size="small"
              >
                {{ row.result }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="date" label="检测日期" width="120" />
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            :current-page="checkPage"
            :page-size="PAGE_SIZE"
            :total="checkTotal"
            background
            size="small"
            layout="prev, pager, next"
            @current-change="checkPage = $event"
          />
        </div>
      </el-card>

      <!-- 患者管理（通栏） -->
      <el-card shadow="hover" class="card wide">
        <template #header>
          <div class="card-header">患者管理</div>
        </template>

        <div class="filter-row patient-filter-row">

          <el-input
            v-model="patientSearchName"
            placeholder="搜索患者"
            clearable
            size="small"
            style="max-width: 160px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-input
            v-model="patientSearchDept"
            placeholder="搜索科室"
            clearable
            size="small"
            style="max-width: 160px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-date-picker
            v-model="patientSelectedDate"
            type="date"
            placeholder="选择入院日期"
            clearable
            size="small"
            style="max-width: 160px"
          />

          <el-date-picker
            v-model="patientOnsetDate"
            type="date"
            placeholder="选择发病日期"
            clearable
            size="small"
            style="max-width: 160px"
          />

          <el-input
            v-model="patientSearchBedNumber"
            placeholder="搜索病床号"
            clearable
            size="small"
            style="max-width: 160px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="patientGender"
            placeholder="选择性别"
            clearable
            size="small"
            style="max-width: 120px"
          >
            <template #prefix>
              <el-icon><Filter /></el-icon>
            </template>
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>

          <el-select
            v-model="patientChecked"
            placeholder="选择是否检测"
            clearable
            size="small"
            style="max-width: 140px"
          >
            <template #prefix>
              <el-icon><CircleCheck /></el-icon>
            </template>
            <el-option label="是" value="是" />
            <el-option label="否" value="否" />
          </el-select>

          <el-button type="primary" size="small" @click="onOpenCreate">
            <el-icon class="icon-with-margin"><Plus /></el-icon>
            添加患者
          </el-button>
        </div>

        <el-table
          v-loading="patientLoading"
          :data="patientRows"
          stripe
          border
          size="small"
          class="table"
          style="margin-bottom: 16px"
          :row-class-name="patientRowClassName"
          :row-style="row35Style"
          :cell-style="cell35Style"
        >
          <el-table-column prop="id" label="患者编号" min-width="120" show-overflow-tooltip />
          <el-table-column prop="name" label="姓名" min-width="80" show-overflow-tooltip />
          <el-table-column prop="gender" label="性别" min-width="50" />
          <el-table-column label="科室" min-width="110" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.dept ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="出生日期" min-width="100">
            <template #default="{ row }">
              {{ patientBirthLabel(row) }}
            </template>
          </el-table-column>
          <el-table-column prop="admit" label="入院日期" min-width="100" />
          <el-table-column label="是否检测" min-width="70">
            <template #default="{ row }">
              <el-tag
                :type="checkedTagType(checkedLabel(row.checked))"
                effect="light"
                size="small"
              >
                {{ checkedLabel(row.checked) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="发病日期" min-width="100">
            <template #default="{ row }">
              {{ row.onsetDate ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="既往史" min-width="100" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.pastHistory ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="病床号" min-width="90" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.bedNumber ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="病程" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.course ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <el-button size="small" @click="() => onOpenEdit(row)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="() => onDelete(row)"
                  >删除</el-button
                >
              </template>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            :current-page="patientPage"
            :page-size="PATIENT_PAGE_SIZE"
            :total="patientTotal"
            background
            size="small"
            layout="prev, pager, next"
            @current-change="patientPage = $event"
          />
        </div>
        <el-dialog
          v-model="createVisible"
          title="新增患者"
          width="520px"
          :close-on-click-modal="false"
          @closed="onCreateDialogClosed"
        >
          <el-form
            ref="createRef"
            :model="createForm"
            :rules="createRules"
            label-width="96px"
          >
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="createForm.name"
                placeholder="请输入姓名"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="性别" prop="gender">
              <el-select
                v-model="createForm.gender"
                placeholder="请选择"
                :validate-event="false"
              >
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>

            <el-form-item label="科室" prop="dept">
              <el-input
                v-model="createForm.dept"
                placeholder="请输入科室"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="身份证号码" prop="idCard">
              <el-input
                v-model="createForm.idCard"
                placeholder="请输入身份证号码"
                :validate-event="false"
              />
              <div v-if="createIdCardMeta" class="id-card-meta">
                出生日期：{{ createIdCardMeta.birth }} / 性别：{{ createIdCardMeta.gender }}
              </div>
            </el-form-item>

            <el-form-item label="发病日期" prop="onsetDate">
              <el-date-picker
                v-model="createForm.onsetDate"
                type="date"
                placeholder="请选择发病日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>

            <el-form-item label="既往史" prop="pastHistory">
              <el-input
                v-model="createForm.pastHistory"
                type="textarea"
                :rows="2"
                placeholder="请输入既往史"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="病床号" prop="bedNumber">
              <el-input
                v-model="createForm.bedNumber"
                placeholder="请输入病床号"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="病程" prop="course">
              <el-input
                v-model="createForm.course"
                type="textarea"
                :rows="2"
                placeholder="请输入病程"
                :validate-event="false"
              />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="createVisible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="createSubmitting"
              @click="onCreateSubmit"
            >
              确认
            </el-button>
          </template>
        </el-dialog>
        <el-dialog
          v-model="editVisible"
          title="编辑患者信息"
          width="520px"
          :close-on-click-modal="false"
        >
          <el-form
            ref="editRef"
            :model="editForm"
            :rules="editRules"
            label-width="96px"
          >
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="editForm.name"
                disabled
                placeholder="姓名建档后不可修改"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="性别" prop="gender">
              <el-select
                v-model="editForm.gender"
                disabled
                placeholder="性别建档后不可修改"
                :validate-event="false"
              >
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>

            <el-form-item label="科室" prop="dept">
              <el-input
                v-model="editForm.dept"
                placeholder="请输入科室"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="身份证号码" prop="idCard">
              <el-input
                v-model="editForm.idCard"
                disabled
                placeholder="身份证号码建档后不可修改"
                :validate-event="false"
              />
              <div v-if="editIdCardMeta" class="id-card-meta">
                出生日期：{{ editIdCardMeta.birth }} / 性别：{{ editIdCardMeta.gender }}
              </div>
            </el-form-item>

            <el-form-item label="发病日期" prop="onsetDate">
              <el-date-picker
                v-model="editForm.onsetDate"
                type="date"
                placeholder="请选择发病日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>

            <el-form-item label="既往史" prop="pastHistory">
              <el-input
                v-model="editForm.pastHistory"
                type="textarea"
                :rows="2"
                placeholder="请输入既往史"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="病床号" prop="bedNumber">
              <el-input
                v-model="editForm.bedNumber"
                placeholder="请输入病床号"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="病程" prop="course">
              <el-input
                v-model="editForm.course"
                type="textarea"
                :rows="2"
                placeholder="请输入病程"
                :validate-event="false"
              />
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="editVisible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="editSubmitting"
              @click="onEditSubmit"
            >
              保存
            </el-button>
          </template>
        </el-dialog>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Plus,
  Filter,
  CircleCheck,
} from '@element-plus/icons-vue'
import { listAppointments, createAppointment, updateAppointment, deleteAppointment } from '@/api/appointment'
import type { AppointmentRow } from '@/types/appointment'
import { listChecks } from '@/api/check'
import type { CheckRow, CheckResult } from '@/types/check'
import { listPatients } from '@/api/patient'
import type { PatientRow } from '@/types/patient'
import type { FormInstance, FormRules } from 'element-plus'
import { createPatient, updatePatient, deletePatient } from '@/api/patient'

/** —— 公用 —— */
function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const PAGE_SIZE = 3

const apptSelectedDate = ref<Date | null>(null)
const apptSearchName = ref('')
const apptSearchDept = ref('')
const apptPage = ref(1)

const apptTotal = ref(0)
const apptData = ref<AppointmentRow[]>([])
const apptLoading = ref(false)

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function todayLocal(): Date {
  return startOfDay(new Date())
}

const disabledPastDate = (time: Date) => time < todayLocal()

const disabledDate = (time: Date) => {
  const today = todayLocal()
  const twoWeeksEnd = startOfDay(new Date(today))
  twoWeeksEnd.setDate(today.getDate() + 14)
  return time < today || time > twoWeeksEnd
}

const validateApptDateFutureOrToday = (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (!value) {
    callback(new Error('请选择预约时间'))
    return
  }
  const todayStr = formatLocalDate(todayLocal())
  if (value < todayStr) {
    callback(new Error('预约时间必须为今天或之后'))
    return
  }
  callback()
}

const MAINLAND_ID_REGEX = /^\d{6}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/
const ID_CARD_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const ID_CARD_CHECKSUM = '10X98765432'

function normalizeIdCard(idCard: string): string {
  return idCard.trim().toUpperCase()
}

function isValidMainlandIdCard(idCard: string): boolean {
  const id = normalizeIdCard(idCard)
  if (!MAINLAND_ID_REGEX.test(id)) return false

  const year = Number(id.slice(6, 10))
  const month = Number(id.slice(10, 12))
  const day = Number(id.slice(12, 14))
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return false
  }

  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += Number(id[i]) * ID_CARD_WEIGHTS[i]
  }
  const expected = ID_CARD_CHECKSUM[sum % 11]
  return id[17] === expected
}

function birthFromIdCard(idCard?: string | null): string | null {
  if (!idCard || !isValidMainlandIdCard(idCard)) return null
  const id = normalizeIdCard(idCard)
  return `${id.slice(6, 10)}-${id.slice(10, 12)}-${id.slice(12, 14)}`
}

function genderFromIdCard(idCard?: string | null): '男' | '女' | null {
  if (!idCard || !isValidMainlandIdCard(idCard)) return null
  const seq = Number(normalizeIdCard(idCard)[16])
  return seq % 2 === 1 ? '男' : '女'
}

function idCardMeta(idCard?: string | null) {
  const birth = birthFromIdCard(idCard)
  const gender = genderFromIdCard(idCard)
  return birth && gender ? { birth, gender } : null
}

function patientBirthLabel(row: PatientRow): string {
  return row.birth || birthFromIdCard(row.idCard) || '-'
}

const validateMainlandIdCard = (_rule: any, value: string, callback: (error?: Error) => void) => {
  const id = String(value ?? '').trim()
  if (!id) {
    callback(new Error('请填写身份证号码'))
    return
  }
  if (!isValidMainlandIdCard(id)) {
    callback(new Error('请输入有效的中国大陆居民身份证号码'))
    return
  }
  callback()
}

function validateGenderWithIdCard(
  value: string,
  idCard: string,
  callback: (error?: Error) => void,
) {
  if (!value) {
    callback(new Error('请选择性别'))
    return
  }
  const inferred = genderFromIdCard(idCard)
  if (inferred && value !== inferred) {
    callback(new Error('性别与身份证信息不一致'))
    return
  }
  callback()
}

function onClearApptDate() {
  apptSelectedDate.value = null
  ElMessage.info('已清除日期，默认展示今日预约情况')
  apptPage.value = 1
  fetchAppointments()
}

async function fetchAppointments() {
  apptLoading.value = true
  try {
    const dateParam = apptSelectedDate.value
      ? formatLocalDate(apptSelectedDate.value)
      : formatLocalDate(todayLocal())
    const params = {
      page: apptPage.value,
      size: PAGE_SIZE,
      name: apptSearchName.value || undefined,
      dept: apptSearchDept.value || undefined,
      date: dateParam,
    }
    const data = await listAppointments(params)
    apptData.value = data.items
    apptTotal.value = data.total
  } finally {
    apptLoading.value = false
  }
}

onMounted(fetchAppointments)
watch(apptPage, () => fetchAppointments())
watch([apptSearchName, apptSearchDept, apptSelectedDate], () => {
  apptPage.value = 1
  fetchAppointments()
})

const apptRows = computed(() => {
  const rows = apptData.value as any[]
  const pad = PAGE_SIZE - rows.length
  if (pad <= 0) return rows
  const fillers = Array.from({ length: pad }, (_, i) => ({
    __filler: true,
    __key: `appt-filler-${i}`,
  }))
  return rows.concat(fillers as any)
})
function apptRowClassName({ row }: { row: any }) {
  return row.__filler ? 'is-filler' : ''
}

// 添加预约相关
const createApptVisible = ref(false)
const createApptSubmitting = ref(false)
const createApptRef = ref<FormInstance>()

const createApptForm = reactive({
  name: '',
  dept: '',
  time: '',
})

const createApptRules: FormRules = {
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  dept: [{ required: true, message: '请填写科室', trigger: 'blur' }],
  time: [{ validator: validateApptDateFutureOrToday, trigger: 'change' }],
}

const validateApptFieldSilently = (
  prop: 'name' | 'dept' | 'time',
) => {
  createApptRef.value?.validateField(prop, () => {})
}
const validateApptDebounced = debounce(validateApptFieldSilently, 200)

watch(
  () => createApptForm.name,
  () => validateApptDebounced('name'),
)
watch(
  () => createApptForm.dept,
  () => validateApptDebounced('dept'),
)
watch(
  () => createApptForm.time,
  () => validateApptDebounced('time'),
)

function resetCreateApptForm() {
  Object.assign(createApptForm, {
    name: '',
    dept: '',
    time: '',
  })
}

function onOpenCreateAppt() {
  resetCreateApptForm()
  createApptVisible.value = true
}

async function onCreateApptSubmit() {
  if (!createApptRef.value || createApptSubmitting.value) return
  const ok = await createApptRef.value.validate().catch(() => false)
  if (!ok) return

  createApptSubmitting.value = true
  try {
    const payload = {
      name: createApptForm.name.trim(),
      dept: createApptForm.dept.trim(),
      time: createApptForm.time,
    }
    const created = await createAppointment(payload)
    ElMessage.success(`添加成功（就诊编号：${created.id}）`)
    createApptVisible.value = false
    
    // 将日期选择器设置为新添加的预约日期，确保能看到新添加的预约
    if (createApptForm.time) {
      apptSelectedDate.value = new Date(createApptForm.time)
    }
    
    // 清除搜索条件，确保能看到新添加的预约
    apptSearchName.value = ''
    apptSearchDept.value = ''
    
    apptPage.value = 1
    fetchAppointments()
  } finally {
    createApptSubmitting.value = false
  }
}

// 编辑预约相关
const editApptVisible = ref(false)
const editApptSubmitting = ref(false)
const editApptRef = ref<FormInstance>()

const editApptForm = reactive({
  id: '',
  name: '',
  dept: '',
  time: '',
})

const editApptRules: FormRules = {
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  dept: [{ required: true, message: '请填写科室', trigger: 'blur' }],
  time: [{ validator: validateApptDateFutureOrToday, trigger: 'change' }],
}

const validateEditApptFieldSilently = (
  prop: 'name' | 'dept' | 'time',
) => {
  editApptRef.value?.validateField(prop, () => {})
}
const validateEditApptDebounced = debounce(validateEditApptFieldSilently, 200)

watch(
  () => editApptForm.name,
  () => validateEditApptDebounced('name'),
)
watch(
  () => editApptForm.dept,
  () => validateEditApptDebounced('dept'),
)
watch(
  () => editApptForm.time,
  () => validateEditApptDebounced('time'),
)

function onOpenEditAppt(row: AppointmentRow) {
  editApptForm.id = row.id
  editApptForm.name = row.name ?? ''
  editApptForm.dept = row.dept ?? ''
  editApptForm.time = row.time ?? ''
  editApptVisible.value = true
}

async function onEditApptSubmit() {
  if (!editApptRef.value || editApptSubmitting.value) return
  const ok = await editApptRef.value.validate().catch(() => false)
  if (!ok) return

  editApptSubmitting.value = true
  try {
    await updateAppointment(editApptForm.id, {
      name: editApptForm.name.trim(),
      dept: editApptForm.dept.trim(),
      time: editApptForm.time,
    })
    ElMessage.success('保存成功')
    editApptVisible.value = false
    await fetchAppointments()
  } finally {
    editApptSubmitting.value = false
  }
}

async function onDeleteAppt(row: AppointmentRow) {
  try {
    await ElMessageBox.confirm(
      `确认删除 ${row.name}（就诊编号：${row.id}）的预约？<br><strong>该操作不可撤销。</strong>`,
      '删除确认',
      {
        type: 'warning',
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        autofocus: false,
      },
    )

    await deleteAppointment(row.id)
    ElMessage.success('删除成功')

    const onlyOneOnPage =
      apptData.value.length === 1 && apptPage.value > 1
    if (onlyOneOnPage) {
      apptPage.value = apptPage.value - 1
    }
    await fetchAppointments()
  } catch (err: any) {
    if (err === 'cancel' || err === 'close') return
    const msg = err?.message || '删除失败'
    ElMessage.error(msg)
  }
}

type TagType = 'success' | 'warning' | 'danger' | 'info' | 'primary'
const CHECK_RESULT_OPTIONS: CheckResult[] = [
  '吞咽障碍',
  '显性误吸',
  '隐性误吸',
  '正常',
]
const resultTagType = (r: CheckResult): TagType => {
  const map: Record<CheckResult, TagType> = {
    吞咽障碍: 'info',
    显性误吸: 'warning',
    隐性误吸: 'danger',
    正常: 'success',
  }
  return map[r] ?? 'info'
}
const checkPage = ref(1)
const checkSelectedDate = ref<Date | null>(null)
const checkResult = ref<CheckResult | ''>('')
const checkSearchName = ref('')
const checkSearchStaff = ref('')

const checkTotal = ref(0)
const checkData = ref<CheckRow[]>([])
const checkLoading = ref(false)

const todayEnd = new Date()
todayEnd.setHours(23, 59, 59, 999)
const twoWeeksStart = new Date()
twoWeeksStart.setDate(twoWeeksStart.getDate() - 13)
twoWeeksStart.setHours(0, 0, 0, 0)

const checkDisabledDate = (time: Date) =>
  time < twoWeeksStart || time > todayEnd

function onClearCheckDate() {
  checkSelectedDate.value = null
  ElMessage.info('已清除日期，默认展示过去两周检测记录')
  checkPage.value = 1
  fetchChecks()
}

async function fetchChecks() {
  checkLoading.value = true
  try {
    const params = {
      page: checkPage.value,
      size: PAGE_SIZE,
      name: checkSearchName.value || undefined,
      staff: checkSearchStaff.value || undefined,
      result: checkResult.value || undefined,
      date: checkSelectedDate.value
        ? formatLocalDate(checkSelectedDate.value)
        : undefined,
    }
    const data = await listChecks(params)
    checkData.value = data.items
    checkTotal.value = data.total
  } finally {
    checkLoading.value = false
  }
}

onMounted(fetchChecks)
watch(checkPage, () => fetchChecks())
watch(
  [checkSelectedDate, checkResult, checkSearchName, checkSearchStaff],
  () => {
    checkPage.value = 1
    fetchChecks()
  },
)

const checkRows = computed(() => {
  const rows = checkData.value as any[]
  const pad = PAGE_SIZE - rows.length
  if (pad <= 0) return rows
  const fillers = Array.from({ length: pad }, (_, i) => ({
    __filler: true,
    __key: `check-filler-${i}`,
  }))
  return rows.concat(fillers as any)
})
function checkRowClassName({ row }: { row: any }) {
  return row.__filler ? 'is-filler' : ''
}

const patientSearchId = ref('')
const patientSearchName = ref('')
const patientSearchDept = ref('')
const patientSelectedDate = ref<Date | null>(null)
const patientOnsetDate = ref<Date | null>(null)
const patientSearchPastHistory = ref('')
const patientSearchBedNumber = ref('')
const patientSearchCourse = ref('')
const patientGender = ref<'男' | '女' | ''>('')
const patientChecked = ref<'是' | '否' | ''>('')

const patientPage = ref(1)
const PATIENT_PAGE_SIZE = 5

const patientTotal = ref(0)
const patientData = ref<PatientRow[]>([])
const patientLoading = ref(false)

const checkedLabel = (val: unknown): '是' | '否' =>
  val === true || val === '是' || val === 1 ? '是' : '否'
const checkedTagType = (label: '是' | '否'): TagType =>
  label === '是' ? 'success' : 'info'


async function fetchPatients() {
  patientLoading.value = true
  try {
    const genderParam: '男' | '女' | undefined =
      patientGender.value === '男' || patientGender.value === '女'
        ? patientGender.value
        : undefined

    const checkedParam: boolean | undefined =
      patientChecked.value === '是'
        ? true
        : patientChecked.value === '否'
          ? false
          : undefined

    const params = {
      page: patientPage.value,
      size: PATIENT_PAGE_SIZE,
      id: patientSearchId.value || undefined,
      name: patientSearchName.value || undefined,
      dept: patientSearchDept.value || undefined,
      gender: genderParam,
      checked: checkedParam,
      admit: patientSelectedDate.value
        ? formatLocalDate(patientSelectedDate.value)
        : undefined,
      onsetDate: patientOnsetDate.value
        ? formatLocalDate(patientOnsetDate.value)
        : undefined,
      pastHistory: patientSearchPastHistory.value || undefined,
      bedNumber: patientSearchBedNumber.value || undefined,
      course: patientSearchCourse.value || undefined,
    }

    const data = await listPatients(params)
    patientData.value = data.items
    patientTotal.value = data.total
  } finally {
    patientLoading.value = false
  }
}

onMounted(fetchPatients)
watch(patientPage, () => fetchPatients())
watch(
  [
    patientSearchId,
    patientSearchName,
    patientSearchDept,
    patientSelectedDate,
    patientOnsetDate,
    patientSearchPastHistory,
    patientSearchBedNumber,
    patientSearchCourse,
    patientGender,
    patientChecked,
  ],
  () => {
    patientPage.value = 1
    fetchPatients()
  },
  { deep: true },
)

const patientRows = computed(() => {
  const rows = patientData.value as any[]
  const pad = PATIENT_PAGE_SIZE - rows.length
  if (pad <= 0) return rows
  const fillers = Array.from({ length: pad }, (_, i) => ({
    __filler: true,
    __key: `filler-${i}`,
  }))
  return rows.concat(fillers as any)
})

function patientRowClassName({ row }: { row: any }) {
  return row.__filler ? 'is-filler' : ''
}

const createVisible = ref(false)
const createSubmitting = ref(false)
const createRef = ref<FormInstance>()
const createCloseFromSuccess = ref(false)
const createValidationSuspended = ref(false)

type PatientFormState = {
  name: string
  gender: '' | '男' | '女'
  dept: string
  idCard: string
  onsetDate: string
  pastHistory: string
  bedNumber: string
  course: string
}

function emptyPatientForm(): PatientFormState {
  return {
    name: '',
    gender: '',
    dept: '',
    idCard: '',
    onsetDate: '',
    pastHistory: '',
    bedNumber: '',
    course: '',
  }
}

const createForm = reactive<PatientFormState>(emptyPatientForm())
const createDraft = ref<PatientFormState | null>(null)

function snapshotCreateForm(): PatientFormState {
  return { ...createForm }
}

function isPatientFormBlank(form: PatientFormState): boolean {
  return Object.values(form).every((value) => String(value ?? '').trim() === '')
}

function applyCreateForm(form: PatientFormState) {
  createValidationSuspended.value = true
  Object.assign(createForm, form)
  nextTick(() => {
    createRef.value?.clearValidate()
    createValidationSuspended.value = false
  })
}

const createRules: FormRules = {
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  gender: [
    {
      validator: (_rule, value, callback) =>
        validateGenderWithIdCard(String(value ?? ''), createForm.idCard, callback),
      trigger: 'change',
    },
  ],
  dept: [{ required: true, message: '请填写科室', trigger: 'blur' }],
  idCard: [{ validator: validateMainlandIdCard, trigger: ['blur', 'change'] }],
  onsetDate: [{ required: true, message: '请选择发病日期', trigger: 'change' }],
  pastHistory: [{ required: true, message: '请填写既往史', trigger: 'blur' }],
  bedNumber: [{ required: true, message: '请填写病床号', trigger: 'blur' }],
  course: [{ required: true, message: '请填写病程', trigger: 'blur' }],
}

const createIdCardMeta = computed(() => idCardMeta(createForm.idCard))

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 200) {
  let t: number | undefined
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t)
    t = window.setTimeout(() => fn(...args), wait)
  }
}

const validateFieldSilently = (
  prop: 'name' | 'gender' | 'dept' | 'idCard' | 'onsetDate' | 'pastHistory' | 'bedNumber' | 'course',
) => {
  if (!createVisible.value || createValidationSuspended.value) return
  createRef.value?.validateField(prop, () => {})
}
const validateDebounced = debounce(validateFieldSilently, 200)

function queueCreateValidation(
  prop: 'name' | 'gender' | 'dept' | 'idCard' | 'onsetDate' | 'pastHistory' | 'bedNumber' | 'course',
) {
  if (!createVisible.value || createValidationSuspended.value) return
  validateDebounced(prop)
}

watch(
  () => createForm.name,
  () => queueCreateValidation('name'),
)
watch(
  () => createForm.gender,
  () => queueCreateValidation('gender'),
)
watch(
  () => createForm.dept,
  () => queueCreateValidation('dept'),
)
watch(
  () => createForm.idCard,
  (value) => {
    const inferred = genderFromIdCard(value)
    if (inferred) createForm.gender = inferred
    queueCreateValidation('idCard')
    queueCreateValidation('gender')
  },
)
watch(
  () => createForm.onsetDate,
  () => queueCreateValidation('onsetDate'),
)
watch(
  () => createForm.pastHistory,
  () => queueCreateValidation('pastHistory'),
)
watch(
  () => createForm.bedNumber,
  () => queueCreateValidation('bedNumber'),
)
watch(
  () => createForm.course,
  () => queueCreateValidation('course'),
)

function resetCreateForm() {
  applyCreateForm(emptyPatientForm())
}

function onOpenCreate() {
  applyCreateForm(createDraft.value ?? emptyPatientForm())
  createVisible.value = true
}

function onCreateDialogClosed() {
  if (createCloseFromSuccess.value) {
    createCloseFromSuccess.value = false
    createDraft.value = null
    resetCreateForm()
    return
  }

  const snapshot = snapshotCreateForm()
  if (isPatientFormBlank(snapshot)) {
    createDraft.value = null
    resetCreateForm()
    return
  }

  createDraft.value = snapshot
  createRef.value?.clearValidate()
}

async function onCreateSubmit() {
  if (!createRef.value || createSubmitting.value) return
  const ok = await createRef.value.validate().catch(() => false)
  if (!ok) return

  createSubmitting.value = true
  try {
    const payload = {
      name: createForm.name.trim(),
      gender: createForm.gender as '男' | '女',
      dept: createForm.dept.trim(),
      idCard: createForm.idCard.trim(),
      onsetDate: createForm.onsetDate,
      pastHistory: createForm.pastHistory.trim(),
      bedNumber: createForm.bedNumber.trim(),
      course: createForm.course.trim(),
    }
    const created = await createPatient(payload)
    ElMessage.success(`添加成功（患者编号：${created.id}）`)
    createDraft.value = null
    createCloseFromSuccess.value = true
    createVisible.value = false
    patientPage.value = 1
    fetchPatients()
  } finally {
    createSubmitting.value = false
  }
}

const editVisible = ref(false)
const editSubmitting = ref(false)
const editRef = ref<FormInstance>()

const editForm = reactive({
  id: '',
  name: '',
  gender: '' as '' | '男' | '女',
  dept: '',
  idCard: '',
  onsetDate: '',
  pastHistory: '',
  bedNumber: '',
  course: '',
})

const editRules: FormRules = {
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  gender: [
    {
      validator: (_rule, value, callback) =>
        validateGenderWithIdCard(String(value ?? ''), editForm.idCard, callback),
      trigger: 'change',
    },
  ],
  dept: [{ required: true, message: '请填写科室', trigger: 'blur' }],
  idCard: [{ validator: validateMainlandIdCard, trigger: ['blur', 'change'] }],
  onsetDate: [{ required: true, message: '请选择发病日期', trigger: 'change' }],
  pastHistory: [{ required: true, message: '请填写既往史', trigger: 'blur' }],
  bedNumber: [{ required: true, message: '请填写病床号', trigger: 'blur' }],
  course: [{ required: true, message: '请填写病程', trigger: 'blur' }],
}

const editIdCardMeta = computed(() => idCardMeta(editForm.idCard))

const validateFieldSilentlyEdit = (
  prop: 'name' | 'gender' | 'dept' | 'idCard' | 'onsetDate' | 'pastHistory' | 'bedNumber' | 'course',
) => {
  editRef.value?.validateField(prop, () => {})
}
const validateEditDebounced = debounce(validateFieldSilentlyEdit, 200)

watch(
  () => editForm.name,
  () => validateEditDebounced('name'),
)
watch(
  () => editForm.gender,
  () => validateEditDebounced('gender'),
)
watch(
  () => editForm.dept,
  () => validateEditDebounced('dept'),
)
watch(
  () => editForm.idCard,
  (value) => {
    const inferred = genderFromIdCard(value)
    if (inferred) editForm.gender = inferred
    validateEditDebounced('idCard')
    validateEditDebounced('gender')
  },
)
watch(
  () => editForm.onsetDate,
  () => validateEditDebounced('onsetDate'),
)
watch(
  () => editForm.pastHistory,
  () => validateEditDebounced('pastHistory'),
)
watch(
  () => editForm.bedNumber,
  () => validateEditDebounced('bedNumber'),
)
watch(
  () => editForm.course,
  () => validateEditDebounced('course'),
)

function onOpenEdit(row: PatientRow) {
  editForm.id = row.id
  editForm.name = row.name ?? ''
  editForm.gender = (row.gender ?? '') as '' | '男' | '女'
  editForm.dept = row.dept ?? ''
  editForm.idCard = row.idCard ?? ''
  editForm.onsetDate = row.onsetDate ?? ''
  editForm.pastHistory = row.pastHistory ?? ''
  editForm.bedNumber = row.bedNumber ?? ''
  editForm.course = row.course ?? ''
  editVisible.value = true
}

async function onEditSubmit() {
  if (!editRef.value || editSubmitting.value) return
  const ok = await editRef.value.validate().catch(() => false)
  if (!ok) return

  editSubmitting.value = true
  try {
    await updatePatient(editForm.id, {
      name: editForm.name.trim(),
      gender: editForm.gender as '男' | '女',
      dept: editForm.dept.trim(),
      idCard: editForm.idCard.trim(),
      onsetDate: editForm.onsetDate,
      pastHistory: editForm.pastHistory.trim(),
      bedNumber: editForm.bedNumber.trim(),
      course: editForm.course.trim(),
    })
    ElMessage.success('保存成功')
    editVisible.value = false
    await fetchPatients()
  } finally {
    editSubmitting.value = false
  }
}

async function onDelete(row: PatientRow) {
  try {
    await ElMessageBox.confirm(
      `确认删除 ${row.name}（患者编号：${row.id}）？<br><strong>该操作不可撤销。</strong>`,
      '删除确认',
      {
        type: 'warning',
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        autofocus: false,
      },
    )

    await deletePatient(row.id)
    ElMessage.success('删除成功')

    const onlyOneOnPage =
      patientData.value.length === 1 && patientPage.value > 1
    if (onlyOneOnPage) {
      patientPage.value = patientPage.value - 1
    }
    await fetchPatients()
  } catch (err: any) {
    if (err === 'cancel' || err === 'close') return
    const msg = err?.message || '删除失败'
    ElMessage.error(msg)
  }
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
</script>

<style scoped>
.patient-container {
  width: 100%;
  display: flex;
  justify-content: center;
}
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
}
.pagination-wrapper {
  display: flex;
  justify-content: center;
}
.controls-row {
  display: grid;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}
.appointment-controls {
  grid-template-columns: repeat(3, minmax(0, 1fr)) max-content;
}
.check-controls {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.filter-row {
  display: grid;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}
.patient-filter-row {
  grid-template-columns: repeat(7, minmax(0, 1fr)) max-content;
}
.controls-row > :deep(.el-input),
.controls-row > :deep(.el-select),
.controls-row > :deep(.el-date-editor),
.filter-row > :deep(.el-input),
.filter-row > :deep(.el-select),
.filter-row > :deep(.el-date-editor) {
  width: 100% !important;
  max-width: none !important;
  min-width: 0;
}
.icon-with-margin {
  margin-right: 4px;
}
.id-card-meta {
  width: 100%;
  margin-top: 6px;
  color: #606266;
  font-size: 12px;
  line-height: 1.4;
}
:deep(.el-table__body tr.is-filler .cell) {
  visibility: hidden;
  pointer-events: none;
}
@media (max-width: 1200px) {
  .appointment-controls,
  .check-controls,
  .patient-filter-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
