import axios from 'axios'


// 检测结果接口定义
export interface SwallowEvent {
  start: number  // 开始时间（毫秒）
  end: number    // 结束时间（毫秒）
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
  swallow_events?: number[][]  // 吞咽事件时间段 [[start, end], ...]
  dysphagia?: DysphagiaResult[]  // 吞咽障碍检测结果
  aspiration?: AspirationResult[]  // 误吸检测结果
  message?: string  // 错误消息（当未检测到吞咽事件时）
}

/**
 * 上传文件并进行检测
 * @param audioFile 音频文件（WAV格式）
 * @param imuFile IMU信号文件（CSV格式）
 * @param gasFile 鼻气流信号文件（CSV格式）
 * @returns 检测结果
 */
export async function uploadAndPredict(
  audioFile: File,
  imuFile: File,
  gasFile: File
): Promise<DetectionResponse> {
  const formData = new FormData()
  formData.append('audio', audioFile)
  formData.append('imu', imuFile)
  formData.append('gas', gasFile)

  try {
    const response = await axios.post<DetectionResponse>(
      '/detect/upload_predict/',  // 使用代理路径
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60秒超时
      }
    )
    return response.data
  } catch (error: any) {
    console.error('检测请求失败:', error)
    throw new Error(error?.response?.data?.message || error?.message || '检测失败')
  }
}
