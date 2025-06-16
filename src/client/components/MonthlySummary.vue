<template>
  <div class="monthly-summary">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">月度分析</h2>
      <div class="flex items-center space-x-2">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-chevron-left"
          @click="changeMonth(-1)"
        />
        <UInput
          v-model="selectedMonth"
          type="month"
          class="w-40"
          @change="handleMonthChange"
        />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-chevron-right"
          @click="changeMonth(1)"
        />
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6">
      <UCard class="bg-success-50">
        <div class="text-sm text-success-700">總收入</div>
        <div class="text-md font-bold text-success-900">
          ${{ summary.totalIncome.toLocaleString() }}
        </div>
      </UCard>
      <UCard class="bg-error-50">
        <div class="text-sm text-error-700">總支出</div>
        <div class="text-md font-bold text-error-900">
          ${{ summary.totalExpense.toLocaleString() }}
        </div>
      </UCard>
      <UCard class="bg-primary-50">
        <div class="text-sm text-primary-700">結餘</div>
        <div class="text-md font-bold text-primary-900">
          ${{ summary.balance.toLocaleString() }}
        </div>
      </UCard>
    </div>

    <div class="mt-6">
      <h3 class="text-lg font-semibold mb-3">分類支出</h3>
      <div class="space-y-2">
        <UCard
          v-for="(amount, category) in summary.categorySummary"
          :key="category"
          class="bg-gray-50"
        >
          <div class="flex justify-between items-center">
            <span>{{ category }}</span>
            <span class="font-medium">${{ amount?.toLocaleString() }}</span>
          </div>
        </UCard>
      </div>
    </div>

    <div class="mt-6">
      <h3 class="text-lg font-semibold mb-3">未請款金額</h3>
      <div class="space-y-2">
        <UCard
          v-for="(amount, recorder) in summary.pendingAmountByRecorder"
          :key="recorder"
          class="bg-warning-50"
        >
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-2">
              <span>{{ recorder }}</span>
              <UButton
                v-if="amount > 0"
                color="primary"
                size="xs"
                @click="handleClaimAll(recorder as Recorder)"
              >
                一鍵請領
              </UButton>
            </div>
            <span class="font-medium">${{ amount.toLocaleString() }}</span>
          </div>
        </UCard>
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
  const newDate = new Date(year, month - 1 + delta, 1);
  selectedMonth.value = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
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
