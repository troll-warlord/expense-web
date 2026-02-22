import { ref } from 'vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

const visible = ref(false)
const options = ref<ConfirmOptions>({ message: '' })
let _resolve: ((v: boolean) => void) | null = null

function confirm(opts: ConfirmOptions): Promise<boolean> {
  options.value = opts
  visible.value = true
  return new Promise((resolve) => {
    _resolve = resolve
  })
}

function accept() {
  visible.value = false
  _resolve?.(true)
  _resolve = null
}

function cancel() {
  visible.value = false
  _resolve?.(false)
  _resolve = null
}

export function useConfirm() {
  return {
    visible,
    options,
    confirm,
    accept,
    cancel,
  }
}
