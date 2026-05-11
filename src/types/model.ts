export type ModelRow = {
  id: string
  func: string
  name: string
  uploadTime: string
  uploader: string
  remark: string
  accuracy?: number | null
  sensitivity?: number | null
  specificity?: number | null
}

export type ListModelsParams = {
  page: number
  size: number
  id?: string
  func?: string
  name?: string
  uploader?: string
  date?: string
}

export type PageResp<T> = {
  items: T[]
  total: number
}

export type ModelStats = {
  totalCount: number
  weekNewCount: number
  lastWeekNewCount: number
  topUploader: string | null
  topUploaderCount: number
  topUploaderRatio: number
}

export type ModelFormData = {
  func: string
  name: string
  uploadTime: string
  uploader: string
  remark: string
  location: string
  accuracy: number | null
  sensitivity: number | null
  specificity: number | null
}

export type RuntimeListParams = {
  name?: string
  taskType?: string
  loaded?: boolean
  available?: boolean
}

export type RuntimeModelRow = {
  name: string
  taskType: string
  modelVersion: string
  deployPath: string
  loaded: boolean
  serviceLive: boolean
  serviceReady: boolean
  device: string
  serviceName: string
  lastHealthCheckAt: string
  lastHealthError?: string | null
}

export type RuntimeSummary = {
  serviceLive: boolean
  serviceReady: boolean
  discoveredModelCount: number
  loadedModelCount: number
  availableModelCount: number
  unavailableModelCount: number
  lastHealthCheckAt: string
  lastHealthError?: string | null
}

export type InferenceHealth = {
  serviceName: string
  inferenceBaseUrl: string
  serviceLive: boolean
  serviceReady: boolean
  lastHealthCheckAt: string
  lastHealthError?: string | null
}