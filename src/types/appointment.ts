export interface AppointmentRow {
  id: string
  name: string
  gender?: '男' | '女' | null
  idCard?: string | null
  birth?: string | null
  age?: number | null
  phone?: string | null
  dept: string
  time: string
  status?: 'PENDING' | 'COMPLETED' | string | null
}

export interface PageWrap<T> {
  items: T[]
  total: number
}
