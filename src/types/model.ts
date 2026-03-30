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