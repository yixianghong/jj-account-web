<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">記帳本列表</h1>
      <UButton label="新增記帳本" color="neutral" variant="subtle" @click="showNewBookForm = true" />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="book in accountBooks"
        :key="book.id"
        class="cursor-pointer hover:shadow-lg transition-shadow"
        @click="router.push(`/account/${book.id}`)"
      >
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-semibold">{{ book.name }}</h3>
          <UButton
            color="error"
            variant="ghost"
            icon="i-heroicons-trash"
            size="xs"
            @click.stop="handleDeleteBook(book.id)"
          />
        </div>
        <div class="mt-2 text-sm text-gray-600">
          建立時間：{{ new Date(book.createdAt).toLocaleDateString() }}
        </div>
      </UCard>
    </div>
    <UModal v-model:open="showNewBookForm" title="新增記帳本">
      <template #body>
        <UInput
          v-model="newBookName"
          type="text"
          placeholder="記帳本名稱"
          class="mb-4"
        />
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="showNewBookForm = false" >
          取消
        </UButton>
        <UButton color="primary" @click="handleCreateBook" >
          建立
        </UButton>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const router = useRouter();
const { accountBooks, loadAccountBooks, createBook, deleteBook } = useAccountBooks();
const showNewBookForm = ref(false);
const newBookName = ref("");

const handleCreateBook = async () => {
  if (!newBookName.value.trim()) return;

  try {
    await createBook(newBookName.value);
    showNewBookForm.value = false;
    newBookName.value = "";
  } catch (error) {
    console.error('建立記帳本失敗：', error);
  }
};

const handleDeleteBook = async (bookId: string) => {
  if (confirm('確定要刪除這個記帳本嗎？')) {
    try {
      await deleteBook(bookId);
    } catch (error) {
      console.error('刪除記帳本失敗：', error);
    }
  }
};

// 初始化載入記帳本
onMounted(async () => {
  await loadAccountBooks();
});
</script>
