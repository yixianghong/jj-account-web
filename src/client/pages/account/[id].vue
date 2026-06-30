<template>
  <div class="mx-auto w-full max-w-2xl px-4 sm:px-6 py-5 sm:py-6 pb-28">
    <!-- 標題列 -->
    <div class="flex items-center gap-3 mb-5">
      <UButton
        color="neutral"
        variant="soft"
        icon="i-heroicons-arrow-left"
        class="rounded-full"
        aria-label="返回"
        @click="router.push('/accounts')"
      />
      <h1 class="text-xl font-extrabold tracking-tight truncate">{{ accountBook?.name || '記帳本' }}</h1>
    </div>

    <template v-if="selectedBookId">
      <!-- 被動上期結餘提示 -->
      <div class="mb-5">
        <PreviousBalanceBanner :account-id="selectedBookId" />
      </div>

      <!-- 本月總覽 -->
      <AccountOverview :account-id="selectedBookId" class="mb-5" />

      <!-- 分頁切換 -->
      <div class="flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-5">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl transition-all"
          :class="activeTab === tab.key
            ? 'bg-white dark:bg-gray-900 shadow-sm text-primary-600 dark:text-primary-400'
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
          :aria-pressed="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" />{{ tab.label }}
        </button>
      </div>

      <!-- 分頁內容 -->
      <div>
        <TransactionList
          v-show="activeTab === 'list'"
          :transactions="[...monthlyTransactions]"
          @delete="handleDeleteTransaction"
          @update="handleUpdateTransaction"
          @edit="handleEditTransaction"
        />

        <div v-show="activeTab === 'stats'" class="space-y-4">
          <CategoryBreakdown :account-id="selectedBookId" />
          <YearlyAnalysis :account-id="selectedBookId" />
        </div>

        <ReconcilePanel
          v-show="activeTab === 'reconcile'"
          @claim-all="handleClaimAll"
        />
      </div>
    </template>

    <!-- 新增/編輯記帳 -->
    <TransactionDialog
      v-model="showTransactionDialog"
      :mode="dialogMode"
      :book="accountBook"
      :initial-data="selectedTransaction"
      @submit="handleTransactionSubmit"
    />

    <!-- 浮動新增按鈕 -->
    <UButton
      v-if="selectedBookId && accountBook"
      color="primary"
      icon="i-heroicons-plus"
      class="fixed z-50 rounded-full w-14 h-14 flex items-center justify-center shadow-xl shadow-primary-500/30 text-2xl transition-transform active:scale-95"
      style="bottom: max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem)); right: max(1.25rem, calc(50vw - 21rem))"
      aria-label="新增記帳"
      @click="openTransactionDialog('add')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, provide } from "vue";
import type { Transaction, Recorder, AccountBook } from "~/types/accounting";
import TransactionDialog from "~/components/TransactionDialog.vue";

import { useAnalysisCache } from "~/composables/useAnalysisCache";
import { useMonthlyTransactions } from "~/composables/useMonthlyTransactions";

const router = useRouter();
const route = useRoute();
const { accountBooks, loadAccountBooks } = useAccountBooks();
const { handleError } = useErrorHandler();
const accountBook = ref<AccountBook | null>(null);
const selectedBookId = ref<string>(route.params.id as string);
const { user } = useAuth();

// 分頁
const tabs = [
  { key: 'list' as const, label: '帳目', icon: 'i-lucide-list' },
  { key: 'stats' as const, label: '統計', icon: 'i-lucide-chart-pie' },
  { key: 'reconcile' as const, label: '對帳', icon: 'i-lucide-scale' },
];
const activeTab = ref<'list' | 'stats' | 'reconcile'>('list');

// 保存 useTransactions 實例（僅用於交易列表）
const transactionsInstance = ref<ReturnType<typeof useTransactions> | null>(null);

// 創建共享的月度交易實體
const monthlyTransactionsInstance = useMonthlyTransactions();
const { selectedMonth, monthlyTransactions } = monthlyTransactionsInstance;

// 提供給子元件使用
provide('monthlyTransactions', monthlyTransactionsInstance);

const showTransactionDialog = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');
const selectedTransaction = ref<Transaction | undefined>(undefined);

// 檢查記帳本權限
const checkBookPermission = async () => {
  if (!user.value) {
    router.push('/');
    return false;
  }

  const book = accountBooks.value.find(book => book.id === selectedBookId.value);
  if (!book) {
    router.push('/accounts');
    return false;
  }

  // 檢查使用者是否為記帳本擁有者或共享使用者
  if (book.userId !== user.value.uid && !book.sharedUsers?.includes(user.value.email || '')) {
    router.push('/accounts');
    return false;
  }

  return true;
};

// 當選擇的記帳本改變時，重新初始化 useTransactions（僅用於交易列表）
watch(selectedBookId, async (newBookId) => {
  if (newBookId) {
    const hasPermission = await checkBookPermission();
    if (!hasPermission) return;

    transactionsInstance.value = useTransactions(newBookId);
    // 設定即時監聽
    await transactionsInstance.value?.setupRealtimeListener();

    // 載入月度資料
    await monthlyTransactionsInstance.loadMonthlyTransactions(newBookId, selectedMonth.value);
  } else {
    if (transactionsInstance.value) {
      transactionsInstance.value.cleanup();
    }
    transactionsInstance.value = null;
  }
});

const reloadMonthly = async () => {
  const { clearAccountAnalysisCache } = useAnalysisCache();
  clearAccountAnalysisCache(selectedBookId.value);
  monthlyTransactionsInstance.clearCache(selectedBookId.value);
  await monthlyTransactionsInstance.loadMonthlyTransactions(selectedBookId.value, selectedMonth.value);
};

const handleDeleteTransaction = async (id: string) => {
  if (!transactionsInstance.value) return;
  try {
    await transactionsInstance.value.deleteTransaction(id);
    await reloadMonthly();
  } catch (error) {
    handleError(error, '刪除交易記錄失敗');
  }
};

const handleUpdateTransaction = async (transaction: Transaction) => {
  if (!transactionsInstance.value) return;
  try {
    await transactionsInstance.value.updateTransaction(transaction.id, transaction);
    await reloadMonthly();
  } catch (error) {
    handleError(error, '更新交易記錄失敗');
  }
};

const handleClaimAll = async (recorder: Recorder) => {
  if (!transactionsInstance.value) return;
  try {
    // 傳入當前選中的月份，只更新該月份的交易記錄
    await transactionsInstance.value.updateTransactionsPaymentStatus(recorder, 'paid', selectedMonth.value);
    await reloadMonthly();
    useToast().add({
      title: '更新成功',
      description: `已更新 ${selectedMonth.value} 的所有交易記錄請款狀態`,
      color: 'success'
    });
  } catch (error) {
    handleError(error, '更新請款狀態失敗');
  }
};

const openTransactionDialog = (mode: 'add' | 'edit', transaction?: Transaction) => {
  dialogMode.value = mode;
  selectedTransaction.value = transaction;
  showTransactionDialog.value = true;
};

const handleTransactionSubmit = async (transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
  if (!transactionsInstance.value) return;
  try {
    if (dialogMode.value === 'add') {
      await transactionsInstance.value.addTransaction(transaction);
    } else if (dialogMode.value === 'edit' && selectedTransaction.value) {
      await transactionsInstance.value.updateTransaction(selectedTransaction.value.id, {
        ...transaction,
        id: selectedTransaction.value.id,
        createdAt: selectedTransaction.value.createdAt,
        updatedAt: new Date().toISOString()
      });
    }
    await reloadMonthly();
  } catch (error) {
    handleError(error, dialogMode.value === 'add' ? '新增交易記錄失敗' : '更新交易記錄失敗');
  }
};

const handleEditTransaction = (transaction: Transaction) => {
  openTransactionDialog('edit', transaction);
};

// 載入記帳本資料
onMounted(async () => {
  try {
    await loadAccountBooks();
    const bookId = route.params.id as string;
    accountBook.value = accountBooks.value.find(book => book.id === bookId) || null;

    if (!accountBook.value) {
      router.push('/accounts');
      return;
    }

    const hasPermission = await checkBookPermission();
    if (!hasPermission) return;

    if (selectedBookId.value) {
      transactionsInstance.value = useTransactions(selectedBookId.value);
      // 設定即時監聽
      await transactionsInstance.value?.setupRealtimeListener();

      // 載入月度資料
      await monthlyTransactionsInstance.loadMonthlyTransactions(selectedBookId.value, selectedMonth.value);
    }
  } catch (error) {
    handleError(error, '載入記帳本資料失敗');
  }
});

// 組件卸載時清理資源
onUnmounted(() => {
  if (transactionsInstance.value) {
    transactionsInstance.value.cleanup();
  }
});
</script>
