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
