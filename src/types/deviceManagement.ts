export type DeviceRow = {
  id: string
  name: string
  ip: string | null
  hardwareId: string | null
  lastConnectedTime: string | null
  lastSeenAt: string | null
  status: '在线' | '离线'
  accessMode: 'DISCOVERY' | 'STATIC' | 'MANUAL'
  controlPort: number | null
  rtspPath: string | null
  enabled: boolean
  description: string | null
  storageLocation: string | null
  occupied: boolean
  occupiedSessionId: string | null
  occupiedPatientId: string | null
  occupiedPatientName: string | null
  lockExpiresAt: string | null
}

export type DeviceQueryParams = {
  page: number
  size: number
  id?: string
  name?: string
  status?: string
  storageLocation?: string
}

export type DeviceFormData = {
  name: string
  description: string
  storageLocation: string
}

export type PageResp<T> = {
  items: T[]
  total: number
}
