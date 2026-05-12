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
    responsible: string | null
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
    responsible?: string
    status?: string
    storageLocation?: string
  }
  
  export type DeviceFormData = {
    name: string
    ip: string
    hardwareId: string
    lastConnectedTime: string | null
    status: string
    accessMode?: 'DISCOVERY' | 'STATIC' | 'MANUAL'
    controlPort?: number
    rtspPath?: string
    enabled?: boolean
    description: string
    storageLocation: string
    responsible: string
  }
  
  export type DoctorRow = {
    id: string
    name: string
    department: string | null
    title: string | null
    phone: string | null
  }
  
  export type DoctorQueryParams = {
    page: number
    size: number
    id?: string
    name?: string
    department?: string
    phone?: string
    title?: string
  }
  
  export type DoctorFormData = {
    name: string
    department: string
    title: string
    phone: string
  }
  
  export type PageResp<T> = {
    items: T[]
    total: number
  }
