const DEVICE_URL_KEY = 'usbarmyknife_device_url'
const DEFAULT_DEVICE_URL = 'http://4.3.2.1:8080'

export function getDeviceUrl(): string {
  const stored = localStorage.getItem(DEVICE_URL_KEY)
  if (stored) return stored

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port, origin } = window.location
    const isDeviceOrigin =
      protocol === 'http:' && (port === '8080' || hostname === '4.3.2.1')
    if (isDeviceOrigin) {
      return origin
    }
  }

  return DEFAULT_DEVICE_URL
}

export function setDeviceUrl(url: string): void {
  localStorage.setItem(DEVICE_URL_KEY, url)
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
