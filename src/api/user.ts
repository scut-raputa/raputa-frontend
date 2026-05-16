import request from '@/utils/request'
import type { ApiResponse } from '@/types/response'
import type {
  UserVO,
  RegisterPayload,
  LoginPayload,
  LoginData,
  PageResp,
  PasswordResetPayload,
  UserFormData,
  UserQueryParams,
} from '@/types/user'

export function registerUser(payload: RegisterPayload) {
  return request.post<ApiResponse<UserVO>, ApiResponse<UserVO>>(
    '/api/user/register',
    payload,
  )
}

export function loginUser(payload: LoginPayload) {
  return request.post<ApiResponse<LoginData>, ApiResponse<LoginData>>(
    '/api/user/login',
    payload,
  )
}

export function getCurrentUser() {
  return request.get<ApiResponse<UserVO>, ApiResponse<UserVO>>('/api/user/me')
}

export function logoutUser() {
  return request.post<ApiResponse<null>, ApiResponse<null>>('/api/user/logout')
}

export function listAdminUsers(params: UserQueryParams) {
  return request
    .get<ApiResponse<PageResp<UserVO>>, ApiResponse<PageResp<UserVO>>>(
      '/api/admin/users',
      { params },
    )
    .then((res) => res.data)
}

export function createAdminUser(data: UserFormData) {
  return request
    .post<ApiResponse<UserVO>, ApiResponse<UserVO>>('/api/admin/users', data)
    .then((res) => res.data)
}

export function updateAdminUser(id: number, data: UserFormData) {
  return request
    .put<ApiResponse<UserVO>, ApiResponse<UserVO>>(`/api/admin/users/${id}`, data)
    .then((res) => res.data)
}

export function resetAdminUserPassword(id: number, data: PasswordResetPayload) {
  return request
    .post<ApiResponse<UserVO>, ApiResponse<UserVO>>(
      `/api/admin/users/${id}/reset-password`,
      data,
    )
    .then((res) => res.data)
}

export function deleteAdminUser(id: number) {
  return request
    .delete<ApiResponse<null>, ApiResponse<null>>(`/api/admin/users/${id}`)
    .then((res) => res.data)
}
