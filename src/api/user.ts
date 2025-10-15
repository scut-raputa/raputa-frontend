import request from '@/utils/request'
import type { ApiResponse } from '@/types/response'
import type {
  UserVO,
  RegisterPayload,
  LoginPayload,
  LoginData,
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
