<template>
  <AuthLayout>
    <div class="form-box">
      <h2 class="form-title">欢迎登录</h2>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        label-width="0"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            :validate-event="false"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            placeholder="密码"
            show-password
            :validate-event="false"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            class="submit-btn"
            type="primary"
            :loading="submitting"
            :disabled="submitting"
            @click="onSubmit"
          >
            <el-icon class="icon-with-margin"><CreditCard /></el-icon>
            登录
          </el-button>
          <div class="link-row">
            <router-link to="/register">注册新账号</router-link>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/AuthLayout.vue'
import { User, Lock, CreditCard } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import axios from 'axios'
import { loginUser } from '@/api/user'
import { setToken, setUser } from '@/utils/auth'

const router = useRouter()
const formRef = ref<FormInstance | null>(null)
const submitting = ref(false)

const form = reactive({ username: '', password: '' })

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function onSubmit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok || submitting.value) return

  submitting.value = true
  try {
    const res = await loginUser({
      username: form.username.trim(),
      password: form.password,
    })

    if (res.code !== 0 || !res.data) {
      ElMessage.error(res.message || '登录失败，请稍后重试')
      return
    }

    setToken(res.data.token)
    setUser(res.data.user)

    ElMessage.success({ message: '登录成功，正在进入仪表盘', duration: 1200 })
    setTimeout(() => {
      router.push('/dashboard/patient')
    }, 1200)
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status
      const serverMsg = (err.response?.data as any)?.message
      if (status === 404) {
        ElMessage.error(serverMsg || '该用户不存在，或用户名输入错误')
      } else if (status === 403) {
        ElMessage.error(serverMsg || '该用户不可用，请联系系统管理员')
      } else if (status === 401) {
        ElMessage.error(serverMsg || '密码错误')
      } else if (status === 0 || !status) {
        ElMessage.error('网络错误，请稍后重试')
      } else {
        ElMessage.error(serverMsg || `登录失败（${status}）`)
      }
    } else {
      const msg = err instanceof Error ? err.message : String(err)
      ElMessage.error(`登录失败：${msg}`)
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
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.submit-btn {
  display: block;
  width: 100%;
}
.icon-with-margin {
  margin-right: 4px;
}
.link-row {
  margin-top: 0.5rem;
}
.link-row a {
  color: #409eff;
  font-size: 0.875rem;
}
</style>
