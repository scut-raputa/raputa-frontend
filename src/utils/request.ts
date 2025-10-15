import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getToken, clearToken, clearUser } from '@/utils/auth'
import type { ApiResponse } from '@/types/response'

const instance = axios.create({
  baseURL: '',
  timeout: 10000,
})

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token) {
    const headers = new AxiosHeaders(config.headers as any)
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }
  return config
})

instance.interceptors.response.use(
  (resp) => resp.data,
  (error: AxiosError<any>) => {
    const status = error.response?.status
    const serverMsg = (error.response?.data as any)?.message
    if (serverMsg) error.message = serverMsg

    if (status === 401) {
      clearToken()
      clearUser()
      window.location.replace('/login')
    }
    return Promise.reject(error)
  },
)

export default instance

export async function getJson<T>(url: string, config?: any) {
  return instance.get<ApiResponse<T>, ApiResponse<T>>(url, config)
}

export async function postJson<T>(url: string, data?: any, config?: any) {
  return instance.post<ApiResponse<T>, ApiResponse<T>>(url, data, config)
}
