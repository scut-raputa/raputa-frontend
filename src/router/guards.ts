// src/router/guards.ts
import type { Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import { clearUser, getUser, setUser } from '@/utils/auth'
import { getCurrentUser } from '@/api/user'
import type { UserVO } from '@/types/user'

const PUBLIC_ROUTES = new Set<string>(['/login', '/register'])
let bootstrapPromise: Promise<UserVO | null> | null = null

function isPublic(path: string) {
  return PUBLIC_ROUTES.has(path)
}

function homePathForRole(role?: string) {
  return role === 'ADMIN' ? '/dashboard/system' : '/dashboard/patient'
}

async function ensureUser(): Promise<UserVO | null> {
  const cached = getUser()
  if (cached) return cached

  if (!bootstrapPromise) {
    bootstrapPromise = getCurrentUser()
      .then((resp) => {
        if ((resp.code === 0 || resp.code === 200) && resp.data) {
          setUser(resp.data)
          return resp.data
        }
        clearUser()
        return null
      })
      .catch(() => {
        clearUser()
        return null
      })
      .finally(() => {
        bootstrapPromise = null
      })
  }
  return bootstrapPromise
}

export function installRouterGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const user = await ensureUser()

    if (user && isPublic(to.path)) {
      return next({ path: homePathForRole(user.role), replace: true })
    }

    if (!user) {
      if (isPublic(to.path)) return next()
      ElMessage.error('未登录，禁止访问')
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
}
