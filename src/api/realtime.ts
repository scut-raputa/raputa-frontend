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

export type RealtimeSegmentationMode = 'AUTO' | 'MANUAL'

export interface ManualSwallowSegmentPayload {
  deviceId: string
  startSec: number
  endSec: number
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

export async function setRealtimeSegmentationMode(
  deviceId: string,
  mode: RealtimeSegmentationMode
) {
  const resp = await postJson<boolean>('/api/realtime/segmentation-mode', {
    deviceId,
    mode,
  })
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) {
    throw new Error(resp?.message || '实时分割模式设置失败')
  }
  return resp.data
}

export async function submitManualSwallowSegment(
  payload: ManualSwallowSegmentPayload
) {
  const resp = await postJson<boolean>(
    '/api/realtime/manual-swallow-segment',
    payload
  )
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) {
    throw new Error(resp?.message || '人工吞咽段提交失败')
  }
  return resp.data
}
