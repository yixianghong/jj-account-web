<template>
  <div>
    <UContainer>
        <UNavigationMenu :items="items" class="w-full justify-center" />
    </UContainer>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
// 這裡不需要任何邏輯，但需要 script 標籤
const items = [
  {
    label: '記帳本',
    to: '/',
  },
  {
    label: '記帳本管理',
    to: '/account-books',
  },
];
</script> 