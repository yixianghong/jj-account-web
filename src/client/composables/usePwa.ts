export const usePwa = () => {
  const { $pwa } = useNuxtApp()
  
  const isInstalled = ref(false)
  const isOnline = ref(true)
  const isUpdateAvailable = ref(false)

  // 檢查是否已安裝
  const checkInstallation = () => {
    if (import.meta.client) {
      isInstalled.value = window.matchMedia('(display-mode: standalone)').matches
    }
  }

  // 檢查網路狀態
  const checkOnlineStatus = () => {
    if (import.meta.client) {
      isOnline.value = navigator.onLine
    }
  }

  // 安裝 PWA
  const install = async () => {
    if ($pwa && $pwa.install) {
      try {
        await $pwa.install()
        isInstalled.value = true
        return true
      } catch (error) {
        console.error('PWA 安裝失敗:', error)
        return false
      }
    }
    return false
  }

  // 更新 PWA
  const update = () => {
    if ($pwa && $pwa.getSWRegistration) {
      const registration = $pwa.getSWRegistration()
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        isUpdateAvailable.value = false
      }
    }
  }

  // 重新載入應用程式
  const reload = () => {
    if (import.meta.client) {
      window.location.reload()
    }
  }

  // 監聽 PWA 事件
  onMounted(() => {
    checkInstallation()
    checkOnlineStatus()

    // 監聽網路狀態變化
    if (import.meta.client) {
      window.addEventListener('online', checkOnlineStatus)
      window.addEventListener('offline', checkOnlineStatus)
    }

    // 監聽 PWA 更新
    if ($pwa && $pwa.getSWRegistration) {
      const registration = $pwa.getSWRegistration()
      if (registration) {
        registration.addEventListener('updatefound', () => {
          isUpdateAvailable.value = true
        })
      }
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('online', checkOnlineStatus)
      window.removeEventListener('offline', checkOnlineStatus)
    }
  })

  return {
    isInstalled: readonly(isInstalled),
    isOnline: readonly(isOnline),
    isUpdateAvailable: readonly(isUpdateAvailable),
    install,
    update,
    reload,
    checkInstallation,
  }
} 