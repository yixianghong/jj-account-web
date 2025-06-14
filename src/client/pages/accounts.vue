<template>
  <div class="container mx-auto px-4 py-8">
    <UContainer>
      <h1 class="text-2xl font-bold mb-6">我的記帳本</h1>

      <!-- 新增記帳本表單 -->
      <div class="mb-8">
        <form class="flex gap-4" @submit.prevent="handleCreateBook">
          <UInput
            v-model="newBookName"
            placeholder="輸入記帳本名稱"
            class="flex-1"
            required
          />
          <UButton
            type="submit"
            color="primary"
            icon="i-heroicons-plus"
            size="lg"
            class="rounded-full min-w-[32px] cursor-pointer flex items-center justify-center"
          />
        </form>
      </div>

      <!-- 記帳本列表 -->
      <div v-if="accountBooks.length > 0" class="grid gap-6">
        <UCard v-for="book in accountBooks" :key="book.id" class="cursor-pointer hover:shadow-lg transition-shadow duration-300" @click="router.push(`/account/${book.id}`)">
          <template #header>
            <div class="flex justify-between items-start">
              <div class="flex items-center">
                <h2 class="text-xl font-semibold">{{ book.name }}</h2>
                <UBadge color="primary" variant="soft" class="ml-2">{{ book.transactions?.length || 0 }} 筆</UBadge>
              </div>
              <div class="flex gap-2">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-share"
                  @click.stop="openShareDialog(book)"
                >
                  共享
                </UButton>
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  @click.stop="handleDeleteBook(book.id)"
                >
                  刪除
                </UButton>
              </div>
            </div>
          </template>
          <div class="text-gray-500 text-sm space-y-1">
            <p>建立於：{{ new Date(book.createdAt).toLocaleDateString() }}</p>
            <p v-if="book.updatedAt">
              最後更新：{{ new Date(book.updatedAt).toLocaleDateString() }}
              <span v-if="book.lastUpdatedBy">（{{ book.lastUpdatedBy }}）</span>
            </p>
          </div>
          <!-- 共享使用者列表 -->
          <div v-if="book.sharedUsers && book.sharedUsers.length > 0" class="mt-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">共享使用者：</h3>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="email in book.sharedUsers"
                :key="email"
                color="neutral"
                variant="soft"
                class="flex items-center gap-2"
              >
                {{ email }}
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  size="xs"
                  class="p-0"
                  @click.stop="handleRemoveSharedUser(book.id, email)"
                />
              </UBadge>
            </div>
          </div>
        </UCard>
      </div>

      <!-- 無記帳本提示 -->
      <UCard v-else class="text-center py-12">
        <p class="text-gray-500">還沒有記帳本，請新增一個記帳本開始使用。</p>
      </UCard>

      <!-- 共享對話框 -->
      <UModal v-model:open="showShareDialog">
          <template #header>
            <h3 class="text-xl font-semibold">共享記帳本</h3>
          </template>
          <template #body>
            <form class="space-y-4" @submit.prevent="handleAddSharedUser">
              <UFormField label="使用者 Email" hint="不能將自己加入為共享使用" >
                <UInput
                  v-model="newSharedUserEmail"
                  type="email"
                  placeholder="輸入使用者 Email"
                  required
                  class="w-full"
                  
                />
              </UFormField>
            </form>
          </template>
            <template #footer>
              <div class="flex justify-end gap-4">
                <UButton
                  color="neutral"
                  variant="ghost"
                  @click="closeShareDialog"
                >
                  取消
                </UButton>
                <UButton
                  type="submit"
                  color="primary"
                  variant="solid"
                  :disabled="newSharedUserEmail === user?.email"
                  @click="handleAddSharedUser"
                >
                  新增
                </UButton>
              </div>
            </template>
      </UModal>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import type { AccountBook } from '~/types/accounting';
const router = useRouter();
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
    useToast().add({
      title: '新增成功',
      description: '記帳本已建立',
      color: 'success'
    });
  } catch (error) {
    console.error('新增記帳本失敗：', error);
    useToast().add({
      title: '新增失敗',
      description: '無法建立記帳本，請稍後再試',
      color: 'error'
    });
  }
};

// 刪除記帳本
const handleDeleteBook = async (bookId: string) => {
  if (!confirm('確定要刪除此記帳本嗎？此操作無法復原。')) {
    return;
  }

  try {
    await deleteBook(bookId);
    useToast().add({
      title: '刪除成功',
      description: '記帳本已刪除',
      color: 'success'
    });
  } catch (error) {
    console.error('刪除記帳本失敗：', error);
    useToast().add({
      title: '刪除失敗',
      description: '無法刪除記帳本，請稍後再試',
      color: 'error'
    });
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

  // 檢查是否為自己的 email
  if (newSharedUserEmail.value === user.value?.email) {
    useToast().add({
      title: '新增失敗',
      description: '不能將自己加入為共享使用者',
      color: 'error'
    });
    return;
  }

  try {
    await addSharedUser(selectedBook.value.id, newSharedUserEmail.value);
    newSharedUserEmail.value = '';
    closeShareDialog();
    useToast().add({
      title: '新增成功',
      description: '已新增共享使用者',
      color: 'success'
    });
  } catch (error) {
    console.error('新增共享使用者失敗：', error);
    useToast().add({
      title: '新增失敗',
      description: error instanceof Error ? error.message : '無法新增共享使用者，請稍後再試',
      color: 'error'
    });
  }
};

// 移除共享使用者
const handleRemoveSharedUser = async (bookId: string, email: string) => {
  if (!confirm(`確定要移除 ${email} 的存取權限嗎？`)) {
    return;
  }

  try {
    await removeSharedUser(bookId, email);
    useToast().add({
      title: '移除成功',
      description: '已移除共享使用者',
      color: 'success'
    });
  } catch (error) {
    console.error('移除共享使用者失敗：', error);
    useToast().add({
      title: '移除失敗',
      description: '無法移除共享使用者，請稍後再試',
      color: 'error'
    });
  }
};
</script>
