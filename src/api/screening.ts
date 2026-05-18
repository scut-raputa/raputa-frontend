import request, { getJson, postJson } from '@/utils/request'
import type { ApiResponse } from '@/types/response'

export interface ScreeningRecordRow {
  id: string
  source: string
  status: 'COMPLETED' | 'NEEDS_PATIENT_RECORD' | 'ARCHIVED' | string
  appointmentId?: string | null
  patientId?: string | null
  subjectName: string
  subjectGender?: '男' | '女' | null
  subjectAge?: number | null
  subjectIdCard?: string | null
  subjectPhone?: string | null
  subjectDept?: string | null
  checkDept?: string | null
  deviceId?: string | null
  mode?: string | null
  sessionId?: string | null
  result: string
  riskLevel?: string | null
  staff?: string | null
  totalSwallows?: number | null
  normalSwallows?: number | null
  dysphagiaSwallows?: number | null
  aspirationSwallows?: number | null
  checkTime?: string | null
  archivedAt?: string | null
}

export interface ScreeningRecordPayload {
  appointmentId?: string
  subjectName: string
  subjectGender?: '男' | '女'
  subjectAge?: number
  subjectIdCard?: string
  subjectPhone?: string
  subjectDept?: string
  checkDept?: string
  deviceId?: string
  mode: 'REALTIME' | 'FILE'
  sessionId?: string
  result: 'NORMAL' | 'DYSPHAGIA' | 'ASPIRATION'
  riskLevel: string
  staff?: string
  totalSwallows: number
  normalSwallows: number
  dysphagiaSwallows: number
  aspirationSwallows: number
  checkTime?: string
}

export interface ScreeningArchivePayload {
  patientId: string
  staff?: string
}

export interface PageWrap<T> {
  items: T[]
  total: number
}

function unwrap<T>(resp: ApiResponse<T>): T {
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) throw new Error(resp?.message || '请求失败')
  return (resp.data as T) ?? ({} as T)
}

export async function listScreeningRecords(params: {
  page: number
  size: number
  appointmentId?: string
  patientId?: string
  name?: string
  status?: string
}) {
  const resp = await getJson<PageWrap<ScreeningRecordRow>>('/api/screening-record', { params })
  return unwrap(resp)
}

export async function createScreeningRecord(payload: ScreeningRecordPayload) {
  const resp = await postJson<ScreeningRecordRow>('/api/screening-record', payload)
  return unwrap(resp)
}

export async function archiveScreeningRecord(id: string, payload: ScreeningArchivePayload) {
  const resp = await request.patch<ApiResponse<ScreeningRecordRow>, ApiResponse<ScreeningRecordRow>>(
    `/api/screening-record/${encodeURIComponent(id)}/archive`,
    payload,
  )
  return unwrap(resp)
}
