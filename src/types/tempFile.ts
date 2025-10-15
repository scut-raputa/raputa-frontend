export type TempFileUploadVO = {
  tempId: string
}

export type CsvMappingRequest = {
  sampleRate: number
  imuAxisMap?: { X?: string; Y?: string; Z?: string }
  gasCol?: string
  audioCol?: string
}
