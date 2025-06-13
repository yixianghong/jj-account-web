<template>
  <div>
    <UContainer>
        <UNavigationMenu :items="items" class="w-full justify-center" />
    </UContainer>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { $firebase } = useNuxtApp();

const items = [
  {
    label: '記帳本',
    to: '/accounts',
  },
];

// 測試 Firebase 連線
onMounted(async () => {
  const isConnected = await $firebase.testConnection();
  if (!isConnected) {
    console.error('Firebase 連線失敗，請檢查設定值');
  }
});
</script> 