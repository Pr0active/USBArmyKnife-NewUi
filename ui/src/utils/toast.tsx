import { useState, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastListener: ((toast: Toast) => void) | null = null

export function showToast(message: string, type: ToastType = 'success') {
  const toast: Toast = {
    id: Date.now().toString(),
    message,
    type,
  }
  if (toastListener) {
    toastListener(toast)
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastListener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 3000)
    }
    return () => {
      toastListener = null
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white min-w-64 animate-slide-in ${
            toast.type === 'success'
              ? 'bg-green-600'
              : toast.type === 'error'
              ? 'bg-red-600'
              : 'bg-blue-600'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
