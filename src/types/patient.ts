export interface PatientRow {
  id: string
  name: string
  gender: '男' | '女'
  age: number | null
  birth: string | null
  admit: string | null
  dept: string | null
  address: string | null
  checked: boolean
}

export interface PageWrap<T> {
  items: T[]
  total: number
}
