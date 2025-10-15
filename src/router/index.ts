import { createRouter, createWebHistory } from 'vue-router'
import { installRouterGuards } from './guards'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
  },
  {
    path: '/dashboard',
    component: () => import('@/components/DashboardLayout.vue'),
    children: [
      {
        path: 'patient',
        name: 'DashboardPatient',
        component: () => import('@/views/Patient.vue'),
      },
      {
        path: 'model',
        name: 'DashboardModel',
        component: () => import('@/views/Model.vue'),
      },
      {
        path: 'monitor',
        name: 'DashboardMonitor',
        component: () => import('@/views/Monitor.vue'),
      },
      {
        path: 'data',
        name: 'DashboardData',
        component: () => import('@/views/Data.vue'),
      },
      {
        path: 'department',
        name: 'DashboardDepartment',
        component: () => import('@/views/Department.vue'),
      },
      {
        path: 'system',
        name: 'DashboardSystem',
        component: () => import('@/views/System.vue'),
      },
      {
        path: 'stats',
        name: 'DashboardStats',
        component: () => import('@/views/Stats.vue'),
      },
      { path: '', redirect: 'patient' },
    ],
  },
  { path: '/', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

installRouterGuards(router)

export default router
