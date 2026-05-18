import { ref } from 'vue'

export interface ReportData {
  taskType?: 'dys' | 'asp'
  name: string
  gender: string
  age: number
  outpatientId: string
  department: string
  appointmentDept?: string
  checkDept?: string
  appointmentTime?: string
  date: string
  reportId: string
  totalSwallows: number
  normalSwallows: number
  abnormalSwallows: number
  dysphagiaSwallows: number
  aspirationSwallows: number
  dysphagiaEvents?: Array<{ start: number; end: number }>
  aspirationEvents?: Array<{ start: number; end: number }>
  riskLevel: string
  suggestions: string[]
  doctor: string
  diagnosis: string
  time: string
}

export const reportData = ref<ReportData>({
  taskType: 'asp',
  name: '',
  gender: '',
  age: 0,
  outpatientId: '',
  department: '',
  appointmentDept: '',
  checkDept: '',
  appointmentTime: '',
  date: '',
  reportId: '',
  totalSwallows: 0,
  normalSwallows: 0,
  abnormalSwallows: 0,
  dysphagiaSwallows: 0,
  aspirationSwallows: 0,
  dysphagiaEvents: [],
  aspirationEvents: [],
  riskLevel: '',
  suggestions: [],
  doctor: '',
  diagnosis: '',
  time: '',
})
