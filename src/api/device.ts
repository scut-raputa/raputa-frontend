import { postJson } from '@/utils/request'

// 设备发现响应数据类型
export interface DeviceDiscoveryData {
  deviceIp: string
  deviceName: string
  status: string
  discoveryTime: number
  deviceInfo: string
}

// 快速设备发现
export async function quickDeviceDiscovery() {
  const resp = await postJson<DeviceDiscoveryData>('/api/device/discover/quick',null,{ timeout: 15000 })
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) throw new Error(resp?.message || '设备发现失败')
  return resp.data
}

// 连接设备开始接收实时数据
export async function connectRealtimeDevice(deviceIp: string, deviceId: string) {
  const resp = await postJson<boolean>(`/api/realtime/connect?deviceIp=${deviceIp}&deviceId=${deviceId}`, null, { timeout: 10000 })
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) throw new Error(resp?.message || '设备连接失败')
  return resp.data
}

// 断开设备连接
export async function disconnectRealtimeDevice(deviceId: string) {
  const resp = await postJson<boolean>(`/api/realtime/disconnect?deviceId=${deviceId}`, null)
  const ok = resp?.code === 0 || resp?.code === 200
  if (!ok) throw new Error(resp?.message || '断开连接失败')
  return resp.data
}