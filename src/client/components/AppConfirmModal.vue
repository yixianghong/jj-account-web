<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-xl font-semibold">{{ options.title || '確認' }}</h3>
    </template>
    <template #body>
      <p class="whitespace-pre-line text-gray-700 dark:text-gray-300">{{ options.message }}</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-4">
        <UButton color="neutral" variant="ghost" @click="respond(false)">
          {{ options.cancelText || '取消' }}
        </UButton>
        <UButton
          :color="options.color || 'primary'"
          variant="solid"
          @click="respond(true)"
        >
          {{ options.confirmText || '確定' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { isOpen, options, respond } = useConfirm()

// 透過背景點擊或 ESC 關閉時，isOpen 會被設為 false，視同取消，避免 Promise 永遠未解析
watch(isOpen, (open) => {
  if (!open) respond(false)
})
</script>
