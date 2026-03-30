import request from '@/utils/request'
import type {
  DeviceQueryParams,
  DeviceFormData,
  DeviceRow,
  DoctorQueryParams,
  DoctorFormData,
  DoctorRow,
  PageResp,
} from '@/types/department'

// ─── Device ───────────────────────────────────────────────────────────────
export function listDevices(params: DeviceQueryParams) {
  return request
    .get<PageResp<DeviceRow>>('/api/device', { params })
    .then((res) => res.data)
}

export function getDeviceLocations(): Promise<string[]> {
  return request.get<string[]>('/api/device/locations').then((res) => res.data)
}

export function createDevice(data: DeviceFormData) {
  return request.post<DeviceRow>('/api/device', data).then((res) => res.data)
}

export function updateDevice(id: string, data: DeviceFormData) {
  return request.put<DeviceRow>(`/api/device/${id}`, data).then((res) => res.data)
}

export function deleteDevice(id: string) {
  return request.delete(`/api/device/${id}`).then((res) => res.data)
}

export function toggleDeviceStatus(id: string) {
  return request.patch<DeviceRow>(`/api/device/${id}/status`).then((res) => res.data)
}

// ─── Doctor ───────────────────────────────────────────────────────────────
export function listDoctors(params: DoctorQueryParams) {
  return request
    .get<PageResp<DoctorRow>>('/api/doctor', { params })
    .then((res) => res.data)
}

export function createDoctor(data: DoctorFormData) {
  return request.post<DoctorRow>('/api/doctor', data).then((res) => res.data)
}

export function updateDoctor(id: string, data: DoctorFormData) {
  return request.put<DoctorRow>(`/api/doctor/${id}`, data).then((res) => res.data)
}

export function deleteDoctor(id: string) {
  return request.delete(`/api/doctor/${id}`).then((res) => res.data)
}