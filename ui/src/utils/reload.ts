import { shouldUseProxy } from './proxy'

export function shouldReloadAfterAction(): boolean {
  return !shouldUseProxy()
}

export function reloadIfNeeded(): boolean {
  if (shouldReloadAfterAction()) {
    window.location.reload()
    return true
  }
  return false
}

export function isSameOrigin(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const deviceUrl = new URL(import.meta.env.VITE_PROXY_TARGET || 'http://192.168.1.27:8080')
    const currentUrl = new URL(window.location.href)
    return deviceUrl.origin === currentUrl.origin
  } catch {
    return false
  }
}
