export type CheckResult = '吞咽障碍' | '显性误吸' | '隐性误吸' | '正常'

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
