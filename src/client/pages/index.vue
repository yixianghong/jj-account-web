<template>
  <div class="min-h-screen flex items-center justify-center">
    <div v-if="accountBooks.length === 0" class="text-center py-8">
      <div class="mb-8">
        <UIcon name="i-heroicons-book-open" class="w-24 h-24 text-primary-500 mx-auto" />
      </div>
      <h2 class="text-2xl font-bold mb-4">歡迎使用記帳本</h2>
      <p class="text-gray-600 mb-4">請先建立一個記帳本來開始記帳</p>
      <UButton
        color="primary"
        size="lg"
        @click="showNewBookForm = true"
      >
        建立第一個記帳本
      </UButton>
    </div>

    <!-- 新增記帳本表單 -->
    <UModal
      v-model:open="showNewBookForm"
    >
      <template #header>
        <h3 class="text-lg font-medium leading-6 text-gray-900">
          建立記帳本
        </h3>
      </template>
      <template #body>
        <UInput
          v-model="bookForm.name"
          type="text"
          placeholder="記帳本名稱"
          class="mb-4"
        />
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            @click="showNewBookForm = false"
          >
            取消
          </UButton>
          <UButton
            color="primary"
            :loading="isSubmitting"
            @click="handleSubmit"
          >
            建立
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick, ref } from "vue";

definePageMeta({
  layout: 'empty'
});

const router = useRouter();
const { accountBooks, loadAccountBooks, createBook } = useAccountBooks();
const showNewBookForm = ref(false);
const isSubmitting = ref(false);
const bookForm = ref({
  name: "",
});

// 處理表單提交
const handleSubmit = async () => {
  if (!bookForm.value.name.trim()) {
    alert('請輸入記帳本名稱');
    return;
  }

  try {
    isSubmitting.value = true;
    const newBook = await createBook(bookForm.value.name);
    
    // 重新載入記帳本列表
    await loadAccountBooks();
    
    // 重置表單
    showNewBookForm.value = false;
    bookForm.value.name = "";
    
    // 導向到新建立的記帳本
    router.push(`/account/${newBook.id}`);
  } catch (error) {
    console.error('建立記帳本失敗：', error);
    alert('建立記帳本失敗，請稍後再試');
  } finally {
    isSubmitting.value = false;
  }
};

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