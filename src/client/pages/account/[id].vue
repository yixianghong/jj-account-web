<template>
  <div class="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
    <!-- Splitwise 風格標題區 -->
    <div class="relative flex justify-between mb-8">
      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-heroicons-arrow-left"
          @click="router.push('/accounts')"
        />
      <h1 class="text-3xl font-extrabold text-center tracking-tight">{{ accountBook?.name || '記帳本' }}</h1>
      </div>
      <ImportExcel @import="handleImportExcel" />
    </div>

    <!-- 主要內容區塊 -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div class="lg:col-span-2">
        <TransactionDialog
          v-model="showTransactionDialog"
          :mode="dialogMode"
          :book="accountBook"
          :initial-data="selectedTransaction"
          @submit="handleTransactionSubmit"
        />
        <MonthlySummary
          v-if="selectedBookId"
          :transactions="transactions"
          @month-change="handleMonthChange"
          @claim-all="handleClaimAll"
        />
      </div>
      <div class="lg:col-span-2">
          <TransactionList
            v-if="selectedBookId"
            :transactions="filteredTransactions"
            @delete="handleDeleteTransaction"
            @update="handleUpdateTransaction"
            @edit="handleEditTransaction"
            @reorder="handleReorderTransactions"
          />
          <!-- 載入更多按鈕 -->
          <div v-if="transactionsInstance?.hasMore" class="mt-4 text-center">
            <UButton
              :loading="transactionsInstance?.loading"
              @click="handleLoadMore"
              variant="outline"
            >
              載入更多
            </UButton>
          </div>
      </div>
    </div>

    <!-- 右下角浮動新增按鈕（桌面隱藏） -->
    <UButton
      v-if="selectedBookId && accountBook"
      color="primary"
      icon="i-heroicons-plus"
      class="fixed bottom-6 right-6 z-50 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl text-3xl"
      @click="openTransactionDialog('add')"
      aria-label="新增記帳"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { Transaction, Recorder, AccountBook } from "~/types/accounting";
import TransactionDialog from "~/components/TransactionDialog.vue";
import { collection, doc, writeBatch } from 'firebase/firestore';

const router = useRouter();
const route = useRoute();
const { accountBooks, loadAccountBooks } = useAccountBooks();
const { handleError } = useErrorHandler();
const accountBook = ref<AccountBook | null>(null);
const selectedBookId = ref<string>(route.params.id as string);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const { user } = useAuth();
const { $firebase } = useNuxtApp();

// 保存 useTransactions 實例
const transactionsInstance = ref<ReturnType<typeof useTransactions> | null>(null);

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

// 當選擇的記帳本改變時，重新初始化 useTransactions
watch(selectedBookId, async (newBookId) => {
  if (newBookId) {
    const hasPermission = await checkBookPermission();
    if (!hasPermission) return;

    transactionsInstance.value = useTransactions(newBookId);
    // 先載入當前月份的資料
    await transactionsInstance.value?.loadTransactionsByMonth(selectedMonth.value);
    // 再設定即時監聽
    await transactionsInstance.value?.setupRealtimeListener();
  } else {
    if (transactionsInstance.value) {
      transactionsInstance.value.cleanup();
    }
    transactionsInstance.value = null;
  }
});

// 取得交易記錄
const transactions = computed(() => {
  return transactionsInstance.value?.transactions || [];
});

// 取得過濾後的交易記錄
const filteredTransactions = computed(() => {
  if (!transactionsInstance.value) return [];
  return transactionsInstance.value.transactions;
});

const handleMonthChange = async (month: string) => {
  if (transactionsInstance.value) {
    try {
      // 先更新月份
      selectedMonth.value = month;
      // 重新載入指定月份的交易記錄
      await transactionsInstance.value.loadTransactionsByMonth(month);
      // 重新設定即時監聽
      await transactionsInstance.value.setupRealtimeListener();
    } catch (error) {
      handleError(error, '載入月份交易記錄失敗');
    }
  }
};

const handleAddTransaction = async (
  transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
) => {
  if (!transactionsInstance.value) return;
  
  try {
    await transactionsInstance.value.addTransaction(transaction);
  } catch (error) {
    handleError(error, '新增交易記錄失敗');
  }
};

const handleDeleteTransaction = async (id: string) => {
  if (!transactionsInstance.value) return;
  
  try {
    await transactionsInstance.value.deleteTransaction(id);
  } catch (error) {
    handleError(error, '刪除交易記錄失敗');
  }
};

const handleUpdateTransaction = async (transaction: Transaction) => {
  if (!transactionsInstance.value) return;
  
  try {
    await transactionsInstance.value.updateTransaction(transaction.id, transaction);
  } catch (error) {
    handleError(error, '更新交易記錄失敗');
  }
};

const handleClaimAll = async (recorder: Recorder) => {
  if (!transactionsInstance.value) return;
  
  try {
    await transactionsInstance.value.updateTransactionsPaymentStatus(recorder, 'paid');
    useToast().add({
      title: '更新成功',
      description: '已更新所有交易記錄的請款狀態',
      color: 'success'
    });
  } catch (error) {
    handleError(error, '更新請款狀態失敗');
  }
};

const handleImportExcel = async (transactions: Omit<Transaction, "id" | "createdAt" | "updatedAt">[]) => {
  if (!transactionsInstance.value) return;

  try {
    // 過濾掉無效的資料
    const validTransactions = transactions.filter(t => 
      t.date && 
      t.type && 
      t.amount && 
      t.category && 
      t.recorder && 
      t.paymentStatus
    );

    // 批次新增交易記錄
    for (const transaction of validTransactions) {
      await transactionsInstance.value.addTransaction(transaction);
    }

    // 顯示成功訊息
    useToast().add({
      title: '匯入成功',
      description: `成功匯入 ${validTransactions.length} 筆交易記錄${validTransactions.length !== transactions.length ? `，跳過 ${transactions.length - validTransactions.length} 筆無效資料` : ''}`,
      color: 'success'
    });
  } catch (error) {
    handleError(error, '匯入交易記錄失敗');
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
  } catch (error) {
    handleError(error, dialogMode.value === 'add' ? '新增交易記錄失敗' : '更新交易記錄失敗');
  }
};

const handleEditTransaction = (transaction: Transaction) => {
  openTransactionDialog('edit', transaction);
};

const handleReorderTransactions = async (transactions: Transaction[]) => {
  if (!transactionsInstance.value) return;
  
  try {
    // 更新本地狀態
    transactionsInstance.value.transactions = transactions;
    
    // 更新資料庫中的順序
    const batch = writeBatch($firebase.db);
    const transactionsRef = collection($firebase.db, 'accountBooks', selectedBookId.value, 'transactions');
    
    transactions.forEach((transaction, index) => {
      const docRef = doc(transactionsRef, transaction.id);
      batch.update(docRef, { order: index });
    });
    
    await batch.commit();
    
    useToast().add({
      title: '更新成功',
      description: '已更新交易記錄順序',
      color: 'success'
    });
  } catch (error) {
    handleError(error, '更新交易記錄順序失敗');
  }
};

const handleLoadMore = async () => {
  if (!transactionsInstance.value) return;
  
  try {
    await transactionsInstance.value.loadMore();
  } catch (error) {
    handleError(error, '載入更多交易記錄失敗');
  }
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
      // 先載入當前月份的資料
      await transactionsInstance.value?.loadTransactionsByMonth(selectedMonth.value);
      // 再設定即時監聽
      await transactionsInstance.value?.setupRealtimeListener();
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