<template>
  <UApp :toaster="{ position: 'top-right', duration: 5000 }">
    <div class="min-h-screen bg-gray-50">
      <NuxtLayout>
        <NuxtPage
:transition="{
          name: 'fade',
          mode: 'out-in',
        }" />
      </NuxtLayout>
      <!-- PWA 安裝提示 -->
      <PwaInstallPrompt />
      <!-- PWA 更新提示 -->
      <PwaUpdatePrompt />
      <VitePwaManifest />
    </div>
  </UApp>
</template>

<script setup lang="ts">
import '~/assets/css/main.css';
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style> 