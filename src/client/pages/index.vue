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
import type { Transaction, Recorder, AccountBook } from "~/types/accounting";

const accountBooks = ref<AccountBook[]>([]);
const selectedBookId = ref<string>("");
const showNewBookForm = ref(false);
const newBookName = ref("");
const selectedMonth = ref(new Date().toISOString().slice(0, 7));

// 載入記帳本資料
const loadAccountBooks = () => {
  const savedBooks = localStorage.getItem("accountBooks");
  if (savedBooks) {
    accountBooks.value = JSON.parse(savedBooks);
    if (accountBooks.value.length > 0 && !selectedBookId.value) {
      selectedBookId.value = accountBooks.value[0].id;
    }
  }
};

// 儲存記帳本資料
const saveAccountBooks = () => {
  localStorage.setItem("accountBooks", JSON.stringify(accountBooks.value));
};

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

const handleCreateBook = () => {
  if (!newBookName.value.trim()) return;

  const newBook: AccountBook = {
    id: crypto.randomUUID(),
    name: newBookName.value.trim(),
    transactions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  accountBooks.value.push(newBook);
  selectedBookId.value = newBook.id;
  saveAccountBooks();
  showNewBookForm.value = false;
  newBookName.value = "";
};

const handleMonthChange = (month: string) => {
  selectedMonth.value = month;
};

const handleAddTransaction = (
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
    currentBook.transactions.push(newTransaction);
    currentBook.transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    currentBook.updatedAt = new Date().toISOString();
    saveAccountBooks();
  }
};

const handleDeleteTransaction = (id: string) => {
  const currentBook = accountBooks.value.find(
    (book) => book.id === selectedBookId.value
  );
  if (currentBook) {
    currentBook.transactions = currentBook.transactions.filter(
      (t) => t.id !== id
    );
    currentBook.updatedAt = new Date().toISOString();
    saveAccountBooks();
  }
};

const handleUpdateTransaction = (updatedTransaction: Transaction) => {
  const currentBook = accountBooks.value.find(
    (book) => book.id === selectedBookId.value
  );
  if (currentBook) {
    const index = currentBook.transactions.findIndex(
      (t) => t.id === updatedTransaction.id
    );
    if (index !== -1) {
      currentBook.transactions[index] = updatedTransaction;
      currentBook.updatedAt = new Date().toISOString();
      saveAccountBooks();
    }
  }
};

const handleClaimAll = (recorder: Recorder) => {
  const currentBook = accountBooks.value.find(
    (book) => book.id === selectedBookId.value
  );
  if (currentBook) {
    currentBook.transactions = currentBook.transactions.map((t) => {
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
    currentBook.updatedAt = new Date().toISOString();
    saveAccountBooks();
  }
};

// 初始化載入記帳本
onMounted(() => {
  loadAccountBooks();
});
</script>
