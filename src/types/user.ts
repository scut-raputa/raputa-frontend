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
  token: string
  user: UserVO
}
