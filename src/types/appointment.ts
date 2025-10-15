export interface AppointmentRow {
  id: string
  name: string
  dept: string
  time: string
}

export interface PageWrap<T> {
  items: T[]
  total: number
}
