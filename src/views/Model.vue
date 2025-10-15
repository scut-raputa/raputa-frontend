<template>
  <div class="model-container">
    <div class="grid-wrapper">
      <!-- 统计卡片 1：模型总数 -->
      <el-card shadow="hover" class="stat-card">
        <div class="stat-body">
          <div class="stat-left">
            <el-statistic :value="120">
              <template #title>
                <div class="stat-title">
                  模型总数
                  <el-tooltip
                    effect="dark"
                    content="当前系统模型总数"
                    placement="top"
                  >
                    <el-icon :size="12" class="stat-icon"><Warning /></el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-statistic>
            <div class="stat-note primary">投入使用模型数: 80</div>
          </div>

          <div class="stat-right">
            <el-progress
              type="dashboard"
              :percentage="67"
              :stroke-width="8"
              color="#409EFF"
              :width="120"
            >
              <template #default>
                <span class="circle-number">80</span>
                <span class="circle-label">已部署模型数</span>
              </template>
            </el-progress>
          </div>
        </div>
      </el-card>

      <!-- 统计卡片 2：本周新增 -->
      <el-card shadow="hover" class="stat-card">
        <div class="stat-body">
          <div class="stat-left">
            <el-statistic :value="10">
              <template #title>
                <div class="stat-title">
                  本周新增
                  <el-tooltip
                    effect="dark"
                    content="本周上传的新模型数量"
                    placement="top"
                  >
                    <el-icon :size="12" class="stat-icon"><Warning /></el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-statistic>
            <div class="stat-note success">本周新增模型部署数: 6</div>
          </div>

          <div class="stat-right">
            <el-progress
              type="dashboard"
              :percentage="60"
              :stroke-width="8"
              color="#67C23A"
              :width="120"
            >
              <template #default>
                <span class="circle-number">60%</span>
                <span class="circle-label">较上周新增上升</span>
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
              <el-tooltip
                effect="dark"
                content="本周上传模型最多的用户"
                placement="top"
              >
                <el-icon :size="12" class="stat-icon"><Warning /></el-icon>
              </el-tooltip>
            </div>
            <div class="stat-value">张三</div>
            <div class="stat-note warning">上传模型总数: 30</div>
          </div>

          <div class="stat-right">
            <el-progress
              type="dashboard"
              :percentage="25"
              :stroke-width="8"
              color="#e6a23c"
              :width="120"
            >
              <template #default>
                <span class="circle-number">25%</span>
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
            <template #prefix
              ><el-icon><Search /></el-icon
            ></template>
          </el-input>

          <el-input
            v-model="searchFunction"
            placeholder="搜索模型功能"
            clearable
            size="small"
            style="max-width: 200px"
          >
            <template #prefix
              ><el-icon><Search /></el-icon
            ></template>
          </el-input>

          <el-input
            v-model="searchName"
            placeholder="搜索模型名称"
            clearable
            size="small"
            style="max-width: 200px"
          >
            <template #prefix
              ><el-icon><Search /></el-icon
            ></template>
          </el-input>

          <el-input
            v-model="searchUploader"
            placeholder="搜索上传者"
            clearable
            size="small"
            style="max-width: 200px"
          >
            <template #prefix
              ><el-icon><Search /></el-icon
            ></template>
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

          <el-upload
            ref="upload"
            class="upload-button"
            :limit="1"
            :auto-upload="true"
            :on-exceed="handleExceed"
            :on-success="handleSuccess"
            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
            :show-file-list="false"
          >
            <el-button type="primary" size="small">
              <el-icon class="icon-with-margin"><UploadFilled /></el-icon>
              上传模型
            </el-button>
          </el-upload>
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
                <el-button size="small" @click="() => onEdit(row)"
                  >编辑</el-button
                >
                <el-button
                  type="danger"
                  size="small"
                  @click="() => onDelete(row)"
                  >删除</el-button
                >
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
import { ElMessageBox, ElMessage, genFileId } from 'element-plus'
// import { useTransition } from '@vueuse/core'
import {
  Search,
  Warning,
  UploadFilled,
  InfoFilled,
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { listModels } from '@/api/model'
import type { ModelRow } from '@/types/model'
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus'

const searchId = ref('')
const searchFunction = ref('')
const searchName = ref('')
const searchTime = ref<Date | null>(null)
const searchUploader = ref('')
const page = ref(1)
const pageSize = 8

const modelLoading = ref(false)
const modelTotal = ref(0)
const modelData = ref<ModelRow[]>([])
const metricsVisible = reactive<Record<string, boolean>>({})

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const upload = ref<UploadInstance>()

const handleExceed: UploadProps['onExceed'] = (files) => {
  upload.value?.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value?.handleStart(file)
}

const handleSuccess: UploadProps['onSuccess'] = () => {
  ElMessage.success('上传成功')
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

onMounted(fetchModels)
watch(page, () => fetchModels())
watch(
  [searchId, searchFunction, searchName, searchUploader, searchTime],
  () => {
    page.value = 1
    fetchModels()
  },
)

const paginatedModels = computed(() => modelData.value)

const modelRows = computed(() => {
  const rows = paginatedModels.value as any[]
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

const RadarMini = defineComponent({
  name: 'RadarMini',
  props: {
    accuracy: { type: Number, default: null },
    sensitivity: { type: Number, default: null },
    specificity: { type: Number, default: null },
    // 新增：由 Popover 传入
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
      // Popover 未展开时这里为 0，直接跳过
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

      // 观察尺寸变化：Popover 打开定位/动画后重新渲染
      if (elRef.value && 'ResizeObserver' in window) {
        ro = new ResizeObserver(() => {
          if (!props.visible) return
          render()
        })
        ro.observe(elRef.value)
      }

      // 若进场时就可见，延迟一次渲染（等待 Popover 完全展开）
      if (props.visible) {
        setTimeout(render, 60)
      }
    })

    // Popover 显隐
    watch(
      () => props.visible,
      (v) => {
        if (v) {
          // 等下一帧和一次微延迟，确保 popper 完全挂载并有尺寸
          nextTick(() => setTimeout(render, 60))
        } else {
          // 可选：隐藏时不做销毁，避免下次打开重新 init 造成闪烁
          // 需要彻底销毁可在这里 chart?.dispose()
        }
      },
    )

    // 指标变动也触发一次渲染
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

function disabledFuture(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() > today.getTime()
}

function onEdit(row: any) {
  ElMessage.info(`编辑 ${row.name}`)
}
function onDelete(row: any) {
  ElMessageBox.confirm(`确认删除【${row.name}】？`, '删除确认', {
    type: 'warning',
  }).then(() => ElMessage.success('已删除（模拟）'))
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
.stat-footer {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
:deep(.stat-footer .el-progress__text) {
  text-align: right;
}
.green {
  color: var(--el-color-success);
}
.red {
  color: var(--el-color-error);
}
.suffix-text {
  margin-left: 4px;
  font-size: 14px;
  font-weight: 500;
}
.suffix-text.success {
  color: var(--el-color-success);
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

/* —— 控制行：与患者页一致的样式（保持逻辑不变） —— */
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

/* —— 表格与分页：与患者页一致 —— */
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

/* 标题加大加粗 */
.radar-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 10px;
}

/* 内容行：雷达图 + 文本 */
.radar-popover-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 240px;
}

/* 你已有的雷达图容器尺寸可继续复用 */
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

/* 占位空行隐藏内容（与患者页一致） */
:deep(.el-table__body tr.is-filler .cell) {
  visibility: hidden;
  pointer-events: none;
}
</style>
