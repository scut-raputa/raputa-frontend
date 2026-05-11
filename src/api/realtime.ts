// src/api/realtime.ts
import { postJson } from '@/utils/request'

export interface DeviceOccupationInfo {
  deviceId: string
  occupied: boolean
  patientId?: string
  patientName?: string
  startedAt?: string
  reason?: string
}

export interface RealtimeConnectResult {
  success: boolean
  occupied: boolean
  deviceId: string
  sessionId?: string
  occupation?: DeviceOccupationInfo
  reason?: string
}

export interface FinalizeRealtimeSessionParams {
  sessionId?: string
  deviceId?: string
}

export async function finalizeRealtimeSession(input: string | FinalizeRealtimeSessionParams) {
  const params: FinalizeRealtimeSessionParams =
    typeof input === 'string' ? { deviceId: input } : (input || {})

  const query = params.sessionId
    ? `sessionId=${encodeURIComponent(params.sessionId)}`
    : params.deviceId
      ? `deviceId=${encodeURIComponent(params.deviceId)}`
      : ''

  if (!query) {
    throw new Error('缺少 sessionId 或 deviceId')
  }

  const resp = await postJson<boolean>(
    `/api/realtime/session/finalize?${query}`,
    null
  )
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) {
    throw new Error(resp?.message || '会话文件登记失败')
  }
  return resp.data
}
