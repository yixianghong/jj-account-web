<template>
  <div>
    <UContainer>
        <UNavigationMenu :items="items" class="w-full justify-center" />
        <slot />
    </UContainer>
  </div>
</template>
<script setup lang="ts">
const items = [
  {
    label: '記帳列表',
    to: '/accounts',
  },
  {
    label: '設定',
    to: '#',
  },
];
</script>