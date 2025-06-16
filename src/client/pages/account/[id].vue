<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">{{ accountBook?.name || '記帳本' }}</h1>
      <div class="flex items-center space-x-4">
        <ImportExcel @import="handleImportExcel" />
      </div>
      <UButton label="返回記帳本列表" color="neutral" variant="subtle" @click="router.push('/accounts')" />
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div class="lg:col-span-2">
        <TransactionForm 
          v-if="selectedBookId && accountBook" 
          :book="accountBook"
          @submit="handleAddTransaction" 
        />
        <div class="mt-8">
          <MonthlySummary
            v-if="selectedBookId"
            :transactions="transactions"
            @month-change="handleMonthChange"
            @claim-all="handleClaimAll"
          />
        </div>
      </div>
      <div class="lg:col-span-2">
          <TransactionList
            v-if="selectedBookId"
            :transactions="filteredTransactions"
            @delete="handleDeleteTransaction"
            @update="handleUpdateTransaction"
          />
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { Transaction, Recorder, AccountBook } from "~/types/accounting";

const router = useRouter();
const route = useRoute();
const { accountBooks, loadAccountBooks, updateBookTransactions } = useAccountBooks();
const { handleError } = useErrorHandler();
const accountBook = ref<AccountBook | null>(null);
const selectedBookId = ref<string>(route.params.id as string);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const { user } = useAuth();

// 保存 useTransactions 實例
const transactionsInstance = ref<ReturnType<typeof useTransactions> | null>(null);

// 檢查記帳本權限
const checkBookPermission = async () => {
  if (!user.value) {
    router.push('/login');
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
    transactionsInstance.value?.loadTransactions().catch(handleError);
  } else {
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
  return transactionsInstance.value.getTransactionsByMonth(selectedMonth.value);
});

const handleMonthChange = (month: string) => {
  selectedMonth.value = month;
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
      await transactionsInstance.value?.loadTransactions();
    }
  } catch (error) {
    handleError(error, '載入記帳本資料失敗');
  }
});
</script> 