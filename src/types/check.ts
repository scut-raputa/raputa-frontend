export type CheckResult = '正常' | '吞咽障碍' | '误吸'

export interface CheckRow {
  id: string
  name: string
  staff: string
  result: CheckResult
  date: string
}

export interface PageWrap<T> {
  items: T[]
  total: number
}
