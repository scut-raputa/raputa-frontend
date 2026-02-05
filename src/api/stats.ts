import request from '@/utils/request'
import type { ApiResponse } from '@/types/response'


export interface DailyPatientCount {
  category: string  
  value: number     
}


export interface DailyCheckResult {
  category: string      
  normal: number       
  dysphagia: number     
  overt: number         
  silent: number        
}

export interface DeptPatientCount {
  name: string   
  value: number 
}

export interface DeviceUsage {
  deviceId: string        
  usageHours: number[]    
}

export interface StatsResponse {
  dailyPatientCount: DailyPatientCount[]    
  dailyCheckResult: DailyCheckResult[]      
  deptPatientCount: DeptPatientCount[]      
  deviceUsage: DeviceUsage[]                
}

export interface StatsQuery {
  startDate?: string  
  endDate?: string    
  days?: number       
}

export function getStats(params?: StatsQuery) {
  return request<ApiResponse<StatsResponse>>({
    url: '/api/stats',
    method: 'get',
    params,
  })
}

export function getDailyPatientCount(params?: StatsQuery) {
  return request<ApiResponse<StatsResponse>>({
    url: '/api/stats/daily-patient-count',
    method: 'get',
    params,
  })
}
