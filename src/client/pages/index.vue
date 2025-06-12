<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">家庭記帳本</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <TransactionForm @submit="handleAddTransaction" />
        <div class="mt-8">
          <TransactionList :transactions="transactions" />
        </div>
      </div>
      <div>
        <MonthlySummary :summary="monthlySummary" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Transaction, MonthlySummary } from "~/types/accounting";

const transactions = ref<Transaction[]>([]);

const monthlySummary = computed<MonthlySummary>(() => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.value.filter((t) =>
    t.date.startsWith(currentMonth)
  );

  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const categorySummary = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categorySummary,
  };
});

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
</script>
