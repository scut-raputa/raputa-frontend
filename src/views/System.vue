<template>
  <div class="system-page">
    <div class="system-shell">
      <el-card shadow="hover" class="overview-card">
        <template #header>
          <div class="page-card-header">
            <h2>系统总览</h2>
            <el-tag type="success" effect="light">管理员视角</el-tag>
          </div>
        </template>

        <section class="summary-grid">
          <div class="summary-item">
            <span>账户总数</span>
            <strong>{{ userTotal }}</strong>
          </div>
          <div class="summary-item">
            <span>科室账户</span>
            <strong>{{ departmentCount }}</strong>
          </div>
          <div class="summary-item">
            <span>管理员</span>
            <strong>{{ adminCount }}</strong>
          </div>
          <div class="summary-item">
            <span>最近登录 IP</span>
            <strong class="summary-text">{{ currentUser?.lastLoginIp || '-' }}</strong>
          </div>
        </section>

        <section class="policy-panel">
          <div class="section-title">当前系统策略</div>
          <dl class="policy-list">
            <div>
              <dt>登录态</dt>
              <dd>HttpOnly Cookie</dd>
            </div>
            <div>
              <dt>密码管理</dt>
              <dd>不可查看，仅允许重置</dd>
            </div>
            <div>
              <dt>设备身份</dt>
              <dd>硬件标识优先，IP 仅作当前地址</dd>
            </div>
            <div>
              <dt>设备冲突</dt>
              <dd>会话锁 + 释放请求</dd>
            </div>
          </dl>
        </section>
      </el-card>

      <el-card shadow="hover" class="table-card">
        <template #header>
          <div class="card-header">
            <span>账户管理</span>
          </div>
        </template>

        <div class="controls-row">
          <el-input v-model="searchUsername" placeholder="搜索用户名" size="small" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-input v-model="searchHospital" placeholder="搜索医院名" size="small" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-input v-model="searchDepartment" placeholder="搜索科室名" size="small" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="roleFilter" placeholder="权限角色" size="small" clearable>
            <template #prefix><el-icon><UserFilled /></el-icon></template>
            <el-option label="系统管理员" value="ADMIN" />
            <el-option label="科室用户" value="DEPARTMENT" />
          </el-select>
          <el-button type="primary" size="small" @click="openCreateDialog">
            <el-icon class="icon-with-margin"><Plus /></el-icon>
            添加账户
          </el-button>
        </div>

        <el-table
          v-loading="userLoading"
          :data="userRows"
          stripe
          border
          size="small"
          class="table"
          :row-class-name="userRowClassName"
          :row-style="row35Style"
          :cell-style="cell35Style"
        >
          <el-table-column prop="username" label="用户名" width="120" show-overflow-tooltip />
          <el-table-column prop="hospitalName" label="医院名" min-width="140" show-overflow-tooltip />
          <el-table-column prop="departmentName" label="科室名" min-width="140" show-overflow-tooltip />
          <el-table-column label="权限角色" width="105">
            <template #default="{ row }">
              <el-tag v-if="!row.__filler" :type="row.role === 'ADMIN' ? 'danger' : 'primary'" effect="light" size="small">
                {{ roleLabel(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="登录状态" width="88">
            <template #default="{ row }">
              <el-tooltip
                v-if="!row.__filler"
                :content="row.online ? `最近活跃：${formatDateTime(row.lastSeenAt)}` : '当前离线'"
                placement="top"
              >
                <el-tag :type="row.online ? 'success' : 'info'" effect="light" size="small">
                  {{ row.online ? '在线' : '离线' }}
                </el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="最近登录" width="145">
            <template #default="{ row }">
              <span v-if="!row.__filler">{{ formatDateTime(row.lastLoginAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="lastLoginIp" label="最近登录 IP" width="126" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="!row.__filler">{{ row.lastLoginIp || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="210">
            <template #default="{ row }">
              <template v-if="!row.__filler">
                <div class="account-actions">
                  <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
                  <el-button size="small" type="warning" plain @click="openPasswordDialog(row)">重置密码</el-button>
                  <el-tooltip
                    :disabled="!deleteUserDisabledReason(row)"
                    :content="deleteUserDisabledReason(row)"
                    placement="top"
                  >
                    <span class="disabled-action-wrapper">
                      <el-button
                        size="small"
                        type="danger"
                        :disabled="Boolean(deleteUserDisabledReason(row))"
                        @click="onDeleteUser(row)"
                      >
                        删除
                      </el-button>
                    </span>
                  </el-tooltip>
                </div>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            :current-page="userPage"
            :page-size="PAGE_SIZE"
            :total="userTotal"
            background
            size="small"
            layout="prev, pager, next"
            @current-change="userPage = $event"
          />
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="userDialogVisible"
      :title="userDialogMode === 'create' ? '添加账户' : '编辑账户'"
      width="560px"
      :close-on-click-modal="false"
      @closed="onUserDialogClosed"
    >
      <el-form ref="userFormRef" :model="userForm" :rules="userRules" label-width="96px">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="userForm.username"
            :disabled="userDialogMode === 'edit'"
            placeholder="请输入用户名"
            autocomplete="off"
          />
        </el-form-item>
        <el-form-item v-if="userDialogMode === 'create'" label="初始密码" prop="password">
          <el-input v-model="userForm.password" type="password" show-password placeholder="至少 8 位" autocomplete="new-password" />
        </el-form-item>
        <el-form-item label="医院名" prop="hospitalName">
          <el-input v-model="userForm.hospitalName" placeholder="请输入医院名" />
        </el-form-item>
        <el-form-item label="科室名" prop="departmentName">
          <el-input v-model="userForm.departmentName" placeholder="请输入科室名" />
        </el-form-item>
        <el-form-item label="权限角色" prop="role">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="科室用户" value="DEPARTMENT" />
            <el-option label="系统管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button @click="resetUserDialogContent">{{ userDialogMode === 'create' ? '清空' : '恢复原值' }}</el-button>
        <el-button type="primary" :loading="userSubmitting" @click="submitUser">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="passwordDialogVisible"
      title="重置账户密码"
      width="520px"
      :close-on-click-modal="false"
      @closed="resetPasswordForm"
    >
      <el-alert
        title="重置密码前，需要先校验当前管理员密码。"
        type="warning"
        show-icon
        :closable="false"
        class="password-alert"
      />
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="116px">
        <el-form-item label="目标账户">
          <el-input :model-value="passwordTarget?.username || '-'" disabled />
        </el-form-item>
        <el-form-item label="管理员密码" prop="adminPassword">
          <el-input v-model="passwordForm.adminPassword" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-form-item label="重置新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password autocomplete="new-password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button @click="resetPasswordForm">清空</el-button>
        <el-button type="primary" :loading="passwordSubmitting" @click="submitPasswordReset">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Plus, Search, UserFilled } from '@element-plus/icons-vue'
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
} from '@/api/user'
import type { UserFormData, UserRole, UserVO } from '@/types/user'
import { getUser, setUser } from '@/utils/auth'

const PAGE_SIZE = 8
const MAX_FILLER_ROWS = 3

const currentUser = ref<UserVO | null>(getUser())

const userLoading = ref(false)
const userData = ref<UserVO[]>([])
const userTotal = ref(0)
const userPage = ref(1)
const searchUsername = ref('')
const searchHospital = ref('')
const searchDepartment = ref('')
const roleFilter = ref<UserRole | ''>('')

const userRows = computed(() => fillerRows(userData.value, PAGE_SIZE, MAX_FILLER_ROWS))
const departmentCount = computed(() => userData.value.filter((row) => row.role === 'DEPARTMENT').length)
const adminCount = computed(() => userData.value.filter((row) => row.role === 'ADMIN').length)

const userDialogVisible = ref(false)
const userDialogMode = ref<'create' | 'edit'>('create')
const userEditingId = ref<number | null>(null)
const userSubmitting = ref(false)
const userFormRef = ref<FormInstance>()
const userEditOriginal = ref<UserFormState | null>(null)

type UserFormState = {
  username: string
  password: string
  hospitalName: string
  departmentName: string
  role: UserRole
}

function emptyUserForm(): UserFormState {
  return {
    username: '',
    password: '',
    hospitalName: currentUser.value?.hospitalName || '',
    departmentName: '',
    role: 'DEPARTMENT',
  }
}

const userForm = ref<UserFormState>(emptyUserForm())
const userRules = computed(() => ({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password:
    userDialogMode.value === 'create'
      ? [
          { required: true, message: '请输入初始密码', trigger: 'blur' },
          { min: 6, message: '密码至少需要 6 位', trigger: 'blur' },
        ]
      : [],
  hospitalName: [{ required: true, message: '请输入医院名', trigger: 'blur' }],
  departmentName: [{ required: true, message: '请输入科室名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择权限角色', trigger: 'change' }],
}))

const passwordDialogVisible = ref(false)
const passwordSubmitting = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordTarget = ref<UserVO | null>(null)
const passwordForm = ref({
  adminPassword: '',
  newPassword: '',
})
const passwordRules = {
  adminPassword: [{ required: true, message: '请输入管理员密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少需要 6 位', trigger: 'blur' },
  ],
}

onMounted(fetchUsers)

watch(userPage, fetchUsers)
watch([searchUsername, searchHospital, searchDepartment, roleFilter], () => {
  userPage.value = 1
  fetchUsers()
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

function userRowClassName({ row }: { row: UserVO & { __filler?: boolean } }) {
  return row.__filler ? 'is-filler' : ''
}

async function fetchUsers() {
  userLoading.value = true
  try {
    const data = await listAdminUsers({
      page: userPage.value,
      size: PAGE_SIZE,
      username: searchUsername.value || undefined,
      hospitalName: searchHospital.value || undefined,
      departmentName: searchDepartment.value || undefined,
      role: roleFilter.value || undefined,
    })
    userData.value = data?.items ?? []
    userTotal.value = data?.total ?? 0
    syncCurrentUserFromRows()
  } finally {
    userLoading.value = false
  }
}

function syncCurrentUserFromRows() {
  const current = currentUser.value
  if (!current) return
  const latest = userData.value.find((row) => row.id === current.id)
  if (latest) {
    currentUser.value = latest
    setUser(latest)
  }
}

function roleLabel(role?: UserRole) {
  return role === 'ADMIN' ? '系统管理员' : '科室用户'
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '-'
  return iso.slice(0, 19).replace('T', ' ')
}

function deleteUserDisabledReason(row: UserVO & { __filler?: boolean }) {
  if (!row || row.__filler) return ''
  if (row.id === currentUser.value?.id) return '不能删除当前登录账号'
  if (row.online) return '该账户处于登录状态，不能删除'
  return ''
}

function applyUserForm(form: UserFormState | null) {
  userForm.value = { ...(form ?? emptyUserForm()) }
  nextTick(() => userFormRef.value?.clearValidate())
}

function openCreateDialog() {
  userDialogMode.value = 'create'
  userEditingId.value = null
  userEditOriginal.value = null
  applyUserForm(null)
  userDialogVisible.value = true
}

function openEditDialog(row: UserVO) {
  userDialogMode.value = 'edit'
  userEditingId.value = row.id
  const form = {
    username: row.username,
    password: '',
    hospitalName: row.hospitalName,
    departmentName: row.departmentName,
    role: row.role,
  }
  userEditOriginal.value = { ...form }
  applyUserForm(form)
  userDialogVisible.value = true
}

function resetUserDialogContent() {
  if (userDialogMode.value === 'create') {
    applyUserForm(null)
    return
  }
  if (userEditOriginal.value) {
    applyUserForm(userEditOriginal.value)
  }
}

function onUserDialogClosed() {
  userEditingId.value = null
  userEditOriginal.value = null
  applyUserForm(null)
}

async function submitUser() {
  const valid = await userFormRef.value?.validate().catch(() => false)
  if (!valid) return

  const payload: UserFormData = {
    username: userForm.value.username.trim(),
    password: userForm.value.password,
    hospitalName: userForm.value.hospitalName.trim(),
    departmentName: userForm.value.departmentName.trim(),
    role: userForm.value.role,
  }

  userSubmitting.value = true
  try {
    if (userDialogMode.value === 'create') {
      await createAdminUser(payload)
      ElMessage.success('账户已创建')
    } else if (userEditingId.value != null) {
      await updateAdminUser(userEditingId.value, payload)
      ElMessage.success('账户已更新')
    }
    userDialogVisible.value = false
    await fetchUsers()
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  } finally {
    userSubmitting.value = false
  }
}

function openPasswordDialog(row: UserVO) {
  passwordTarget.value = row
  resetPasswordForm()
  passwordDialogVisible.value = true
}

function resetPasswordForm() {
  passwordForm.value = {
    adminPassword: '',
    newPassword: '',
  }
  nextTick(() => passwordFormRef.value?.clearValidate())
}

async function submitPasswordReset() {
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid || !passwordTarget.value) return

  passwordSubmitting.value = true
  try {
    await resetAdminUserPassword(passwordTarget.value.id, passwordForm.value)
    ElMessage.success('密码已重置')
    passwordDialogVisible.value = false
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '密码重置失败')
  } finally {
    passwordSubmitting.value = false
  }
}

async function onDeleteUser(row: UserVO) {
  const disabledReason = deleteUserDisabledReason(row)
  if (disabledReason) {
    ElMessage.warning(disabledReason)
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除账户【${row.username}】？该操作不可恢复。`, '删除账户', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  try {
    await deleteAdminUser(row.id)
    ElMessage.success('账户已删除')
    await fetchUsers()
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败')
  }
}
</script>

<style scoped>
.system-page {
  width: 100%;
  display: flex;
  justify-content: center;
}
.system-shell {
  width: min(1304px, 100%);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.overview-card,
.table-card {
  width: 100%;
  box-sizing: border-box;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.page-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.page-card-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 650;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.summary-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px 16px;
  background: #fafcff;
}
.summary-item span {
  display: block;
  margin-bottom: 8px;
  color: #667085;
  font-size: 13px;
}
.summary-item strong {
  display: block;
  color: #1f2937;
  font-size: 20px;
  font-weight: 650;
}
.summary-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.policy-panel {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 0;
  padding: 14px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
}
.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  font-size: 1.2rem;
  font-weight: 600;
}
:deep(.el-card__header) {
  padding: 6px 0;
}
.controls-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) max-content;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
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
.pagination-wrapper {
  display: flex;
  justify-content: center;
}
.icon-with-margin {
  margin-right: 4px;
}
.account-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.account-actions :deep(.el-button) {
  margin-left: 0;
}
.disabled-action-wrapper {
  display: inline-flex;
}
.password-alert {
  margin-bottom: 16px;
}
.section-title {
  margin-bottom: 14px;
  color: #1f2937;
  font-size: 16px;
  font-weight: 650;
}
.policy-list {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}
.policy-list div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 11px 0;
  border-top: 1px solid #eef0f3;
}
.policy-list div:nth-child(-n + 2) {
  border-top: 0;
}
.policy-list dt,
.policy-list dd {
  margin: 0;
}
.policy-list dt {
  color: #667085;
}
.policy-list dd {
  color: #1f2937;
  font-weight: 600;
  text-align: right;
}
:deep(.el-table__body tr.is-filler .cell) {
  visibility: hidden;
  pointer-events: none;
}
@media (max-width: 1200px) {
  .system-shell {
    width: 100%;
  }
  .summary-grid,
  .policy-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .controls-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
