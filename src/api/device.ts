import { postJson } from '@/utils/request'
import type { RealtimeConnectResult } from '@/api/realtime'

export interface DeviceDiscoveryData {
  deviceId?: string
  deviceIp: string
  deviceName: string
  status: string
  discoveryTime: number
  deviceInfo: string
  rtspPath?: string
}

export async function quickDeviceDiscovery() {
  const resp = await postJson<DeviceDiscoveryData>('/api/device/discover/quick', null, { timeout: 15000 })
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) throw new Error(resp?.message || '设备发现失败')
  return resp.data
}

export async function connectRealtimeDevice(
  deviceIp: string,
  deviceId: string,
  deviceName: string,
  patientId: string,
  patientName: string,
  taskType: string
) {
  const body = { deviceIp, deviceId, deviceName, patientId, patientName, taskType }
  const resp = await postJson<RealtimeConnectResult>('/api/realtime/connect', body, { timeout: 10000 })
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) throw new Error(resp?.message || '设备连接失败')
  if (!resp.data) throw new Error(resp?.message || '设备连接失败')
  return resp.data
}

export async function disconnectRealtimeDevice(deviceId: string) {
  const resp = await postJson<boolean>(`/api/realtime/disconnect?deviceId=${encodeURIComponent(deviceId)}`, null)
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) throw new Error(resp?.message || '断开连接失败')
  return resp.data
}
