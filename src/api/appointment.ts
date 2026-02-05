import request, { getJson, postJson } from '@/utils/request'
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

export interface CreateAppointmentPayload {
  name: string
  dept: string
  time: string
}

export interface UpdateAppointmentPayload {
  name: string
  dept: string
  time: string
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

export async function createAppointment(payload: CreateAppointmentPayload) {
  const resp = await postJson<AppointmentRow>('/api/appointment', payload)
  return unwrap(resp)
}

export async function updateAppointment(id: string, payload: UpdateAppointmentPayload) {
  const resp = await request.patch<ApiResponse<AppointmentRow>, ApiResponse<AppointmentRow>>(
    `/api/appointment/${encodeURIComponent(id)}`,
    payload,
  )
  return unwrap(resp)
}

export async function deleteAppointment(id: string) {
  const resp = await request.delete<ApiResponse<null>, ApiResponse<null>>(
    `/api/appointment/${encodeURIComponent(id)}`,
  )
  return unwrap(resp)
}
