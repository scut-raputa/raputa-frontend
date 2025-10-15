import request from '@/utils/request'
import type { ListModelsParams, PageResp, ModelRow } from '@/types/model'

export function listModels(params: ListModelsParams) {
  return request
    .get<PageResp<ModelRow>>('/api/model', { params })
    .then((res) => res.data)
}
