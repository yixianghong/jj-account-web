<template>
  <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
    <h3 class="text-base font-bold mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-chart-bar" class="w-4 h-4 text-primary-500" />分類支出
    </h3>

    <div v-if="rows.length" class="space-y-3">
      <div v-for="row in rows" :key="row.category">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center"
              :class="getCategoryColor(row.category)"
            ><UIcon :name="getCategoryIcon(row.category)" class="w-4 h-4" /></span>
            <span class="text-sm font-medium truncate">{{ row.category }}</span>
            <span class="text-xs text-gray-400">{{ row.percent }}%</span>
          </div>
          <span class="text-sm font-bold text-rose-600 tabular-nums">${{ row.amount.toLocaleString() }}</span>
        </div>
        <div class="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div class="h-full rounded-full bg-rose-400 transition-all duration-500" :style="{ width: row.percent + '%' }" />
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-400 py-6 text-sm">本月尚無支出</div>
  </div>
</template>

<script setup lang="ts">
import { getCategoryIcon, getCategoryColor } from '~/utils/category';

const monthlyTransactionsInstance = inject('monthlyTransactions') as ReturnType<typeof useMonthlyTransactions> | undefined;
const instance = monthlyTransactionsInstance || useMonthlyTransactions();
const { monthlySummary } = instance;

const rows = computed(() => {
  const entries = Object.entries(monthlySummary.value.categorySummary) as [string, number][];
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return entries
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percent: Math.round((amount / max) * 100),
    }));
});
</script>
