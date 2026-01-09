// src/api/realtime.ts
import { postJson } from '@/utils/request'

export async function finalizeRealtimeSession(deviceId: string) {
  const resp = await postJson<boolean>(
    `/api/realtime/session/finalize?deviceId=${encodeURIComponent(deviceId)}`,
    null
  )
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) {
    throw new Error(resp?.message || '会话文件登记失败')
  }
  return resp.data
}
