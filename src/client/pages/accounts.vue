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

      <!-- 記帳本列表（Splitwise 風格） -->
      <div v-if="accountBooks.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="book in accountBooks"
          :key="book.id"
          class="relative group cursor-pointer hover:shadow-2xl transition-all duration-200 border-l-8 p-0"
          :style="{ borderColor: getBookColor(book.id) }"
          @click="router.push(`/account/${book.id}`)"
        >
          <!-- 操作按鈕區 -->
          <div class="absolute top-3 right-3 z-10">
            <UDropdownMenu
              :items="getBookActions(book)"
              :popper="{ placement: 'bottom-end' }"
              class="!p-0"
            >
              <UButton icon="i-heroicons-ellipsis-vertical" size="sm" color="gray" variant="ghost" @click.stop />
            </UDropdownMenu>
          </div>
          <!-- 主要內容 -->
          <div class="flex items-center gap-4 px-6 py-5">
            <!-- 帳本顏色圓圈 -->
            <div class="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow" :style="{ background: getBookColor(book.id) }">
              {{ book.name[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-lg font-bold truncate">{{ book.name }}</h2>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                建立於：{{ new Date(book.createdAt).toLocaleDateString() }}
              </div>
              <!-- 成員頭像 -->
              <div v-if="book.sharedUsers?.length" class="flex mt-2">
                <div v-for="email in ([user?.email, ...book.sharedUsers].filter(e => !!e) as string[])" :key="email" class="w-7 h-7 rounded-full bg-gray-200 border-2 border-white -ml-2 flex items-center justify-center text-xs font-bold text-gray-700 shadow">
                  {{ getAvatarText(email) }}
                </div>
              </div>
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

            <!-- 目前共享對象列表 -->
            <div v-if="sharedUsersOfSelected.length" class="mt-6 space-y-2">
              <p class="text-sm font-medium text-gray-700">目前共享對象</p>
              <div
                v-for="email in sharedUsersOfSelected"
                :key="email"
                class="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
              >
                <span class="text-sm text-gray-700 truncate">{{ email }}</span>
                <UButton
                  icon="i-heroicons-x-mark"
                  color="error"
                  variant="ghost"
                  size="xs"
                  aria-label="移除共享使用者"
                  @click="handleRemoveSharedUser(email)"
                />
              </div>
            </div>
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

      <!-- 編輯對話框 -->
      <UModal v-model:open="showEditDialog">
        <template #header>
          <h3 class="text-xl font-semibold">編輯記帳本</h3>
        </template>
        <template #body>
          <form class="space-y-4" @submit.prevent="handleEditBook">
            <UFormField label="記帳本名稱">
              <UInput
                v-model="editBookName"
                placeholder="輸入記帳本名稱"
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
              @click="closeEditDialog"
            >
              取消
            </UButton>
            <UButton
              type="submit"
              color="primary"
              variant="solid"
              @click="handleEditBook"
            >
              儲存
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
const { accountBooks, loadAccountBooks, createBook, deleteBook, addSharedUser, removeSharedUser, updateBook } = useAccountBooks();
const { user } = useAuth();
const { handleError } = useErrorHandler();
const { confirm } = useConfirm();

const newBookName = ref('');
const showShareDialog = ref(false);
const newSharedUserEmail = ref('');
const selectedBook = ref<AccountBook | null>(null);
const showEditDialog = ref(false);
const editBookName = ref('');
const editingBook = ref<AccountBook | null>(null);

// 共享對話框中目前的共享對象（從 accountBooks 即時取得，移除後會自動更新）
const sharedUsersOfSelected = computed(() => {
  if (!selectedBook.value) return [];
  const book = accountBooks.value.find(b => b.id === selectedBook.value!.id);
  return book?.sharedUsers ?? [];
});

// Splitwise 風格：帳本顏色（根據 id hash 產生顏色）
function getBookColor(id: string) {
  const colors = ['#4F8A8B', '#F9ED69', '#F08A5D', '#B83B5E', '#6A2C70', '#3B6978'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
// 取 email 首字母大寫
function getAvatarText(email: string) {
  return email ? email[0].toUpperCase() : '?';
}

// 監聽使用者狀態，載入記帳本
watch(user, (newUser) => {
  if (newUser) {
    loadAccountBooks().catch(handleError);
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
    handleError(error, '無法建立記帳本，請稍後再試');
  }
};

// 刪除記帳本
const handleDeleteBook = async (bookId: string) => {
  const ok = await confirm({
    title: '刪除記帳本',
    message: '確定要刪除此記帳本嗎？此操作無法復原。',
    confirmText: '刪除',
    color: 'error',
  });
  if (!ok) return;

  try {
    await deleteBook(bookId);
    useToast().add({
      title: '刪除成功',
      description: '記帳本已刪除',
      color: 'success'
    });
  } catch (error) {
    handleError(error, '無法刪除記帳本，請稍後再試');
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
    handleError('不能將自己加入為共享使用者');
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
    handleError(error);
  }
};

// 移除共享使用者（可逆、低風險操作，於共享對話框內直接移除，避免巢狀 Modal）
const handleRemoveSharedUser = async (email: string) => {
  if (!selectedBook.value) return;

  try {
    await removeSharedUser(selectedBook.value.id, email);
    useToast().add({
      title: '移除成功',
      description: `已移除 ${email} 的存取權限`,
      color: 'success'
    });
  } catch (error) {
    handleError(error, '無法移除共享使用者，請稍後再試');
  }
};

// 開啟編輯對話框
const openEditDialog = (book: AccountBook) => {
  editingBook.value = book;
  editBookName.value = book.name;
  showEditDialog.value = true;
};

// 關閉編輯對話框
const closeEditDialog = () => {
  editingBook.value = null;
  editBookName.value = '';
  showEditDialog.value = false;
};

// 編輯記帳本
const handleEditBook = async () => {
  if (!editingBook.value) return;

  try {
    await updateBook(editingBook.value.id, { name: editBookName.value });
    closeEditDialog();
    useToast().add({
      title: '更新成功',
      description: '記帳本名稱已更新',
      color: 'success'
    });
  } catch (error) {
    handleError(error, '無法更新記帳本，請稍後再試');
  }
};

// Splitwise 風格：帳本操作選單
function getBookActions(book: AccountBook) {
  console.log(book);
  return [
    [
      {
        label: '編輯',
        icon: 'i-heroicons-pencil-square',
        onSelect: () => openEditDialog(book)
      },
      {
        label: '共享',
        icon: 'i-heroicons-share',
        onSelect: () => openShareDialog(book)
      },
      {
        label: '刪除',
        icon: 'i-heroicons-trash',
        class: 'text-red-500',
        onSelect: () => handleDeleteBook(book.id)
      }
    ]
  ];
}
</script>
