<template>
  <div class="common-layout">
    <el-container>
      <!-- 顶栏 -->
      <el-header class="header">
        <div class="header-left">
          <img src="@/assets/logo.svg" class="logo" alt="Logo" />
          <span class="system-name">吞咽障碍智能检测系统</span>
        </div>
        <div class="header-right">
          <el-dropdown
            trigger="hover"
            placement="bottom"
            :teleported="true"
            :popper-options="{
              strategy: 'fixed',
              modifiers: [
                {
                  name: 'preventOverflow',
                  options: { boundary: 'viewport', padding: 12 },
                },
                { name: 'offset', options: { offset: [0, 12] } },
              ],
            }"
          >
            <span class="avatar-wrapper">
              <el-avatar :src="avatarUrl" :size="48" class="avatar-square" />
            </span>
            <template #dropdown>
              <el-card class="user-dropdown-card" shadow="always">
                <div ref="scrollAreaRef" class="scroll-container">
                  <div class="user-info">
                    <el-avatar
                      :src="avatarUrl"
                      :size="64"
                      class="dropdown-avatar"
                    />
                    <div class="user-details">
                      <div class="user-dept">
                        {{ displayOrDash(currentUser?.hospitalName) }}
                      </div>
                      <div class="user-dept">
                        {{ displayOrDash(currentUser?.departmentName) }}
                      </div>
                    </div>
                  </div>
                  <el-divider />
                  <div class="login-info">
                    <div>上次登录时间：{{ lastLoginAtDisplay }}</div>
                    <div>
                      上次登录 IP：{{ displayOrDash(currentUser?.lastLoginIp) }}
                    </div>
                  </div>
                </div>
              </el-card>
            </template>
          </el-dropdown>
          <el-button type="danger" class="export-btn" dark @click="logout">
            <el-icon style="margin-right: 4px"><SwitchButton /></el-icon>
            登出
          </el-button>
        </div>
      </el-header>

      <el-container>
        <!-- 侧栏 -->
        <el-aside :class="['sidebar', isCollapsed ? 'collapsed' : '']">
          <el-menu
            v-model="activeMenu"
            :default-active="activeMenu"
            :collapse="isCollapsed"
            :collapse-transition="false"
            unique-opened
            @select="onMenuSelect"
          >
            <el-menu-item index="/dashboard/patient">
              <el-icon><User /></el-icon>
              <template #title>患者管理</template>
            </el-menu-item>
            <el-menu-item index="/dashboard/model">
              <el-icon><DataLine /></el-icon>
              <template #title>模型管理</template>
            </el-menu-item>
            <el-menu-item index="/dashboard/monitor">
              <el-icon><Loading /></el-icon>
              <template #title>系统监测</template>
            </el-menu-item>
            <el-menu-item index="/dashboard/data">
              <el-icon><Document /></el-icon>
              <template #title>数据管理</template>
            </el-menu-item>
            <el-menu-item index="/dashboard/stats">
              <el-icon><Histogram /></el-icon>
              <template #title>数据统计</template>
            </el-menu-item>
            <el-menu-item v-if="!isAdmin" index="/dashboard/department">
              <el-icon><Setting /></el-icon>
              <template #title>科室管理</template>
            </el-menu-item>
            <el-menu-item v-else index="/dashboard/system">
              <el-icon><Setting /></el-icon>
              <template #title>系统管理</template>
            </el-menu-item>
            <div class="el-menu-item toggle-item" @click="toggleCollapse">
              <el-icon>
                <component :is="isCollapsed ? Expand : Fold" />
              </el-icon>
              <span v-if="!isCollapsed">{{
                isCollapsed ? '展开菜单' : '收起菜单'
              }}</span>
            </div>
          </el-menu>
        </el-aside>

        <!-- 主体内容 -->
        <el-main :class="{ collapsed: isCollapsed }">
          <div class="main-inner">
            <router-view />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getUser, clearToken, clearUser } from '@/utils/auth'
import type { UserVO } from '@/types/response'
import {
  Fold,
  Expand,
  DataLine,
  User,
  Document,
  Loading,
  Setting,
  Histogram,
  SwitchButton,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const currentUser = ref<UserVO | null>(getUser())
const avatarUrl = ref<string>(resolveResourceUrl(currentUser.value?.avatarUrl))
const lastLoginAtDisplay = computed(() =>
  formatDateTime(currentUser.value?.lastLoginAt),
)
const isCollapsed = ref(false)
const activeMenu = ref(route.path)
const scrollAreaRef = ref<HTMLElement | null>(null)

const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')

watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath
  },
)

onMounted(() => {
  activeMenu.value = route.path
})

function logout() {
  ElMessage.success({ message: '已登出，正在跳转到登录页', duration: 1500 })
  setTimeout(() => {
    clearToken()
    clearUser()
    router.push('/login')
  }, 1500)
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function onMenuSelect(index: string) {
  if (index === 'toggleCollapse') {
    toggleCollapse()
    activeMenu.value = route.path
  } else if (index !== route.path) {
    router.push(index)
  }
}

function resolveResourceUrl(path?: string) {
  const BASE = 'http://localhost:8080'
  if (!path || path.trim() === '') return `${BASE}/images/default-avatar.png`
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—'
  return iso.slice(0, 19).replace('T', ' ')
}

function displayOrDash(v?: unknown) {
  if (v == null) return '—'
  if (typeof v === 'string' && v.trim() === '') return '—'
  return v as string
}
</script>

<style scoped>
html,
body {
  margin: 0;
  padding: 0;
  width: 100vw;
  min-height: 100vh;
  overflow-x: auto;
  overflow-y: auto;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
.common-layout {
  display: flex;
  flex-direction: column;
  min-width: 960px;
  overflow-x: visible;
  overflow-y: visible;
}

/* 顶栏固定 */
.el-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(to right, #1e3c72, #2a5298);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  box-sizing: border-box;
  z-index: 1000;
}
.header-left {
  display: flex;
  align-items: center;
}
.logo {
  height: 36px;
  margin-right: 0.5rem;
}
.system-name {
  font-size: 1.25rem;
  font-weight: bold;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.avatar-wrapper {
  cursor: pointer;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-square {
  border-radius: 0.375rem !important;
}

/* 主体布局容器 */
.el-container:not(.is-vertical) {
  display: flex;
  flex-direction: row;
  padding-top: 80px;
  width: 100%;
  min-height: 100vh;
  overflow: visible;
  position: relative;
}

/* 侧栏固定 */
.el-aside {
  position: fixed;
  top: 80px;
  left: 0;
  bottom: 0;
  width: 200px;
  background: linear-gradient(to bottom, #111827, #1f2937);
  color: #d1d5db;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 999;
  transition: width 0.2s ease;
}
.el-aside.collapsed {
  width: 64px;
}
.el-aside::-webkit-scrollbar {
  display: none;
}

/* 菜单样式 */
:deep(.el-menu) {
  border-right: none;
  background-color: transparent;
  height: 100%;
  padding-top: 12px;
  padding-bottom: 60px;
  box-sizing: border-box;
}
:deep(.el-menu-item) {
  color: #d1d5db;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff;
}
:deep(.el-menu-item.is-active) {
  background-color: #3b82f6;
  color: #fff;
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
  margin: 4px 0;
  padding-left: 20px;
  box-shadow: 2px 0 8px rgba(59, 130, 246, 0.15);
}
:deep(.el-menu--collapse .el-menu-item.is-active) {
  padding: 0 !important;
  margin: 4px 0 !important;
  background-color: #3b82f6;
  color: #fff;
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
  box-shadow: 2px 0 8px rgba(59, 130, 246, 0.15);
}
.toggle-item {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 48px;
  line-height: 48px;
  cursor: pointer;
  color: #d1d5db;
  transition: background-color 0.2s;
}
.toggle-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff;
}
.el-menu--collapse .toggle-item {
  justify-content: center;
}

/* 主内容区 */
.el-main {
  margin-left: 200px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  box-sizing: border-box;
  padding: 2rem 1rem;
  background-color: #f9fafb;
  min-height: calc(100vh - 80px);
  overflow: visible;
  min-height: calc(100vh - 80px);
}
.el-main.collapsed {
  margin-left: 64px;
}

/* 内部内容容器 */
.main-inner {
  min-width: 960px;
  max-width: 100%;
  box-sizing: border-box;
  margin-top: auto;
  margin-bottom: auto;
}

/* 卡片组件 */
:deep(.el-card) {
  min-width: 360px;
  flex-shrink: 0;
}

/* 用户信息卡片 */
.user-dropdown-card {
  width: 20rem;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}
.scroll-container {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  padding: 1rem;
  box-sizing: border-box;
  scrollbar-width: none;
}
.scroll-container::-webkit-scrollbar {
  display: none;
}
.dropdown-avatar {
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}
.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}
.user-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.user-name {
  font-weight: bold;
  font-size: 1.1rem;
}
.user-dept {
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  word-break: break-word;
}
.login-info {
  font-size: 0.9rem;
  color: #4b5563;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.export-btn {
  flex: 0 0 auto;
}

@media (min-resolution: 5dppx) {
  .system-name {
    display: none;
  }
}
</style>
