import request from '@/utils/request'
import type {
  RuntimeListParams,
  RuntimeModelRow,
  RuntimeSummary,
} from '@/types/model'

export function getRuntimeSummary() {
  return request.get<RuntimeSummary>('/api/model/runtime-summary').then((res) => res.data)
}

export function listRuntimeModels(params: RuntimeListParams) {
  return request.get<RuntimeModelRow[]>('/api/model/runtime-list', { params }).then((res) => res.data)
}
