import request from '@/utils/request'


export interface DailyPatientCount {
  category: string  
  value: number     
}


export interface DailyCheckResult {
  category: string      
  normal: number       
  dysphagia: number     
  aspiration: number    
}

export interface DeptPatientCount {
  name: string   
  value: number 
}

export interface DeviceUsage {
  deviceId: string        
  usageMinutes: number[]  
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
  return request.get<StatsResponse>('/api/stats', { params }).then((res) => res.data)
}

export function getDailyPatientCount(params?: StatsQuery) {
  return request
    .get<StatsResponse>('/api/stats/daily-patient-count', { params })
    .then((res) => res.data)
}
