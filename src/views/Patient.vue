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
          <el-table-column prop="id" label="就诊编号" min-width="120" />
          <el-table-column prop="name" label="患者姓名" min-width="80" />
          <el-table-column prop="dept" label="预约科室" min-width="80" />
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
          <el-table-column prop="id" label="患者编号" min-width="120" />
          <el-table-column prop="name" label="姓名" min-width="80" />
          <el-table-column prop="gender" label="性别" min-width="50" />
          <el-table-column label="科室" min-width="80">
            <template #default="{ row }">
              {{ row.dept ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="身份证" min-width="140">
            <template #default="{ row }">
              {{ row.idCard ?? '-' }}
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
          <el-table-column label="既往史" min-width="145">
            <template #default="{ row }">
              <el-popover
                v-if="row.pastHistory && row.pastHistory.length > 20"
                placement="top-start"
                trigger="hover"
                :width="400"
                :offset="15"
                popper-class="patient-tooltip-popover"
              >
                <template #reference>
                  <div class="table-cell-text">
                    {{ row.pastHistory }}
                  </div>
                </template>
                <div class="tooltip-content">{{ row.pastHistory }}</div>
              </el-popover>
              <span v-else>{{ row.pastHistory ?? '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="病床号" min-width="60">
            <template #default="{ row }">
              {{ row.bedNumber ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="病程" min-width="145">
            <template #default="{ row }">
              <el-popover
                v-if="row.course && row.course.length > 20"
                placement="top-start"
                trigger="hover"
                :width="400"
                :offset="15"
                popper-class="patient-tooltip-popover"
              >
                <template #reference>
                  <div class="table-cell-text">
                    {{ row.course }}
                  </div>
                </template>
                <div class="tooltip-content">{{ row.course }}</div>
              </el-popover>
              <span v-else>{{ row.course ?? '-' }}</span>
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

            <el-form-item label="身份证" prop="idCard">
              <el-input
                v-model="createForm.idCard"
                placeholder="请输入身份证号"
                :validate-event="false"
              />
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
                :rows="4"
                placeholder="请输入既往史"
                :validate-event="false"
                class="past-history-textarea"
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
                :rows="4"
                placeholder="请输入病程"
                :validate-event="false"
                class="course-textarea"
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
                placeholder="请输入姓名"
                :validate-event="false"
              />
            </el-form-item>

            <el-form-item label="性别" prop="gender">
              <el-select
                v-model="editForm.gender"
                placeholder="请选择"
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

            <el-form-item label="身份证" prop="idCard">
              <el-input
                v-model="editForm.idCard"
                placeholder="请输入身份证号"
                :validate-event="false"
              />
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
                :rows="4"
                placeholder="请输入既往史"
                :validate-event="false"
                class="past-history-textarea"
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
                :rows="4"
                placeholder="请输入病程"
                :validate-event="false"
                class="course-textarea"
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
  time: [{ required: true, message: '请选择预约时间', trigger: 'change' }],
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
  time: [{ required: true, message: '请选择预约时间', trigger: 'change' }],
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

const createForm = reactive({
  name: '',
  gender: '' as '' | '男' | '女',
  dept: '',
  idCard: '',
  onsetDate: '',
  pastHistory: '',
  bedNumber: '',
  course: '',
})

const createRules: FormRules = {
  name: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  dept: [{ required: true, message: '请填写科室', trigger: 'blur' }],
  idCard: [{ required: true, message: '请填写身份证号', trigger: 'blur' }],
  onsetDate: [{ required: true, message: '请选择发病日期', trigger: 'change' }],
  pastHistory: [{ required: true, message: '请填写既往史', trigger: 'blur' }],
  bedNumber: [{ required: true, message: '请填写病床号', trigger: 'blur' }],
  course: [{ required: true, message: '请填写病程', trigger: 'blur' }],
}

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
  () => createForm.dept,
  () => validateDebounced('dept'),
)
watch(
  () => createForm.idCard,
  () => validateDebounced('idCard'),
)
watch(
  () => createForm.onsetDate,
  () => validateDebounced('onsetDate'),
)
watch(
  () => createForm.pastHistory,
  () => validateDebounced('pastHistory'),
)
watch(
  () => createForm.bedNumber,
  () => validateDebounced('bedNumber'),
)
watch(
  () => createForm.course,
  () => validateDebounced('course'),
)

function resetCreateForm() {
  Object.assign(createForm, {
    name: '',
    gender: '' as '' | '男' | '女',
    dept: '',
    idCard: '',
    onsetDate: '',
    pastHistory: '',
    bedNumber: '',
    course: '',
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
      dept: createForm.dept.trim(),
      idCard: createForm.idCard.trim(),
      onsetDate: createForm.onsetDate,
      pastHistory: createForm.pastHistory.trim(),
      bedNumber: createForm.bedNumber.trim(),
      course: createForm.course.trim(),
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
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  dept: [{ required: true, message: '请填写科室', trigger: 'blur' }],
  idCard: [{ required: true, message: '请填写身份证号', trigger: 'blur' }],
  onsetDate: [{ required: true, message: '请选择发病日期', trigger: 'change' }],
  pastHistory: [{ required: true, message: '请填写既往史', trigger: 'blur' }],
  bedNumber: [{ required: true, message: '请填写病床号', trigger: 'blur' }],
  course: [{ required: true, message: '请填写病程', trigger: 'blur' }],
}

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
  () => validateEditDebounced('idCard'),
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
:deep(.el-table__body tr.is-filler .cell) {
  visibility: hidden;
  pointer-events: none;
}

/* 既往史和病程文本框样式 */
:deep(.past-history-textarea .el-textarea__inner),
:deep(.course-textarea .el-textarea__inner) {
  min-height: 100px;
  font-size: 14px;
  line-height: 1.6;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fafafa;
  color: #606266;
  resize: vertical;
}

:deep(.past-history-textarea .el-textarea__inner:focus),
:deep(.course-textarea .el-textarea__inner:focus) {
  border-color: #409eff;
  background-color: #ffffff;
  color: #303133;
}

:deep(.past-history-textarea .el-textarea__inner:hover),
:deep(.course-textarea .el-textarea__inner:hover) {
  border-color: #c0c4cc;
}

/* 表格单元格文本样式 */
.table-cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

/* tooltip 内容样式 - 保留换行 */
.tooltip-content {
  white-space: pre-line;
  word-wrap: break-word;
  max-width: 400px;
}
</style>

<style>
/* 表格悬停显示的完整内容 popover 样式 - 全局样式 */
.el-popover.patient-tooltip-popover {
  max-width: 400px;
  padding: 12px 16px;
  background-color: #ffffff;
  color: #303133;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  border: 1px solid #e4e7ed;
  pointer-events: none;
}

.el-popover.patient-tooltip-popover .tooltip-content {
  white-space: pre-line;
  word-wrap: break-word;
  color: #303133;
}
</style>
