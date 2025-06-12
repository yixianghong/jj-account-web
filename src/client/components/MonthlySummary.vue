<template>
  <div class="monthly-summary">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">月度分析</h2>
      <div class="flex items-center space-x-2">
        <button @click="changeMonth(-1)" class="p-2 rounded hover:bg-gray-100">
          <span class="text-lg">←</span>
        </button>
        <input
          type="month"
          v-model="selectedMonth"
          class="p-2 border rounded"
          @change="handleMonthChange"
        />
        <button @click="changeMonth(1)" class="p-2 rounded hover:bg-gray-100">
          <span class="text-lg">→</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-green-100 p-4 rounded">
        <div class="text-sm text-green-800">總收入</div>
        <div class="text-2xl font-bold text-green-900">
          {{ summary.totalIncome }}
        </div>
      </div>
      <div class="bg-red-100 p-4 rounded">
        <div class="text-sm text-red-800">總支出</div>
        <div class="text-2xl font-bold text-red-900">
          {{ summary.totalExpense }}
        </div>
      </div>
      <div class="bg-blue-100 p-4 rounded">
        <div class="text-sm text-blue-800">結餘</div>
        <div class="text-2xl font-bold text-blue-900">
          {{ summary.balance }}
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h3 class="text-lg font-semibold mb-3">分類支出</h3>
      <div class="space-y-2">
        <div
          v-for="(amount, category) in summary.categorySummary"
          :key="category"
          class="flex justify-between items-center p-2 bg-gray-50 rounded"
        >
          <span>{{ category }}</span>
          <span class="font-medium">{{ amount }}</span>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h3 class="text-lg font-semibold mb-3">未請款金額</h3>
      <div class="space-y-2">
        <div
          v-for="(amount, recorder) in summary.pendingAmountByRecorder"
          :key="recorder"
          class="flex justify-between items-center p-2 bg-yellow-50 rounded"
        >
          <div class="flex items-center space-x-2">
            <span>{{ recorder }}</span>
            <button
              v-if="amount > 0"
              @click="handleClaimAll(recorder as Recorder)"
              class="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              一鍵請領
            </button>
          </div>
          <span class="font-medium">{{ amount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { MonthlySummary, Category, Recorder } from "~/types/accounting";
import { CATEGORIES } from "~/types/accounting";

const props = defineProps<{
  transactions: Array<{
    id: string;
    type: "income" | "expense";
    amount: number;
    category: Category;
    date: string;
    recorder: Recorder;
    paymentStatus: "pending" | "paid";
  }>;
}>();

const selectedMonth = ref(new Date().toISOString().slice(0, 7));

const emit = defineEmits<{
  (e: "monthChange", month: string): void;
  (e: "claimAll", recorder: Recorder): void;
}>();

const handleMonthChange = () => {
  emit("monthChange", selectedMonth.value);
};

const changeMonth = (delta: number) => {
  const [year, month] = selectedMonth.value.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  selectedMonth.value = date.toISOString().slice(0, 7);
  handleMonthChange();
};

const summary = computed<
  MonthlySummary & { pendingAmountByRecorder: Record<string, number> }
>(() => {
  const monthTransactions = props.transactions.filter((t) =>
    t.date.startsWith(selectedMonth.value)
  );

  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const categorySummary = CATEGORIES.reduce((acc, category) => {
    const amount = monthTransactions
      .filter((t) => t.type === "expense" && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
    if (amount > 0) {
      acc[category] = amount;
    }
    return acc;
  }, {} as Record<Category, number>);

  // 計算每個記帳人的未請款金額（只統計支出）
  const pendingAmountByRecorder = monthTransactions
    .filter((t) => t.type === "expense" && t.paymentStatus === "pending")
    .reduce((acc, t) => {
      acc[t.recorder] = (acc[t.recorder] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categorySummary,
    pendingAmountByRecorder,
  };
});

const handleClaimAll = (recorder: Recorder) => {
  if (confirm(`確定要請領 ${recorder} 的所有未請款項目嗎？`)) {
    emit("claimAll", recorder);
  }
};
</script>
