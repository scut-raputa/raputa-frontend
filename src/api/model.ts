import request from '@/utils/request'
import type {
  ListModelsParams,
  PageResp,
  ModelRow,
  ModelStats,
  ModelFormData,
  RuntimeListParams,
  RuntimeModelRow,
  RuntimeSummary,
  InferenceHealth,
} from '@/types/model'

export function listModels(params: ListModelsParams) {
  return request
    .get<PageResp<ModelRow>>('/api/model', { params })
    .then((res) => res.data)
}

export function getModelStats() {
  return request.get<ModelStats>('/api/model/stats').then((res) => res.data)
}

export function createModel(data: ModelFormData) {
  return request.post<ModelRow>('/api/model', data).then((res) => res.data)
}

export function updateModel(id: string, data: ModelFormData) {
  return request.put<ModelRow>(`/api/model/${id}`, data).then((res) => res.data)
}

export function deleteModel(id: string) {
  return request.delete(`/api/model/${id}`).then((res) => res.data)
}

export function getRuntimeSummary() {
  return request.get<RuntimeSummary>('/api/model/runtime-summary').then((res) => res.data)
}

export function listRuntimeModels(params: RuntimeListParams) {
  return request.get<RuntimeModelRow[]>('/api/model/runtime-list', { params }).then((res) => res.data)
}

export function getInferenceHealth() {
  return request.get<InferenceHealth>('/api/inference/health').then((res) => res.data)
}