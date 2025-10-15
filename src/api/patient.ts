import request, { getJson, postJson } from '@/utils/request'
import type { ApiResponse } from '@/types/response'
import type { PatientRow, PageWrap } from '@/types/patient'

export interface PatientQuery {
  page: number
  size: number
  name?: string
  dept?: string
  address?: string
  gender?: '男' | '女'
  checked?: boolean
}

export interface UpdatePatientPayload {
  dept: string
  address: string
}

export async function patchJson<T>(url: string, data?: any, config?: any) {
  return request.patch<ApiResponse<T>, ApiResponse<T>>(url, data, config)
}

function unwrap<T>(resp: ApiResponse<T>): T {
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) throw new Error(resp?.message || '请求失败')
  return (resp.data as T) ?? ({} as T)
}

export async function listPatients(params: PatientQuery) {
  const resp = await getJson<PageWrap<PatientRow>>('/api/patient', { params })
  return unwrap(resp)
}

export interface CreatePatientPayload {
  name: string
  gender: '男' | '女'
  birth: string
  dept: string
  address: string
  checked: boolean
}

export async function createPatient(payload: CreatePatientPayload) {
  const resp = await postJson<PatientRow>('/api/patient', payload)
  return unwrap(resp)
}

export async function updatePatient(id: string, payload: UpdatePatientPayload) {
  const resp = await patchJson<PatientRow>(
    `/api/patient/${encodeURIComponent(id)}`,
    payload,
  )
  return unwrap(resp)
}

export async function deletePatient(id: string) {
  const resp = await request.delete<ApiResponse<null>, ApiResponse<null>>(
    `/api/patient/${encodeURIComponent(id)}`,
  )
  return unwrap(resp)
}
