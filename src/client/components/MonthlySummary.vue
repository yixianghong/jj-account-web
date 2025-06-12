<template>
  <div class="monthly-summary">
    <h2 class="text-xl font-bold mb-4">本月分析</h2>
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
  </div>
</template>

<script setup lang="ts">
import type { MonthlySummary } from "~/types/accounting";

defineProps<{
  summary: MonthlySummary;
}>();
</script>
