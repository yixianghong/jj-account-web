<template>
    <div>
        <div v-if="accountBooks.length === 0" class="col-span-full text-center py-8">
            <h2 class="text-2xl font-bold mb-4">歡迎使用記帳本</h2>
            <p class="text-gray-600 mb-4">請先建立一個記帳本來開始記帳</p>
            <UButton
            color="primary"
            size="lg"
            @click="router.push('/accounts')"
            >
            建立第一個記帳本
            </UButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from "vue";

const router = useRouter();
const { accountBooks, loadAccountBooks } = useAccountBooks();

// 初始化載入記帳本並判斷導向
onMounted(async () => {
  try {
    await loadAccountBooks();
    console.log('載入後的記帳本：', accountBooks.value);
    
    // 等待下一個 tick，確保 accountBooks 已經更新
    await nextTick();
    // 如果有記帳本，導向 /accounts
    if (accountBooks.value.length > 0) {
      router.push('/accounts');
    }
  } catch (error) {
    console.error('載入記帳本失敗：', error);
  }
});
</script>