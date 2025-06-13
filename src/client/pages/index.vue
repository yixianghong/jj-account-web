<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="accountBooks.length > 0" class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">記帳本</h1>
      <div class="flex items-center space-x-4">
        <USelect
          v-model="selectedBookId"
          :items="accountBooks"
          label-key="name"
          value-key="id"
          @change="handleBookChange"
        />
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
          <TransactionForm @submit="handleAddTransaction" />
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
import { ref, computed } from "vue";
import type { Transaction, Recorder } from "~/types/accounting";

const { accountBooks, loadAccountBooks, createBook, updateBookTransactions } = useAccountBooks();
const selectedBookId = ref<string>("");
const showNewBookForm = ref(false);
const newBookName = ref("");
const selectedMonth = ref(new Date().toISOString().slice(0, 7));

// 取得當前記帳本的交易記錄
const transactions = computed(() => {
  const currentBook = accountBooks.value.find(
    (book) => book.id === selectedBookId.value
  );
  return currentBook?.transactions || [];
});

const filteredTransactions = computed(() => {
  return transactions.value.filter((t) =>
    t.date.startsWith(selectedMonth.value)
  );
});

const handleBookChange = () => {
  selectedMonth.value = new Date().toISOString().slice(0, 7);
};

const handleCreateBook = async () => {
  if (!newBookName.value.trim()) return;

  try {
    const newBook = await createBook(newBookName.value);
    selectedBookId.value = newBook.id;
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
  const newTransaction: Transaction = {
    ...transaction,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const currentBook = accountBooks.value.find(
    (book) => book.id === selectedBookId.value
  );
  if (currentBook) {
    const updatedTransactions = [...currentBook.transactions, newTransaction].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    await updateBookTransactions(currentBook.id, updatedTransactions);
  }
};

const handleDeleteTransaction = async (id: string) => {
  const currentBook = accountBooks.value.find(
    (book) => book.id === selectedBookId.value
  );
  if (currentBook) {
    const updatedTransactions = currentBook.transactions.filter(
      (t) => t.id !== id
    );
    await updateBookTransactions(currentBook.id, updatedTransactions);
  }
};

const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
  const currentBook = accountBooks.value.find(
    (book) => book.id === selectedBookId.value
  );
  if (currentBook) {
    const updatedTransactions = currentBook.transactions.map((t) =>
      t.id === updatedTransaction.id ? updatedTransaction : t
    );
    await updateBookTransactions(currentBook.id, updatedTransactions);
  }
};

const handleClaimAll = async (recorder: Recorder) => {
  const currentBook = accountBooks.value.find(
    (book) => book.id === selectedBookId.value
  );
  if (currentBook) {
    const updatedTransactions = currentBook.transactions.map((t) => {
      if (
        t.type === "expense" &&
        t.recorder === recorder &&
        t.paymentStatus === "pending"
      ) {
        return {
          ...t,
          paymentStatus: "paid" as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    await updateBookTransactions(currentBook.id, updatedTransactions);
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
