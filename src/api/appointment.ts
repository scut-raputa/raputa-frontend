import { getJson } from '@/utils/request'
import type { ApiResponse } from '@/types/response'
import type { AppointmentRow, PageWrap } from '@/types/appointment'

export interface AppointmentQuery {
  page: number
  size: number
  id?: string
  name?: string
  dept?: string
  date?: string
}

function unwrap<T>(resp: ApiResponse<T>): T {
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) throw new Error(resp?.message || '请求失败')
  return (resp.data as T) ?? ({} as T)
}

export async function listAppointments(params: AppointmentQuery) {
  const resp = await getJson<PageWrap<AppointmentRow>>('/api/appointment', {
    params,
  })
  return unwrap(resp)
}
