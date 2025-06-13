<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="accountBooks.length > 0" class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">記帳本</h1>
      <div class="flex items-center space-x-4">
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="book in accountBooks"
            :key="book.id"
            :color="selectedBookId === book.id ? 'primary' : 'neutral'"
            variant="soft"
            @click="handleBookSelect(book.id)"
          >
            {{ book.name }}
          </UButton>
        </div>
        <UButton label="新增記帳本" color="neutral" variant="subtle" @click="showNewBookForm = true" />
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div v-if="accountBooks.length === 0" class="lg:col-span-3 text-center py-8">
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
      <template v-else>
        <div class="lg:col-span-2">
          <TransactionForm v-if="selectedBookId" @submit="handleAddTransaction" />
          <div v-else class="mb-4 text-center text-gray-500">請先選擇記帳本</div>
          <div class="mt-8">
            <TransactionList
              :transactions="filteredTransactions"
              @delete="handleDeleteTransaction"
              @update="handleUpdateTransaction"
            />
          </div>
        </div>
        <div>
          <MonthlySummary
            v-if="selectedBookId"
            :transactions="transactions"
            @month-change="handleMonthChange"
            @claim-all="handleClaimAll"
          />
        </div>
      </template>
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
import { ref, computed, watch } from "vue";
import type { Transaction, Recorder } from "~/types/accounting";

const { accountBooks, loadAccountBooks, createBook } = useAccountBooks();
const selectedBookId = ref<string>("");
const showNewBookForm = ref(false);
const newBookName = ref("");
const selectedMonth = ref(new Date().toISOString().slice(0, 7));

// 保存 useTransactions 實例
const transactionsInstance = ref<ReturnType<typeof useTransactions> | null>(null);

// 當選擇的記帳本改變時，重新初始化 useTransactions
watch(selectedBookId, (newBookId) => {
  if (newBookId) {
    transactionsInstance.value = useTransactions(newBookId);
    transactionsInstance.value?.loadTransactions();
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

const handleBookSelect = (bookId: string) => {
  selectedBookId.value = bookId;
  selectedMonth.value = new Date().toISOString().slice(0, 7);
};

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
    console.error('新增交易記錄失敗：', error);
  }
};

const handleDeleteTransaction = async (id: string) => {
  if (!transactionsInstance.value) return;
  
  try {
    await transactionsInstance.value.deleteTransaction(id);
  } catch (error) {
    console.error('刪除交易記錄失敗：', error);
  }
};

const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
  if (!transactionsInstance.value) return;
  
  try {
    await transactionsInstance.value.updateTransaction(updatedTransaction.id, updatedTransaction);
  } catch (error) {
    console.error('更新交易記錄失敗：', error);
  }
};

const handleClaimAll = async (recorder: Recorder) => {
  if (!transactionsInstance.value) return;
  
  try {
    await transactionsInstance.value.updateTransactionsPaymentStatus(recorder, 'paid');
  } catch (error) {
    console.error('更新請款狀態失敗：', error);
  }
};

// 初始化載入記帳本
onMounted(async () => {
  await loadAccountBooks();
  if (accountBooks.value.length > 0 && !selectedBookId.value) {
    selectedBookId.value = accountBooks.value[0].id;
  }
});
</script>
