import request from '@/utils/request'
import type {
  DeviceQueryParams,
  DeviceFormData,
  DeviceRow,
  PageResp,
} from '@/types/deviceManagement'

export function listDevices(params: DeviceQueryParams) {
  return request
    .get<PageResp<DeviceRow>>('/api/device', { params })
    .then((res) => res.data)
}

export function getDeviceLocations(): Promise<string[]> {
  return request.get<string[]>('/api/device/locations').then((res) => res.data)
}

export function updateDevice(id: string, data: DeviceFormData) {
  return request
    .put<DeviceRow>(`/api/device/${id}`, data)
    .then((res) => res.data)
}

export function forceReleaseDeviceLock(id: string) {
  return request
    .post<boolean>(`/api/device/${id}/force-release`)
    .then((res) => res.data)
}
