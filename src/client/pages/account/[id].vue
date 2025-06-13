<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">記帳本</h1>
      <UButton label="返回記帳本列表" color="neutral" variant="subtle" @click="router.push('/')" />
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <TransactionForm v-if="selectedBookId" @submit="handleAddTransaction" />
        <div class="mt-8">
          <TransactionList
            v-if="selectedBookId"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Transaction, Recorder } from "~/types/accounting";

const router = useRouter();
const route = useRoute();
const selectedBookId = ref<string>(route.params.id as string);
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

// 初始化載入交易記錄
onMounted(async () => {
  if (selectedBookId.value) {
    transactionsInstance.value = useTransactions(selectedBookId.value);
    await transactionsInstance.value?.loadTransactions();
  }
});
</script> 