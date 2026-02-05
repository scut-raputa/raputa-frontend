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
  idCard: string | null
  onsetDate: string | null
  pastHistory: string | null
  bedNumber: string | null
  course: string | null
}

export interface PageWrap<T> {
  items: T[]
  total: number
}
