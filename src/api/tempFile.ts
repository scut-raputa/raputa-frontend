// src/api/tempFile.ts
import request from '@/utils/request'
import type { TempFileUploadVO, CsvMappingRequest } from '@/types/tempFile'

export async function uploadTempFileApi(file: File) {
  const fd = new FormData()
  fd.append('file', file, file.name)
  return request
    .post<TempFileUploadVO>('/api/files/temp', fd)
    .then((res) => res.data)
}

export async function submitCsvMapping(
  tempId: string,
  payload: CsvMappingRequest,
) {
  return request
    .post<void>(`/api/files/temp/${tempId}/mapping`, payload)
    .then((res) => res.data)
}

export async function deleteTempFileApi(tempId: string) {
  return request
    .delete<void>(`/api/files/temp/${tempId}`)
    .then((res) => res.data)
}
