import { getDeviceUrl } from './config'

export const PROXY_PREFIX = import.meta.env.VITE_PROXY_PREFIX || '/api-proxy'

export function shouldUseProxy(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_USE_PROXY === 'true'
}

export function getApiUrl(endpoint: string): string {
  if (shouldUseProxy()) {
    return `${PROXY_PREFIX}${endpoint}`
  }

  const deviceUrl = getDeviceUrl()
  return `${deviceUrl}${endpoint}`
}

export function getProxyTarget(): string {
  return import.meta.env.VITE_PROXY_TARGET || 'http://192.168.1.27:8080'
}

export function isCorsError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return error.message.includes('CORS') || error.message.includes('Failed to fetch')
  }
  return false
}
