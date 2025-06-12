<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">家庭記帳本</h1>

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
import type { Transaction, Recorder } from "~/types/accounting";

const transactions = ref<Transaction[]>([]);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));

const filteredTransactions = computed(() => {
  return transactions.value.filter((t) =>
    t.date.startsWith(selectedMonth.value)
  );
});

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

  transactions.value.push(newTransaction);
  // 按日期排序
  transactions.value.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

const handleDeleteTransaction = (id: string) => {
  transactions.value = transactions.value.filter((t) => t.id !== id);
};

const handleUpdateTransaction = (updatedTransaction: Transaction) => {
  const index = transactions.value.findIndex(
    (t) => t.id === updatedTransaction.id
  );
  if (index !== -1) {
    transactions.value[index] = updatedTransaction;
  }
};

const handleClaimAll = (recorder: Recorder) => {
  const updatedTransactions = transactions.value.map((t) => {
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

  transactions.value = updatedTransactions;
  localStorage.setItem("transactions", JSON.stringify(updatedTransactions));
};
</script>
