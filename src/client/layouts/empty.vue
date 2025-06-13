<template>
  <div class="min-h-screen bg-gray-50">
    <slot />
  </div>
</template>

<script setup lang="ts">
// 設定空白 layout
definePageMeta({
  layout: 'empty'
});
</script> 