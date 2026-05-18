import axios from 'axios'

export async function uploadReportPdf(
  patientId: string,
  patientName: string,
  sessionId: string,
  file: Blob,
  filename: string
) {
  const formData = new FormData()
  formData.append('patientId', patientId)
  formData.append('patientName', patientName)
  formData.append('sessionId', sessionId)
  formData.append('file', file, filename)

  const resp = await axios.post('/api/report/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  })

  const data = resp.data
  const ok = data?.code === 0 || data?.code === 200
  if (!ok) {
    throw new Error(data?.message || '上传报告失败')
  }
  return data.data as string
}
