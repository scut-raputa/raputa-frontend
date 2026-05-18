export type UserRole = 'DEPARTMENT' | 'ADMIN'

export interface UserVO {
  id: number
  username: string
  hospitalName: string
  departmentName: string
  enabled: boolean
  createdAt: string
  lastLoginAt?: string
  lastLoginIp?: string
  lastSeenAt?: string
  online?: boolean
  avatarUrl?: string
  role: UserRole
}

export interface RegisterPayload {
  username: string
  password: string
  hospitalName: string
  departmentName: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginData {
  token?: string | null
  user: UserVO
}

export interface UserQueryParams {
  page: number
  size: number
  username?: string
  hospitalName?: string
  departmentName?: string
  role?: UserRole
}

export interface UserFormData {
  username?: string
  password?: string
  hospitalName: string
  departmentName: string
  role: UserRole
}

export interface PasswordResetPayload {
  adminPassword: string
  newPassword: string
}

export interface PageResp<T> {
  items: T[]
  total: number
}
