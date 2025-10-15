// src/router/guards.ts
import type { Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getToken, getUser, clearToken, clearUser } from '@/utils/auth'

const PUBLIC_ROUTES = new Set<string>(['/login', '/register'])
function isPublic(path: string) {
  return PUBLIC_ROUTES.has(path)
}

function bounceToLogin(router: Router, msg = '未登录或登录已失效') {
  clearToken()
  clearUser()
  if (msg) ElMessage.error(msg)
  router.replace('/login')
}

export function installRouterGuards(router: Router) {
  router.beforeEach((to, from, next) => {
    const token = getToken()
    const user = getUser()

    if (!token) {
      if (isPublic(to.path)) return next()
      ElMessage.error('未登录，禁止访问')
      return next({ path: '/login', replace: true })
    }
    if (!user) {
      ElMessage.error('会话异常，用户信息缺失，请重新登录')
      return next({ path: '/login', replace: true })
    }

    const isSystemRoute =
      to.path === '/system' || to.path.startsWith('/dashboard/system')
    if (isSystemRoute && user.role !== 'ADMIN') {
      ElMessage.error('无权限访问系统管理')
      const back =
        from.path && from.path !== to.path ? from.path : '/dashboard/department'
      return next({ path: back, replace: true })
    }

    const isDepartmentRoute =
      to.path === '/department' || to.path.startsWith('/dashboard/department')
    if (isDepartmentRoute && user.role !== 'DEPARTMENT') {
      ElMessage.error('无权限访问科室管理')
      const back =
        from.path && from.path !== to.path ? from.path : '/dashboard/system'
      return next({ path: back, replace: true })
    }

    next()
  })

  window.addEventListener('storage', (e) => {
    if (e.key === 'raputa_token' || e.key === 'raputa_user') {
      const token = getToken()
      const user = getUser()
      if (!token || !user) bounceToLogin(router, '登录状态已变化，请重新登录')
    }
  })
  window.addEventListener('focus', () => {
    const token = getToken()
    const user = getUser()
    const path = router.currentRoute.value.path
    if ((!token || !user) && !isPublic(path)) bounceToLogin(router, '')
  })
}
