<template>
  <div class="patient-container">
    <div class="grid-wrapper">
      <!-- 患者预约情况 -->
      <el-card shadow="hover" class="card">
        <template #header>
          <div class="card-header">患者预约情况</div>
        </template>

        <div class="controls-row">
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
          <el-table-column prop="id" label="就诊编号" min-width="120" />
          <el-table-column label="患者姓名" min-width="120">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <el-icon
                  class="bell-icon"
                  :class="{ disabled: isCalling && !callingIds.has(row.id) }"
                  @click="
                    (!isCalling || callingIds.has(row.id)) &&
                    callPatient({ id: row.id, name: row.name })
                  "
                >
                  <component :is="callingIds.has(row.id) ? BellFilled : Bell" />
                </el-icon>

                <span>{{ row.name }}</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="dept" label="预约科室" min-width="120" />
          <el-table-column prop="time" label="预约时间" width="150" />
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
      </el-card>

      <!-- 患者检测记录 -->
      <el-card shadow="hover" class="card">
        <template #header>
          <div class="card-header">患者检测记录</div>
        </template>

        <div class="controls-row">
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
          <el-table-column prop="id" label="患者编号" min-width="120" />
          <el-table-column prop="name" label="患者姓名" min-width="90" />
          <el-table-column prop="staff" label="检测者" min-width="90" />
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

        <div class="filter-row">
          <el-input
            v-model="patientSearchId"
            placeholder="搜索患者编号"
            clearable
            size="small"
            style="max-width: 160px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-input
            v-model="patientSearchName"
            placeholder="搜索患者姓名"
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

          <el-input
            v-model="patientSearchAddress"
            placeholder="搜索家庭住址"
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
          <el-table-column prop="id" label="患者编号" min-width="120" />
          <el-table-column prop="name" label="姓名" min-width="80" />
          <el-table-column prop="gender" label="性别" min-width="60" />
          <el-table-column prop="age" label="年龄" min-width="60" />
          <el-table-column prop="birth" label="出生日期" min-width="100" />
          <el-table-column prop="admit" label="入院日期" min-width="100" />
          <el-table-column label="所属科室" min-width="100">
            <template #default="{ row }">
              {{ row.dept ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="是否检测" min-width="80">
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
          <el-table-column
            prop="address"
            label="家庭住址"
            min-width="300"
            show-overflow-tooltip
          />
          <el-table-column label="操作" width="150">
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

            <el-form-item label="出生日期" prop="birth" :validate-event="false">
              <el-date-picker
                v-model="createForm.birth"
                type="date"
                placeholder="请选择出生日期"
                style="width: 100%"
                :disabled-date="disableFutureBirth"
              />
            </el-form-item>

            <el-form-item label="所属科室" prop="dept">
              <el-input
                v-model="createForm.dept"
                placeholder="请输入所属科室"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="是否检测" prop="checked">
              <el-select
                v-model="createForm.checked"
                placeholder="请选择"
                :validate-event="false"
              >
                <el-option label="是" value="是" />
                <el-option label="否" value="否" />
              </el-select>
            </el-form-item>

            <el-form-item label="家庭住址" prop="address">
              <el-input
                v-model="createForm.address"
                type="textarea"
                :rows="2"
                placeholder="请输入家庭住址"
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
            <el-form-item label="所属科室" prop="dept">
              <el-input
                v-model="editForm.dept"
                placeholder="请输入所属科室"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="家庭住址" prop="address">
              <el-input
                v-model="editForm.address"
                type="textarea"
                :rows="2"
                placeholder="请输入家庭住址"
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
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell,
  BellFilled,
  Search,
  Plus,
  Filter,
  CircleCheck,
} from '@element-plus/icons-vue'
import { listAppointments } from '@/api/appointment'
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

const callingIds = reactive(new Set<string>())
const isCalling = computed(() => callingIds.size > 0)

function callPatient(row: { id: string; name: string }) {
  if (callingIds.has(row.id)) {
    callingIds.delete(row.id)
    return
  }
  callingIds.clear()
  callingIds.add(row.id)

  ElMessage.info(`呼叫预约患者：${row.name}，就诊编号：${row.id}`)
  setTimeout(() => {
    callingIds.delete(row.id)
  }, 3000)
}

const disabledDate = (time: Date) => {
  const today = todayLocal()
  const twoWeeksEnd = startOfDay(new Date(today))
  twoWeeksEnd.setDate(today.getDate() + 14)
  return time < today || time > twoWeeksEnd
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
const patientSearchAddress = ref('')
const patientSelectedDate = ref<Date | null>(null)
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

const disableFutureBirth = (d: Date): boolean => d.getTime() > Date.now()

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
      address: patientSearchAddress.value || undefined,
      gender: genderParam,
      checked: checkedParam,
      admit: patientSelectedDate.value
        ? formatLocalDate(patientSelectedDate.value)
        : undefined,
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
    patientSearchAddress,
    patientSelectedDate,
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

const createForm = reactive({
  name: '',
  gender: '' as '' | '男' | '女',
  birth: null as Date | null,
  dept: '',
  checked: '' as '' | '是' | '否',
  address: '',
})

const createRules: FormRules = {
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  birth: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  dept: [{ required: true, message: '请填写所属科室', trigger: 'blur' }],
  checked: [{ required: true, message: '请选择是否检测', trigger: 'change' }],
  address: [{ required: true, message: '请填写家庭住址', trigger: 'blur' }],
}

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 200) {
  let t: number | undefined
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t)
    t = window.setTimeout(() => fn(...args), wait)
  }
}

const validateFieldSilently = (
  prop: 'name' | 'gender' | 'birth' | 'dept' | 'checked' | 'address',
) => {
  createRef.value?.validateField(prop, () => {})
}
const validateDebounced = debounce(validateFieldSilently, 200)

watch(
  () => createForm.name,
  () => validateDebounced('name'),
)
watch(
  () => createForm.gender,
  () => validateDebounced('gender'),
)
watch(
  () => createForm.birth,
  () => validateDebounced('birth'),
)
watch(
  () => createForm.dept,
  () => validateDebounced('dept'),
)
watch(
  () => createForm.checked,
  () => validateDebounced('checked'),
)
watch(
  () => createForm.address,
  () => validateDebounced('address'),
)

function resetCreateForm() {
  Object.assign(createForm, {
    name: '',
    gender: '' as '' | '男' | '女',
    birth: null as Date | null,
    dept: '',
    checked: '' as '' | '是' | '否',
    address: '',
  })
}

function onOpenCreate() {
  resetCreateForm()
  createVisible.value = true
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
      birth: formatLocalDate(createForm.birth as Date),
      dept: createForm.dept.trim(),
      address: createForm.address.trim(),
      checked: createForm.checked === '是',
    }
    const created = await createPatient(payload)
    ElMessage.success(`添加成功（患者编号：${created.id}）`)
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
  dept: '',
  address: '',
})

const editRules: FormRules = {
  dept: [{ required: true, message: '请填写所属科室', trigger: 'blur' }],
  address: [{ required: true, message: '请填写家庭住址', trigger: 'blur' }],
}

const validateFieldSilentlyEdit = (prop: 'dept' | 'address') => {
  editRef.value?.validateField(prop, () => {})
}
const validateEditDebounced = debounce(validateFieldSilentlyEdit, 200)

watch(
  () => editForm.dept,
  () => validateEditDebounced('dept'),
)
watch(
  () => editForm.address,
  () => validateEditDebounced('address'),
)

function onOpenEdit(row: PatientRow) {
  editForm.id = row.id
  editForm.dept = row.dept ?? ''
  editForm.address = row.address ?? ''
  editVisible.value = true
}

async function onEditSubmit() {
  if (!editRef.value || editSubmitting.value) return
  const ok = await editRef.value.validate().catch(() => false)
  if (!ok) return

  editSubmitting.value = true
  try {
    await updatePatient(editForm.id, {
      dept: editForm.dept.trim(),
      address: editForm.address.trim(),
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}
.bell-icon {
  margin-right: 8px;
  cursor: pointer;
}
.bell-icon.disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
:deep(.el-table__body tr.is-filler .cell) {
  visibility: hidden;
  pointer-events: none;
}
</style>
