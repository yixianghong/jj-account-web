<template>
  <div v-if="showUpdatePrompt" class="fixed top-4 left-4 right-4 z-50">
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Icon name="heroicons:arrow-path" class="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-blue-900 dark:text-blue-100">
              有新版本可用
            </h3>
            <p class="text-xs text-blue-700 dark:text-blue-300">
              點擊更新以獲取最新功能
            </p>
          </div>
        </div>
        <div class="flex space-x-2">
          <button
            @click="updatePwa"
            class="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors"
          >
            更新
          </button>
          <button
            @click="dismissUpdate"
            class="px-3 py-1.5 text-blue-600 text-xs font-medium hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
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

const showUpdatePrompt = ref(false)

onMounted(() => {
  if ($pwa && $pwa.getSWRegistration) {
    const registration = $pwa.getSWRegistration()
    if (registration) {
      registration.addEventListener('updatefound', () => {
        showUpdatePrompt.value = true
      })
    }
  }
})

const updatePwa = () => {
  if ($pwa && $pwa.getSWRegistration) {
    const registration = $pwa.getSWRegistration()
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      showUpdatePrompt.value = false
    }
  }
}

const dismissUpdate = () => {
  showUpdatePrompt.value = false
}
</script> 