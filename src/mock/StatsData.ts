export const lineData = [
  { category: '周日', value: 25 },
  { category: '周一', value: 40 },
  { category: '周二', value: 24 },
  { category: '周三', value: 12 },
  { category: '周四', value: 23 },
  { category: '周五', value: 27 },
  { category: '周六', value: 37 },
]

export const barData = [
  { category: '周日', normal: 18, dysphagia: 5, aspiration: 2 },
  { category: '周一', normal: 26, dysphagia: 10, aspiration: 4 },
  { category: '周二', normal: 16, dysphagia: 6, aspiration: 2 },
  { category: '周三', normal: 8, dysphagia: 3, aspiration: 1 },
  { category: '周四', normal: 15, dysphagia: 6, aspiration: 2 },
  { category: '周五', normal: 19, dysphagia: 6, aspiration: 2 },
  { category: '周六', normal: 24, dysphagia: 9, aspiration: 4 },
]

export const pieData = [
  { name: '呼吸科', value: 28 },
  { name: '肿瘤科', value: 18 },
  { name: '康复科', value: 17 },
  { name: '脑外科', value: 11 },
  { name: '神经内科', value: 11 },
  { name: '普通外科', value: 15 },
]

// export const deptBreakdownData = [
//   { name: '呼吸科', dysphagia: 13, aspiration: 15 },
//   { name: '肿瘤科', dysphagia: 9, aspiration: 9 },
//   { name: '康复科', dysphagia: 8, aspiration: 9 },
//   { name: '脑外科', dysphagia: 5, aspiration: 6 },
//   { name: '神经内科', dysphagia: 5, aspiration: 6 },
//   { name: '普通外科', dysphagia: 7, aspiration: 8 },
// ]

export interface Patient {
  id: string
  name: string
  date: string
  dept: string
}

export const patientTable: Patient[] = [
  {
    id: 'P202508170001',
    name: '张三',
    date: '2025-08-17 09:30',
    dept: '神经内科',
  },
  {
    id: 'P202508160001',
    name: '李四',
    date: '2025-08-16 10:20',
    dept: '康复科',
  },
  {
    id: 'P202508170002',
    name: '王五',
    date: '2025-08-17 14:30',
    dept: '呼吸科',
  },
  {
    id: 'P202508160002',
    name: '赵六',
    date: '2025-08-16 10:30',
    dept: '肿瘤科',
  },
  {
    id: 'P202508180001',
    name: '张三',
    date: '2025-08-18 10:00',
    dept: '康复科',
  },
  {
    id: 'P202508190001',
    name: '李四',
    date: '2025-08-19 16:00',
    dept: '康复科',
  },
  {
    id: 'P202508150001',
    name: '曹操',
    date: '2025-08-15 15:30',
    dept: '康复科',
  },
]

export type Device = {
  id: string
  name: string
  status: '在线' | '离线'
  lastConnected: string // 'YYYY-MM-DD HH:MM:SS'
  desc: string
  location: string
  owner: string
  ip?: string
}

// 适配 System.vue 新表格的设备数据
export const deviceTable: Device[] = [
  {
    id: 'DEV-001',
    name: '吞咽记录仪 A1',
    status: '在线',
    lastConnected: '2025-07-24 09:12:00',
    desc: '标准记录仪，状态良好',
    location: '一号设备间',
    owner: '王医生',
    ip: 'fe80::1ff:fe23:4567:890a',
  },
  {
    id: 'DEV-002',
    name: '吞咽记录仪 A2',
    status: '离线',
    lastConnected: '2025-07-23 17:45:00',
    desc: '待检修：偶发掉线',
    location: '二号设备间',
    owner: '李医生',
    ip: 'fe80::2ff:fe23:4567:890b',
  },
  {
    id: 'DEV-003',
    name: '吞咽记录仪 B1',
    status: '在线',
    lastConnected: '2025-07-24 08:05:00',
    desc: '长期运行，性能稳定',
    location: '一号设备间',
    owner: '王医生',
    ip: 'fe80::3ff:fe23:4567:890c',
  },
  {
    id: 'DEV-004',
    name: '吞咽记录仪 B2',
    status: '离线',
    lastConnected: '2025-07-22 21:30:00',
    desc: '电池欠压，需更换',
    location: '二号设备间',
    owner: '李医生',
    ip: 'fe80::4ff:fe23:4567:890d',
  },
  {
    id: 'DEV-005',
    name: '吞咽记录仪 C1',
    status: '在线',
    lastConnected: '2025-07-24 07:50:00',
    desc: '新上线设备',
    location: '一号设备间',
    owner: '王医生',
    ip: 'fe80::5ff:fe23:4567:890e',
  },
  {
    id: 'DEV-006',
    name: '吞咽记录仪 C2',
    status: '离线',
    lastConnected: '2025-07-21 19:10:00',
    desc: '外观磨损，功能正常',
    location: '二号设备间',
    owner: '李医生',
    ip: 'fe80::6ff:fe23:4567:890f',
  },
]
