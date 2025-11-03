// 检测辅助函数
import type { DetectionResponse } from '@/api/detect'

export function processDetectionResult(
  result: DetectionResponse,
  maxTime: number
): { time: number; swallow: number; risk: number }[] {
  if (!result.swallow_events) return []
  
  // 将毫秒转换为秒
  const events = result.swallow_events.map(([start, end]) => [
    start / 1000,
    end / 1000
  ])
  
  // 生成吞咽段识别数据和风险概率数据
  const playbackRows: { time: number; swallow: number; risk: number }[] = []
  const step = 0.05  // 50ms步长
  
  for (let t = 0; t <= maxTime; t = +(t + step).toFixed(2)) {
    // 检查当前时间点是否在某个吞咽段内
    let eventIndex = -1
    let inEvent = false
    
    for (let i = 0; i < events.length; i++) {
      const [start, end] = events[i]
      if (t >= start && t <= end) {
        inEvent = true
        eventIndex = i
        break
      }
    }
    
    // 获取对应的风险概率
    let risk = 0
    if (inEvent && eventIndex >= 0) {
      // 使用吞咽障碍检测结果的概率
      if (result.dysphagia && result.dysphagia[eventIndex]) {
        risk = result.dysphagia[eventIndex].probabilitys[1] || 0
      }
      // 也可以结合误吸检测结果
      if (result.aspiration && result.aspiration[eventIndex]) {
        const aspirationRisk = result.aspiration[eventIndex].probabilitys[1] || 0
        risk = Math.max(risk, aspirationRisk)
      }
    }
    
    playbackRows.push({
      time: t,
      swallow: inEvent ? 1 : 0,
      risk: +risk.toFixed(3)
    })
  }
  
  return playbackRows
}
