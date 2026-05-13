import axios, { AxiosError } from 'axios'
import type { ApiResponse } from '@/types/response'
import { clearUser } from '@/utils/auth'

axios.defaults.withCredentials = true

const instance = axios.create({
  baseURL: '',
  timeout: 10000,
  withCredentials: true,
})

instance.interceptors.response.use(
  (resp) => resp.data,
  (error: AxiosError<any>) => {
    const serverMsg = (error.response?.data as any)?.message
    if (serverMsg) error.message = serverMsg
    if (error.response?.status === 401) {
      clearUser()
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
