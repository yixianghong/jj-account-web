<template>
  <div class="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 pb-28">
    <!-- 標題列 -->
    <div class="flex items-end justify-between mb-6">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">我的記帳本</h1>
        <p class="text-sm text-gray-400 mt-0.5">{{ activeCount }} 本進行中 · 共 {{ accountBooks.length }} 本</p>
      </div>
      <UButton
        color="primary"
        icon="i-heroicons-plus"
        class="rounded-full hidden sm:flex"
        @click="openCreateDialog"
      >新增</UButton>
    </div>

    <!-- 記帳本列表 -->
    <div v-if="accountBooks.length > 0" class="grid gap-3 sm:gap-4 sm:grid-cols-2">
      <div
        v-for="book in accountBooks"
        :key="book.id"
        class="relative group cursor-pointer rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        :class="book.closed && 'opacity-60'"
        @click="router.push(`/account/${book.id}`)"
      >
        <!-- 操作選單 -->
        <div class="absolute top-3 right-3 z-10">
          <UDropdownMenu :items="getBookActions(book)" :popper="{ placement: 'bottom-end' }" class="!p-0">
            <UButton
              icon="i-heroicons-ellipsis-vertical"
              size="sm"
              color="neutral"
              variant="ghost"
              class="rounded-full opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              aria-label="記帳本操作"
              @click.stop
            />
          </UDropdownMenu>
        </div>

        <div class="flex items-center gap-3">
          <!-- 帳本色塊 -->
          <div
            class="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm"
            :style="{ background: getBookColor(book.id) }"
          >{{ book.name[0] }}</div>

          <div class="flex-1 min-w-0 pr-6">
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold truncate">{{ book.name }}</h2>
              <UBadge v-if="book.closed" color="neutral" variant="subtle" size="xs">已關閉</UBadge>
            </div>
            <div class="flex items-center gap-2 mt-0.5">
              <UBadge
                :color="book.userId === user?.uid ? 'primary' : 'neutral'"
                variant="subtle"
                size="xs"
              >{{ book.userId === user?.uid ? '擁有者' : '共享' }}</UBadge>
              <span class="text-xs text-gray-400">{{ new Date(book.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>

        <!-- 成員頭像 -->
        <div v-if="book.sharedUsers?.length" class="flex items-center mt-3 pl-1">
          <div
            v-for="email in ([user?.email, ...book.sharedUsers].filter(e => !!e) as string[])"
            :key="email"
            class="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 -ml-2 first:ml-0 flex items-center justify-center text-xs font-bold text-gray-600"
            :title="email"
          >{{ getAvatarText(email) }}</div>
          <span class="text-xs text-gray-400 ml-2">{{ book.sharedUsers.length + 1 }} 位成員</span>
        </div>
      </div>
    </div>

    <!-- 空狀態 -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-20 h-20 rounded-3xl bg-primary-50 text-primary-500 dark:bg-primary-500/15 dark:text-primary-400 flex items-center justify-center mb-4">
        <UIcon name="i-lucide-notebook-tabs" class="w-10 h-10" />
      </div>
      <h2 class="text-lg font-bold">還沒有記帳本</h2>
      <p class="text-sm text-gray-400 mt-1 mb-5">建立第一本記帳本,開始和夥伴一起記帳</p>
      <UButton color="primary" icon="i-heroicons-plus" size="lg" class="rounded-full" @click="openCreateDialog">
        建立第一本記帳本
      </UButton>
    </div>

    <!-- 浮動新增按鈕（手機） -->
    <UButton
      color="primary"
      icon="i-heroicons-plus"
      class="fixed right-5 z-50 rounded-full w-14 h-14 flex items-center justify-center shadow-xl shadow-primary-500/30 text-2xl transition-transform active:scale-95 sm:hidden"
      style="bottom: max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))"
      aria-label="新增記帳本"
      @click="openCreateDialog"
    />

    <!-- 新增記帳本對話框 -->
    <UModal v-model:open="showCreateDialog" title="新增記帳本">
      <template #body>
        <form class="space-y-4" @submit.prevent="handleCreateBook">
          <UFormField label="記帳本名稱">
            <UInput v-model="newBookName" placeholder="例如:家庭開銷、旅遊基金" required autofocus class="w-full" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="showCreateDialog = false">取消</UButton>
          <UButton color="primary" :disabled="!newBookName.trim()" @click="handleCreateBook">建立</UButton>
        </div>
      </template>
    </UModal>

    <!-- 共享對話框 -->
    <UModal v-model:open="showShareDialog" title="共享記帳本">
      <template #body>
        <form class="space-y-4" @submit.prevent="handleAddSharedUser">
          <UFormField label="使用者 Email" hint="不能將自己加入為共享使用">
            <UInput v-model="newSharedUserEmail" type="email" placeholder="輸入使用者 Email" required class="w-full" />
          </UFormField>
        </form>

        <div v-if="sharedUsersOfSelected.length" class="mt-6 space-y-2">
          <p class="text-sm font-medium text-gray-500">目前共享對象</p>
          <div
            v-for="email in sharedUsersOfSelected"
            :key="email"
            class="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2"
          >
            <span class="text-sm truncate">{{ email }}</span>
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
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="closeShareDialog">取消</UButton>
          <UButton
            type="submit"
            color="primary"
            :disabled="newSharedUserEmail === user?.email || !newSharedUserEmail"
            @click="handleAddSharedUser"
          >新增</UButton>
        </div>
      </template>
    </UModal>

    <!-- 編輯對話框 -->
    <UModal v-model:open="showEditDialog" title="編輯記帳本">
      <template #body>
        <form class="space-y-4" @submit.prevent="handleEditBook">
          <UFormField label="記帳本名稱">
            <UInput v-model="editBookName" placeholder="輸入記帳本名稱" required class="w-full" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="closeEditDialog">取消</UButton>
          <UButton type="submit" color="primary" @click="handleEditBook">儲存</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { AccountBook } from '~/types/accounting';
const router = useRouter();
const { accountBooks, loadAccountBooks, createBook, deleteBook, addSharedUser, removeSharedUser, updateBook, setBookClosed } = useAccountBooks();
const { user } = useAuth();
const { handleError } = useErrorHandler();
const { confirm } = useConfirm();

const newBookName = ref('');
const showCreateDialog = ref(false);
const showShareDialog = ref(false);
const newSharedUserEmail = ref('');
const selectedBook = ref<AccountBook | null>(null);
const showEditDialog = ref(false);
const editBookName = ref('');
const editingBook = ref<AccountBook | null>(null);

const activeCount = computed(() => accountBooks.value.filter(b => !b.closed).length);

// 共享對話框中目前的共享對象（從 accountBooks 即時取得，移除後會自動更新）
const sharedUsersOfSelected = computed(() => {
  if (!selectedBook.value) return [];
  const book = accountBooks.value.find(b => b.id === selectedBook.value!.id);
  return book?.sharedUsers ?? [];
});

// 帳本顏色（根據 id hash 產生顏色）
function getBookColor(id: string) {
  const colors = ['#0ea982', '#3b82f6', '#f59e0b', '#e11d48', '#8b5cf6', '#06b6d4'];
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

const openCreateDialog = () => {
  newBookName.value = '';
  showCreateDialog.value = true;
};

// 新增記帳本
const handleCreateBook = async () => {
  if (!newBookName.value.trim()) return;
  try {
    await createBook(newBookName.value);
    newBookName.value = '';
    showCreateDialog.value = false;
    useToast().add({ title: '新增成功', description: '記帳本已建立', color: 'success' });
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
    useToast().add({ title: '刪除成功', description: '記帳本已刪除', color: 'success' });
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

  if (newSharedUserEmail.value === user.value?.email) {
    handleError('不能將自己加入為共享使用者');
    return;
  }

  try {
    await addSharedUser(selectedBook.value.id, newSharedUserEmail.value);
    newSharedUserEmail.value = '';
    closeShareDialog();
    useToast().add({ title: '新增成功', description: '已新增共享使用者', color: 'success' });
  } catch (error) {
    handleError(error);
  }
};

// 移除共享使用者（可逆、低風險操作，於共享對話框內直接移除，避免巢狀 Modal）
const handleRemoveSharedUser = async (email: string) => {
  if (!selectedBook.value) return;

  try {
    await removeSharedUser(selectedBook.value.id, email);
    useToast().add({ title: '移除成功', description: `已移除 ${email} 的存取權限`, color: 'success' });
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
    useToast().add({ title: '更新成功', description: '記帳本名稱已更新', color: 'success' });
  } catch (error) {
    handleError(error, '無法更新記帳本，請稍後再試');
  }
};

// 關閉 / 重新開啟記帳本
const handleToggleClose = async (book: AccountBook) => {
  const closing = !book.closed;
  if (closing) {
    const ok = await confirm({
      title: '關閉記帳本',
      message: '關閉後此記帳本會反灰並移至最後，可隨時重新開啟。確定要關閉嗎？',
      confirmText: '關閉',
      color: 'warning',
    });
    if (!ok) return;
  }

  try {
    await setBookClosed(book.id, closing);
    useToast().add({
      title: closing ? '已關閉' : '已重新開啟',
      description: closing ? '記帳本已關閉' : '記帳本已重新開啟',
      color: 'success'
    });
  } catch (error) {
    handleError(error, closing ? '無法關閉記帳本，請稍後再試' : '無法重新開啟記帳本，請稍後再試');
  }
};

// 帳本操作選單
function getBookActions(book: AccountBook) {
  const isOwner = book.userId === user.value?.uid;
  return [
    [
      { label: '編輯', icon: 'i-heroicons-pencil-square', onSelect: () => openEditDialog(book) },
      { label: '共享', icon: 'i-heroicons-share', onSelect: () => openShareDialog(book) },
      ...(isOwner ? [{
        label: book.closed ? '重新開啟' : '關閉',
        icon: book.closed ? 'i-heroicons-lock-open' : 'i-heroicons-archive-box',
        onSelect: () => handleToggleClose(book)
      }] : []),
      { label: '刪除', icon: 'i-heroicons-trash', class: 'text-red-500', onSelect: () => handleDeleteBook(book.id) }
    ]
  ];
}
</script>
