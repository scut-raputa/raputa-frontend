import { getJson } from '@/utils/request'
import type { ApiResponse } from '@/types/response'
import type { CheckRow, PageWrap } from '@/types/check'

export interface CheckQuery {
  page: number
  size: number
  id?: string
  name?: string
  staff?: string
  result?: string
  date?: string
}

function unwrap<T>(resp: ApiResponse<T>): T {
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) throw new Error(resp?.message || '请求失败')
  return (resp.data as T) ?? ({} as T)
}

export async function listChecks(params: CheckQuery) {
  const resp = await getJson<PageWrap<CheckRow>>('/api/check', { params })
  return unwrap(resp)
}
