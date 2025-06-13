<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">我的記帳本</h1>

    <!-- 新增記帳本表單 -->
    <div class="mb-8">
      <form class="flex gap-4" @submit.prevent="handleCreateBook">
        <input
          v-model="newBookName"
          type="text"
          placeholder="輸入記帳本名稱"
          class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
        <button
          type="submit"
          class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          新增記帳本
        </button>
      </form>
    </div>

    <!-- 記帳本列表 -->
    <div v-if="accountBooks.length > 0" class="grid gap-6">
      <div v-for="book in accountBooks" :key="book.id" class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-xl font-semibold">{{ book.name }}</h2>
            <p class="text-gray-500 text-sm">
              {{ new Date(book.createdAt).toLocaleDateString() }}
            </p>
          </div>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 text-blue-500 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="openShareDialog(book)"
            >
              共享
            </button>
            <button
              class="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              @click="handleDeleteBook(book.id)"
            >
              刪除
            </button>
          </div>
        </div>

        <!-- 共享使用者列表 -->
        <div v-if="book.sharedUsers && book.sharedUsers.length > 0" class="mt-4">
          <h3 class="text-sm font-medium text-gray-700 mb-2">共享使用者：</h3>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="email in book.sharedUsers"
              :key="email"
              class="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
            >
              <span>{{ email }}</span>
              <button
                class="text-gray-500 hover:text-red-500"
                @click="handleRemoveSharedUser(book.id, email)"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <NuxtLink
            :to="`/account/${book.id}`"
            class="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            查看記帳本
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 無記帳本提示 -->
    <div v-else class="text-center py-12">
      <p class="text-gray-500">還沒有記帳本，請新增一個記帳本開始使用。</p>
    </div>

    <!-- 共享對話框 -->
    <div v-if="showShareDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-xl font-semibold mb-4">共享記帳本</h3>
        <form class="space-y-4" @submit.prevent="handleAddSharedUser">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              使用者 Email
            </label>
            <input
              v-model="newSharedUserEmail"
              type="email"
              placeholder="輸入使用者 Email"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
          </div>
          <div class="flex justify-end gap-4">
            <button
              type="button"
              class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              @click="closeShareDialog"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              新增
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AccountBook } from '~/types/accounting';

const { accountBooks, loadAccountBooks, createBook, deleteBook, addSharedUser, removeSharedUser } = useAccountBooks();
const { user } = useAuth();

const newBookName = ref('');
const showShareDialog = ref(false);
const newSharedUserEmail = ref('');
const selectedBook = ref<AccountBook | null>(null);

// 監聽使用者狀態，載入記帳本
watch(user, (newUser) => {
  if (newUser) {
    loadAccountBooks();
  }
}, { immediate: true });

// 新增記帳本
const handleCreateBook = async () => {
  try {
    await createBook(newBookName.value);
    newBookName.value = '';
  } catch (error) {
    console.error('新增記帳本失敗：', error);
    alert('新增記帳本失敗');
  }
};

// 刪除記帳本
const handleDeleteBook = async (bookId: string) => {
  if (!confirm('確定要刪除此記帳本嗎？')) {
    return;
  }

  try {
    await deleteBook(bookId);
  } catch (error) {
    console.error('刪除記帳本失敗：', error);
    alert('刪除記帳本失敗');
  }
};

// 開啟共享對話框
const openShareDialog = (book: AccountBook) => {
  selectedBook.value = book;
  showShareDialog.value = true;
};

// 關閉共享對話框
const closeShareDialog = () => {
  selectedBook.value = null;
  newSharedUserEmail.value = '';
  showShareDialog.value = false;
};

// 新增共享使用者
const handleAddSharedUser = async () => {
  if (!selectedBook.value) return;

  try {
    await addSharedUser(selectedBook.value.id, newSharedUserEmail.value);
    newSharedUserEmail.value = '';
    closeShareDialog();
  } catch (error) {
    console.error('新增共享使用者失敗：', error);
    alert(error instanceof Error ? error.message : '新增共享使用者失敗');
  }
};

// 移除共享使用者
const handleRemoveSharedUser = async (bookId: string, email: string) => {
  if (!confirm(`確定要移除 ${email} 的存取權限嗎？`)) {
    return;
  }

  try {
    await removeSharedUser(bookId, email);
  } catch (error) {
    console.error('移除共享使用者失敗：', error);
    alert('移除共享使用者失敗');
  }
};
</script>
