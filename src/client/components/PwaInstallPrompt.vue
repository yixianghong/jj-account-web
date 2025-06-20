<template>
  <div v-if="showInstallPrompt" class="fixed bottom-4 left-4 right-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:device-phone-mobile" class="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">
              安裝記帳夥伴
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              安裝到主畫面，離線也能使用
            </p>
          </div>
        </div>
        <div class="flex space-x-2">
          <button
            @click="installPwa"
            class="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors"
          >
            安裝
          </button>
          <button
            @click="dismissPrompt"
            class="px-3 py-1.5 text-gray-500 text-xs font-medium hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            稍後
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $pwa } = useNuxtApp()

const showInstallPrompt = ref(false)
const deferredPrompt = ref<any>(null)

// 監聽 beforeinstallprompt 事件
onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    showInstallPrompt.value = true
  })

  // 檢查是否已經安裝
  if (window.matchMedia('(display-mode: standalone)').matches) {
    showInstallPrompt.value = false
  }
})

// 安裝 PWA
const installPwa = async () => {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      console.log('PWA 安裝成功')
    }
    deferredPrompt.value = null
    showInstallPrompt.value = false
  }
}

// 關閉提示
const dismissPrompt = () => {
  showInstallPrompt.value = false
  deferredPrompt.value = null
}
</script> 