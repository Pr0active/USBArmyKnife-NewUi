import { getApiUrl, isCorsError } from '../utils/proxy'

export interface DeviceData {
  sdCardPercentFull: number
  uptime: string
  status: string
  errorCount: number
  USBmode: string
  freeHeap: number
  heapSize: number
  agentConnected: boolean
  machineName: string
  version: string
  heapUsagePc: number
  numCores: number
  chipModel: string
  fileListing: string[]
  logMessages: string[]
  settingCategories: any[]
  capabilities: string[]
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = getApiUrl(endpoint)

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return response.json()
      }
      if (contentType?.includes('application/octet-stream') || contentType?.includes('image/')) {
        return response.blob() as unknown as T
      }

      return undefined as T
    } catch (error) {
      if (isCorsError(error)) {
        console.warn('CORS error detected. Enable proxy in .env with VITE_USE_PROXY=true to avoid this.')
      }
      throw error
    }
  }

  async getDeviceData(): Promise<DeviceData> {
    return this.request<DeviceData>('/data.json')
  }

  async downloadFile(filename: string): Promise<Blob> {
    return this.request<Blob>(`/download?filename=${encodeURIComponent(filename)}`)
  }

  async uploadFile(file: File, targetFilename?: string): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    if (targetFilename) {
      formData.append('filename', targetFilename)
    }
    await this.request<void>('/uploadFile', {
      method: 'POST',
      body: formData,
    })
  }

  async deleteFile(filename: string): Promise<void> {
    await this.request<void>(`/delete?filename=${encodeURIComponent(filename)}`)
  }

  async runFile(filename: string): Promise<void> {
    await this.request<void>(`/runfile?filename=${encodeURIComponent(filename)}`)
  }

  async runRawCommand(command: string): Promise<void> {
    await this.request<void>(`/rawinput?rawCommand=${encodeURIComponent(command)}`)
  }

  async runAgentCommand(command: string): Promise<void> {
    await this.request<void>(`/runagentcmd?rawCommand=${encodeURIComponent(command)}`)
  }

  async showImage(filename: string): Promise<void> {
    await this.request<void>(`/showimage?filename=${encodeURIComponent(filename)}`)
  }

  async runMarauder(command: string): Promise<void> {
    await this.request<void>(`/marauder?marauderCmd=${encodeURIComponent(command)}`)
  }

  async setMic(enabled: boolean): Promise<void> {
    await this.request<void>(`/mic?enabled=${enabled}`)
  }

  async setSetting(name: string, value?: string): Promise<void> {
    const params = new URLSearchParams({ name })
    if (value !== undefined) {
      params.append('value', value)
    }
    await this.request<void>(`/set?${params.toString()}`)
  }

  async clearLogs(): Promise<void> {
    await this.request<void>('/clearlogs')
  }
}

export const api = new ApiService()
