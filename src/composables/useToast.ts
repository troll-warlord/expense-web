import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
  duration: number
}

const toasts = ref<ToastItem[]>([])
let counter = 0

function show(message: string, type: ToastType = 'info', duration = 4000) {
  const id = ++counter
  toasts.value.push({ id, type, message, duration })
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }
}

function dismiss(id: number) {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

export function useToast() {
  return {
    toasts,
    success: (msg: string, duration?: number) => show(msg, 'success', duration),
    error: (msg: string, duration?: number) => show(msg, 'error', duration),
    info: (msg: string, duration?: number) => show(msg, 'info', duration),
    warning: (msg: string, duration?: number) => show(msg, 'warning', duration),
    dismiss,
  }
}
