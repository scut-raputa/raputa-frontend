import request from '@/utils/request'
import type { ApiResponse } from '@/types/response'

/**
 * 每日检测患者数量数据项
 */
export interface DailyPatientCount {
  category: string  // 日期标签 (如: 周日, 01-15)
  value: number     // 患者数量
}

/**
 * 每日患者检测结果情况数据项
 */
export interface DailyCheckResult {
  category: string      // 日期标签
  normal: number        // 正常患者数
  dysphagia: number     // 吞咽障碍患者数
  overt: number         // 显性误吸患者数
  silent: number        // 隐性误吸患者数
}

/**
 * 科室患者占比数据项
 */
export interface DeptPatientCount {
  name: string   // 科室名称
  value: number  // 患者数量
}

/**
 * 设备使用时长数据项
 */
export interface DeviceUsage {
  deviceId: string        // 设备ID
  usageHours: number[]    // 每日使用时长数组 (单位: 小时)
}

/**
 * 统计数据响应
 */
export interface StatsResponse {
  dailyPatientCount: DailyPatientCount[]    // 每日检测患者数量
  dailyCheckResult: DailyCheckResult[]      // 每日患者检测结果情况
  deptPatientCount: DeptPatientCount[]      // 各科室患者占比
  deviceUsage: DeviceUsage[]                // 设备使用时长
}

/**
 * 统计查询参数
 */
export interface StatsQuery {
  startDate?: string  // 开始日期 (格式: yyyy-MM-dd)
  endDate?: string    // 结束日期 (格式: yyyy-MM-dd)
  days?: number       // 最近N天 (默认7天)
}

/**
 * 获取统计数据
 */
export function getStats(params?: StatsQuery) {
  return request<ApiResponse<StatsResponse>>({
    url: '/api/stats',
    method: 'get',
    params,
  })
}

/**
 * 获取每日检测患者数量
 */
export function getDailyPatientCount(params?: StatsQuery) {
  return request<ApiResponse<StatsResponse>>({
    url: '/api/stats/daily-patient-count',
    method: 'get',
    params,
  })
}
