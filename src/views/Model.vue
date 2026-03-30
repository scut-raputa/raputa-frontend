<template>
  <div class="model-container">
    <div class="grid-wrapper">
      <!-- 统计卡片 1：模型总数 -->
      <el-card shadow="hover" class="stat-card">
        <div class="stat-body">
          <div class="stat-left">
            <el-statistic :value="stats.totalCount">
              <template #title>
                <div class="stat-title">
                  模型总数
                  <el-tooltip effect="dark" content="当前系统模型总数" placement="top">
                    <el-icon :size="12" class="stat-icon"><Warning /></el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-statistic>
            <div class="stat-note primary">本周新增: {{ stats.weekNewCount }}</div>
          </div>

          <div class="stat-right">
            <el-progress
              type="dashboard"
              :percentage="card1Percentage"
              :stroke-width="8"
              color="#409EFF"
              :width="120"
            >
              <template #default>
                <span class="circle-number">{{ stats.weekNewCount }}</span>
                <span class="circle-label">本周新增</span>
              </template>
            </el-progress>
          </div>
        </div>
      </el-card>

      <!-- 统计卡片 2：本周新增 -->
      <el-card shadow="hover" class="stat-card">
        <div class="stat-body">
          <div class="stat-left">
            <el-statistic :value="stats.weekNewCount">
              <template #title>
                <div class="stat-title">
                  本周新增
                  <el-tooltip effect="dark" content="本周上传的新模型数量" placement="top">
                    <el-icon :size="12" class="stat-icon"><Warning /></el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-statistic>
            <div :class="['stat-note', weekGrowth >= 0 ? 'success' : 'danger']">
              {{ weekGrowth >= 0 ? '较上周增加' : '较上周减少' }}{{ Math.abs(weekGrowth) }}%
            </div>
          </div>

          <div class="stat-right">
            <el-progress
              type="dashboard"
              :percentage="Math.min(100, Math.abs(weekGrowth))"
              :stroke-width="8"
              :color="weekGrowth >= 0 ? '#67C23A' : '#F56C6C'"
              :width="120"
            >
              <template #default>
                <span class="circle-number" :style="{ color: weekGrowth >= 0 ? '#67C23A' : '#F56C6C' }">
                  {{ weekGrowth >= 0 ? '+' : '' }}{{ weekGrowth }}%
                </span>
                <span class="circle-label">较上周</span>
              </template>
            </el-progress>
          </div>
        </div>
      </el-card>

      <!-- 统计卡片 3：最活跃上传者 -->
      <el-card shadow="hover" class="stat-card">
        <div class="stat-body">
          <div class="stat-left">
            <div class="stat-title">
              最活跃上传者
              <el-tooltip effect="dark" content="上传模型最多的用户" placement="top">
                <el-icon :size="12" class="stat-icon"><Warning /></el-icon>
              </el-tooltip>
            </div>
            <div class="stat-value">{{ stats.topUploader ?? '暂无' }}</div>
            <div class="stat-note warning">上传模型总数: {{ stats.topUploaderCount }}</div>
          </div>

          <div class="stat-right">
            <el-progress
              type="dashboard"
              :percentage="Math.round(stats.topUploaderRatio * 100)"
              :stroke-width="8"
              color="#e6a23c"
              :width="120"
            >
              <template #default>
                <span class="circle-number">{{ Math.round(stats.topUploaderRatio * 100) }}%</span>
                <span class="circle-label">贡献占比</span>
              </template>
            </el-progress>
          </div>
        </div>
      </el-card>

      <!-- 模型管理表格 -->
      <el-card shadow="hover" class="table-card">
        <template #header>
          <div class="card-header">模型管理</div>
        </template>

        <div class="filter-row">
          <el-input
            v-model="searchId"
            placeholder="搜索模型编号"
            clearable
            size="small"
            style="max-width: 200px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-input
            v-model="searchFunction"
            placeholder="搜索模型功能"
            clearable
            size="small"
            style="max-width: 200px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-input
            v-model="searchName"
            placeholder="搜索模型名称"
            clearable
            size="small"
            style="max-width: 200px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-input
            v-model="searchUploader"
            placeholder="搜索上传者"
            clearable
            size="small"
            style="max-width: 200px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-date-picker
            v-model="searchTime"
            type="date"
            placeholder="选择上传时间"
            clearable
            size="small"
            :disabled-date="disabledFuture"
            style="max-width: 200px"
          />

          <el-button type="primary" size="small" @click="openCreateDialog">
            <el-icon class="icon-with-margin"><Plus /></el-icon>
            新增模型
          </el-button>
        </div>

        <el-table
          v-loading="modelLoading"
          :data="modelRows"
          stripe
          border
          size="small"
          class="model-table"
          style="margin-bottom: 16px"
          :row-style="row35Style"
          :cell-style="cell35Style"
          :row-class-name="modelRowClassName"
        >
          <el-table-column label="模型编号" min-width="120">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <span>{{ row.id }}</span>
                <el-popover
                  placement="top"
                  trigger="hover"
                  :show-after="80"
                  :hide-after="80"
                  popper-class="radar-popover"
                  width="auto"
                  v-model:visible="metricsVisible[row.id]"
                >
                  <template #default>
                    <div class="radar-title">模型性能概览</div>
                    <div class="radar-popover-body">
                      <RadarMini
                        :accuracy="row.accuracy"
                        :sensitivity="row.sensitivity"
                        :specificity="row.specificity"
                        :visible="!!metricsVisible[row.id]"
                      />
                      <ul class="radar-vals">
                        <li>
                          准确率：{{
                            row.accuracy == null
                              ? '暂无'
                              : (row.accuracy * 100).toFixed(2) + '%'
                          }}
                        </li>
                        <li>
                          敏感度：{{
                            row.sensitivity == null
                              ? '暂无'
                              : (row.sensitivity * 100).toFixed(2) + '%'
                          }}
                        </li>
                        <li>
                          特异度：{{
                            row.specificity == null
                              ? '暂无'
                              : (row.specificity * 100).toFixed(2) + '%'
                          }}
                        </li>
                      </ul>
                    </div>
                  </template>

                  <template #reference>
                    <el-icon class="metrics-icon" style="margin-left: 4px">
                      <InfoFilled />
                    </el-icon>
                  </template>
                </el-popover>
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="func" label="模型功能" min-width="120" />
          <el-table-column prop="name" label="模型名称" min-width="180" />
          <el-table-column
            prop="uploadTime"
            label="上传时间"
            min-width="140"
            :formatter="uploadTimeFormatter"
          />
          <el-table-column prop="uploader" label="上传者" min-width="120" />
          <el-table-column prop="remark" label="备注信息" min-width="200" />

          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <el-button size="small" @click="() => onEdit(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="() => onDelete(row)">删除</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            :current-page="page"
            :page-size="pageSize"
            :total="modelTotal"
            background
            size="small"
            layout="prev, pager, next"
            @current-change="page = $event"
          />
        </div>
      </el-card>
    </div>

    <!-- 新增 / 编辑 对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增模型' : '编辑模型'"
      width="580px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px" size="small">
        <el-form-item label="模型功能" prop="func">
          <el-input v-model="form.func" placeholder="如：吞咽分割" />
        </el-form-item>
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="form.name" placeholder="如：SwallowSegmentation_v1.6" />
        </el-form-item>
        <el-form-item label="上传时间" prop="uploadTime">
          <el-date-picker
            v-model="formUploadTime"
            type="datetime"
            placeholder="选择上传时间"
            style="width: 100%"
            :disabled-date="disabledFuture"
          />
        </el-form-item>
        <el-form-item label="上传者" prop="uploader">
          <el-input v-model="form.uploader" />
        </el-form-item>
        <el-form-item label="文件位置" prop="location">
          <el-input v-model="form.location" placeholder="模型文件路径" />
        </el-form-item>
        <el-form-item label="备注信息">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="准确率%">
              <el-input-number
                v-model="form.accuracy"
                :min="0"
                :max="100"
                :precision="2"
                :step="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="敏感度%">
              <el-input-number
                v-model="form.sensitivity"
                :min="0"
                :max="100"
                :precision="2"
                :step="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="特异度%">
              <el-input-number
                v-model="form.specificity"
                :min="0"
                :max="100"
                :precision="2"
                :step="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  onMounted,
  watch,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
} from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search, Warning, InfoFilled, Plus } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { listModels, getModelStats, createModel, updateModel, deleteModel } from '@/api/model'
import type { ModelRow, ModelStats } from '@/types/model'
import type { FormInstance } from 'element-plus'

// ─── Search / pagination ───────────────────────────────────────────────────
const searchId = ref('')
const searchFunction = ref('')
const searchName = ref('')
const searchTime = ref<Date | null>(null)
const searchUploader = ref('')
const page = ref(1)
const pageSize = 8

// ─── Table state ───────────────────────────────────────────────────────────
const modelLoading = ref(false)
const modelTotal = ref(0)
const modelData = ref<ModelRow[]>([])
const metricsVisible = reactive<Record<string, boolean>>({})

// ─── Stats state ───────────────────────────────────────────────────────────
const stats = reactive<ModelStats>({
  totalCount: 0,
  weekNewCount: 0,
  lastWeekNewCount: 0,
  topUploader: null,
  topUploaderCount: 0,
  topUploaderRatio: 0,
})

const card1Percentage = computed(() => {
  if (stats.totalCount === 0) return 0
  return Math.min(100, Math.round((stats.weekNewCount / stats.totalCount) * 100))
})

const weekGrowth = computed(() => {
  if (stats.lastWeekNewCount === 0) {
    return stats.weekNewCount > 0 ? 100 : 0
  }
  return Math.round(((stats.weekNewCount - stats.lastWeekNewCount) / stats.lastWeekNewCount) * 100)
})

// ─── Dialog state ──────────────────────────────────────────────────────────
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingId = ref('')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const formUploadTime = ref<Date | null>(null)

const form = reactive({
  func: '',
  name: '',
  uploadTime: '',
  uploader: '',
  remark: '',
  location: '',
  accuracy: null as number | null,
  sensitivity: null as number | null,
  specificity: null as number | null,
})

const formRules = {
  func: [{ required: true, message: '请输入模型功能', trigger: 'blur' }],
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  uploader: [{ required: true, message: '请输入上传者', trigger: 'blur' }],
  location: [{ required: true, message: '请输入文件位置', trigger: 'blur' }],
}

function resetForm() {
  form.func = ''
  form.name = ''
  form.uploader = ''
  form.remark = ''
  form.location = ''
  form.accuracy = null
  form.sensitivity = null
  form.specificity = null
  formUploadTime.value = null
  formRef.value?.clearValidate()
}

function openCreateDialog() {
  resetForm()
  formUploadTime.value = new Date()
  dialogMode.value = 'create'
  dialogVisible.value = true
}

function onEdit(row: any) {
  resetForm()
  form.func = row.func ?? ''
  form.name = row.name ?? ''
  form.uploader = row.uploader ?? ''
  form.remark = row.remark ?? ''
  form.location = ''
  form.accuracy = row.accuracy != null ? parseFloat((row.accuracy * 100).toFixed(2)) : null
  form.sensitivity = row.sensitivity != null ? parseFloat((row.sensitivity * 100).toFixed(2)) : null
  form.specificity = row.specificity != null ? parseFloat((row.specificity * 100).toFixed(2)) : null
  // parse uploadTime string to Date for the picker
  if (row.uploadTime) {
    const s = row.uploadTime.replace('T', ' ').replace('Z', '')
    formUploadTime.value = new Date(s)
  } else {
    formUploadTime.value = new Date()
  }
  editingId.value = row.id
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

function toIsoLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  const dto = {
    func: form.func,
    name: form.name,
    uploadTime: formUploadTime.value ? toIsoLocal(formUploadTime.value) : toIsoLocal(new Date()),
    uploader: form.uploader,
    remark: form.remark,
    location: form.location,
    accuracy:
      form.accuracy != null
        ? parseFloat((form.accuracy / 100).toFixed(4))
        : null,
    sensitivity:
      form.sensitivity != null
        ? parseFloat((form.sensitivity / 100).toFixed(4))
        : null,
    specificity:
      form.specificity != null
        ? parseFloat((form.specificity / 100).toFixed(4))
        : null,
  }
  submitLoading.value = true
  try {
    if (dialogMode.value === 'create') {
      await createModel(dto as any)
      ElMessage.success('新增成功')
    } else {
      await updateModel(editingId.value, dto as any)
      ElMessage.success('编辑成功')
    }
    dialogVisible.value = false
    fetchModels()
    fetchStats()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  } finally {
    submitLoading.value = false
  }
}

async function onDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除【${row.name}】？`, '删除确认', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteModel(row.id)
    ElMessage.success('删除成功')
    fetchModels()
    fetchStats()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '删除失败')
  }
}

// ─── Data fetching ─────────────────────────────────────────────────────────
function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchModels() {
  modelLoading.value = true
  try {
    const params = {
      page: page.value,
      size: pageSize,
      id: searchId.value || undefined,
      func: searchFunction.value || undefined,
      name: searchName.value || undefined,
      uploader: searchUploader.value || undefined,
      date: searchTime.value ? formatLocalDate(searchTime.value) : undefined,
    }
    const data = await listModels(params)
    modelData.value = data.items
    modelTotal.value = data.total
  } finally {
    modelLoading.value = false
  }
}

async function fetchStats() {
  try {
    const data = await getModelStats()
    Object.assign(stats, data)
  } catch {
    // silently ignore stats fetch errors
  }
}

onMounted(() => {
  fetchModels()
  fetchStats()
})
watch(page, () => fetchModels())
watch(
  [searchId, searchFunction, searchName, searchUploader, searchTime],
  () => {
    page.value = 1
    fetchModels()
  },
)

// ─── Table helpers ─────────────────────────────────────────────────────────
const modelRows = computed(() => {
  const rows = modelData.value as any[]
  const pad = pageSize - rows.length
  if (pad <= 0) return rows
  const fillers = Array.from({ length: pad }, (_, i) => ({
    __filler: true,
    __key: `model-filler-${i}`,
  }))
  return rows.concat(fillers as any)
})

function modelRowClassName({ row }: { row: any }) {
  return row.__filler ? 'is-filler' : ''
}

function formatDateTime(input?: string | Date | null): string {
  if (!input) return '-'
  if (typeof input === 'string') {
    const s = input.replace('T', ' ').replace('Z', '')
    return s.slice(0, 16)
  }
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return String(input)
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  return `${y}-${m}-${day} ${hh}:${mm}`
}

function uploadTimeFormatter(_row: any, _col: any, cellValue: any) {
  return formatDateTime(cellValue)
}

function disabledFuture(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() > today.getTime()
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

// ─── Radar chart mini component ────────────────────────────────────────────
const RadarMini = defineComponent({
  name: 'RadarMini',
  props: {
    accuracy: { type: Number, default: null },
    sensitivity: { type: Number, default: null },
    specificity: { type: Number, default: null },
    visible: { type: Boolean, default: false },
  },
  setup(props) {
    const elRef = ref<HTMLDivElement | null>(null)
    let chart: echarts.ECharts | null = null
    let ro: ResizeObserver | null = null

    const clamp01 = (v: number | null | undefined) =>
      v == null ? 0 : Math.max(0, Math.min(1, v))

    const ensureInited = () => {
      if (!elRef.value) return false
      const { clientWidth, clientHeight } = elRef.value
      if (!clientWidth || !clientHeight) return false
      if (!chart) chart = echarts.init(elRef.value)
      return true
    }

    const render = () => {
      if (!props.visible) return
      if (!ensureInited()) return

      const accNA = props.accuracy == null
      const senNA = props.sensitivity == null
      const speNA = props.specificity == null

      const values = [
        clamp01(props.accuracy),
        clamp01(props.sensitivity),
        clamp01(props.specificity),
      ]

      chart!.setOption({
        radar: {
          center: ['50%', '60%'],
          radius: '68%',
          splitNumber: 2,
          alignTicks: false,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          indicator: [
            { name: `准确率${accNA ? '(暂无)' : ''}`, max: 1 },
            { name: `敏感度${senNA ? '(暂无)' : ''}`, max: 1 },
            { name: `特异度${speNA ? '(暂无)' : ''}`, max: 1 },
          ],
          axisName: { color: '#666' },
        },
        series: [
          {
            type: 'radar',
            areaStyle: { opacity: 0.15 },
            data: [{ value: values }],
          },
        ],
      })

      chart!.resize()
    }

    onMounted(async () => {
      await nextTick()
      if (elRef.value && 'ResizeObserver' in window) {
        ro = new ResizeObserver(() => {
          if (!props.visible) return
          render()
        })
        ro.observe(elRef.value)
      }
      if (props.visible) {
        setTimeout(render, 60)
      }
    })

    watch(
      () => props.visible,
      (v) => {
        if (v) {
          nextTick(() => setTimeout(render, 60))
        }
      },
    )

    watch(
      () => [props.accuracy, props.sensitivity, props.specificity],
      () => render(),
    )

    onBeforeUnmount(() => {
      ro?.disconnect()
      chart?.dispose()
      chart = null
    })

    return () => h('div', { ref: elRef, class: 'radar-mini' })
  },
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
  display: flex;
  flex-direction: column;
}
.table-card {
  grid-column: 1 / span 3;
  width: 100%;
}
.card-header {
  font-size: 1.2rem;
  font-weight: 600;
}
:deep(.el-card__header) {
  padding: 6px 0px;
}
.el-statistic {
  --el-statistic-content-font-size: 30px;
}
.stat-title {
  display: inline-flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.stat-icon {
  margin-left: 4px;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
}
.stat-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.stat-note {
  font-weight: 700;
  font-size: 15px;
}
.stat-note.primary {
  color: var(--el-color-primary);
}
.stat-note.success {
  color: var(--el-color-success);
}
.stat-note.warning {
  color: var(--el-color-warning);
}
.stat-note.danger {
  color: var(--el-color-danger);
}
.circle-number {
  display: block;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}
.circle-label {
  display: block;
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-top: 4px;
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
.model-table {
  width: 100%;
}
.pagination-wrapper {
  display: flex;
  justify-content: center;
}
.metrics-icon {
  cursor: pointer;
  color: var(--el-color-info);
}
:deep(.el-popover.radar-popover) {
  background: #fff;
  border: none;
  border-radius: 10px;
  padding: 20px 20px;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.5),
    0 2px 8px rgba(0, 0, 0, 0.3);
  max-width: 520px;
}
.radar-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 10px;
}
.radar-popover-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 240px;
}
.radar-mini {
  width: 240px;
  height: 240px;
}
.radar-vals {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12px;
  color: #444;
  line-height: 1.8;
  min-width: 90px;
}
:deep(.el-table__body tr.is-filler .cell) {
  visibility: hidden;
  pointer-events: none;
}
</style>
