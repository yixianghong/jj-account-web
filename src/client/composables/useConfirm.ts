import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  // 確認按鈕顏色，破壞性操作可用 'error'
  color?: 'primary' | 'error' | 'warning' | 'neutral'
}

// 模組層級共享狀態（單例）：由 AppConfirmModal 呈現、任何元件呼叫 confirm() 取用
const isOpen = ref(false)
const options = ref<ConfirmOptions>({ message: '' })
let resolver: ((value: boolean) => void) | null = null

export const useConfirm = () => {
  // 顯示確認彈窗，回傳 Promise<boolean>（確定 = true，取消／關閉 = false）
  const confirm = (opts: ConfirmOptions | string): Promise<boolean> => {
    options.value = typeof opts === 'string' ? { message: opts } : opts
    isOpen.value = true
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  // 回應結果並關閉；resolver 只會被呼叫一次（後續呼叫為 no-op）
  const respond = (value: boolean) => {
    isOpen.value = false
    if (resolver) {
      resolver(value)
      resolver = null
    }
  }

  return { isOpen, options, confirm, respond }
}
