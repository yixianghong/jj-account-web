<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">家庭記帳本</h1>
      <div class="flex items-center space-x-4">
        <select
          v-model="selectedBookId"
          class="p-2 border rounded"
          @change="handleBookChange"
        >
          <option v-for="book in accountBooks" :key="book.id" :value="book.id">
            {{ book.name }}
          </option>
        </select>
        <button
          @click="showNewBookForm = true"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          新增記帳本
        </button>
      </div>
    </div>

    <div
      v-if="showNewBookForm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white p-6 rounded-lg w-96">
        <h2 class="text-xl font-bold mb-4">新增記帳本</h2>
        <input
          v-model="newBookName"
          type="text"
          placeholder="記帳本名稱"
          class="w-full p-2 border rounded mb-4"
        />
        <div class="flex justify-end space-x-2">
          <button
            @click="showNewBookForm = false"
            class="px-4 py-2 border rounded hover:bg-gray-100"
          >
            取消
          </button>
          <button
            @click="handleCreateBook"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            建立
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
    </div>
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
loadAccountBooks();
</script>
