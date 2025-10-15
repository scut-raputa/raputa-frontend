<template>
  <AuthLayout>
    <div class="form-box">
      <h2 class="form-title">账户注册</h2>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="register-form"
        label-width="0"
      >
        <!-- 医院名 -->
        <el-form-item prop="hospitalName">
          <el-input
            v-model="form.hospitalName"
            placeholder="医院名称"
            autocomplete="organization"
            :validate-event="false"
          >
            <template #prefix>
              <el-icon><OfficeBuilding /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 科室名 -->
        <el-form-item prop="departmentName">
          <el-input
            v-model="form.departmentName"
            placeholder="科室名称"
            autocomplete="organization-title"
            :validate-event="false"
          >
            <template #prefix>
              <el-icon><Collection /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 用户名（科室登录名） -->
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名（建议使用科室拼音或英文缩写）"
            autocomplete="username"
            :validate-event="false"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 密码 -->
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            show-password
            autocomplete="new-password"
            :validate-event="false"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            show-password
            autocomplete="new-password"
            :validate-event="false"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 提交按钮与跳转链接（和 Login.vue 一样的布局） -->
        <el-form-item>
          <el-button
            class="submit-btn"
            type="primary"
            :loading="submitting"
            :disabled="submitting"
            @click="onSubmit"
          >
            <el-icon class="icon-with-margin"><EditPen /></el-icon>
            注册
          </el-button>
          <div class="link-row">
            <router-link to="/login">已有账号？登录</router-link>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/AuthLayout.vue'
import {
  User,
  Lock,
  OfficeBuilding,
  Collection,
  EditPen,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { registerUser } from '@/api/user'
import axios from 'axios'

interface RegisterForm {
  hospitalName: string
  departmentName: string
  username: string
  password: string
  confirmPassword: string
}

const formRef = ref<FormInstance | null>(null)
const form = reactive<RegisterForm>({
  hospitalName: '',
  departmentName: '',
  username: '',
  password: '',
  confirmPassword: '',
})
const submitting = ref(false)

const rules: FormRules = {
  hospitalName: [
    { required: true, message: '请输入医院名称', trigger: 'blur' },
    { min: 2, max: 128, message: '长度应为 2~128 个字符', trigger: 'blur' },
  ],
  departmentName: [
    { required: true, message: '请输入科室名称', trigger: 'blur' },
    { min: 2, max: 128, message: '长度应为 2~128 个字符', trigger: 'blur' },
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应为 2~20 个字符', trigger: 'blur' },
    {
      pattern: /^[\u4e00-\u9fa5A-Za-z0-9]+$/,
      message: '仅支持中文、字母和数字',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 16, message: '密码长度应为 8~16 位', trigger: 'blur' },
    {
      validator: (_r, v, cb) =>
        /^[A-Za-z0-9!@#]+$/.test(v)
          ? cb()
          : cb('密码只能包含大小写字母、数字，以及 ! @ # 等特殊字符'),
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_r, v, cb) =>
        v === form.password ? cb() : cb('两次输入的密码不一致'),
      trigger: 'blur',
    },
  ],
}

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 200) {
  let t: number | undefined
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t)
    t = window.setTimeout(() => fn(...args), wait)
  }
}

const validateFieldSilently = (prop: keyof RegisterForm) => {
  formRef.value?.validateField(prop as string, () => {})
}
const validateDebounced = debounce(validateFieldSilently, 200)

watch(
  () => form.hospitalName,
  () => validateDebounced('hospitalName'),
)
watch(
  () => form.departmentName,
  () => validateDebounced('departmentName'),
)
watch(
  () => form.username,
  () => validateDebounced('username'),
)
watch(
  () => form.password,
  () => validateDebounced('password'),
)
watch(
  () => form.confirmPassword,
  () => validateDebounced('confirmPassword'),
)

const router = useRouter()

async function onSubmit(): Promise<void> {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok || submitting.value) return

  submitting.value = true
  try {
    const payload = {
      username: form.username.trim(),
      password: form.password,
      hospitalName: form.hospitalName.trim(),
      departmentName: form.departmentName.trim(),
    }
    const res = await registerUser(payload)
    if (res.code !== 0) {
      ElMessage.error(res.message || '注册失败，请稍后重试')
      return
    }
    ElMessage.success({
      message: '注册成功，即将跳转到登录页面',
      duration: 1500,
    })
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status
      const serverMsg = (err.response?.data as any)?.message

      if (status === 409) {
        ElMessage.error(serverMsg || '该用户名已被注册')
      } else if (status === 400) {
        ElMessage.error(serverMsg || '请求参数有误')
      } else if (status === 403) {
        ElMessage.error(serverMsg || '账号已停用或无权限')
      } else if (status === 0 || !status) {
        // 网络层错误（超时、断网、CORS 等）
        ElMessage.error('网络错误，请稍后重试')
      } else {
        ElMessage.error(serverMsg || `注册失败（${status}）`)
      }
    } else {
      const msg = err instanceof Error ? err.message : String(err)
      ElMessage.error(`注册失败：${msg}`)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.form-box {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  text-align: center;
}
.form-title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #333;
}
/* 与 Login.vue 保持一致的纵向间距 */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
/* 与 Login.vue 一样：按钮 100% 宽 */
.submit-btn {
  display: block;
  width: 100%;
}
.icon-with-margin {
  margin-right: 4px;
}
/* 与 Login.vue 一样：按钮与链接之间的距离 */
.link-row {
  margin-top: 0.5rem;
}
.link-row a {
  color: #409eff;
  font-size: 0.875rem;
}
</style>
