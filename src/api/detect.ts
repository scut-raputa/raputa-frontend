import { postJson } from '@/utils/request'

export interface SwallowEvent {
  start: number
  end: number
}

export interface DysphagiaResult {
  predicted_class: number
  label: string
  probabilitys: number[]
}

export interface AspirationResult {
  predicted_class: number
  label: string
  probabilitys: number[]
  similaritys: number[]
}

export interface DetectionResponse {
  sessionId?: string
  status?: string
  predictionWindowSeconds?: number
  prediction_window_seconds?: number
  swallowEvents?: number[][]
  swallow_events?: number[][]
  dysphagia?: DysphagiaResult[]
  aspiration?: AspirationResult[]
  message?: string
}

export async function uploadAndPredict(
  audioFile: File,
  imuFile: File,
  gasFile: File,
  patientId: string,
  patientName: string,
  taskType: string
): Promise<DetectionResponse> {
  const formData = new FormData()
  formData.append('audio', audioFile)
  formData.append('imu', imuFile)
  formData.append('gas', gasFile)
  formData.append('patientId', patientId)
  formData.append('patientName', patientName || '')
  formData.append('taskType', taskType)

  try {
    const response = await postJson<DetectionResponse>(
      '/api/inference/file-detect',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    )

    const ok = response?.code === 0 || response?.code === 200
    if (!ok) {
      throw new Error(response?.message || '检测失败')
    }
    if (!response.data) {
      throw new Error(response?.message || '检测结果为空')
    }
    return response.data
  } catch (error: any) {
    console.error('检测请求失败:', error)
    throw new Error(error?.response?.data?.message || error?.message || '检测失败')
  }
}
