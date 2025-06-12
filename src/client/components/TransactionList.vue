<template>
  <div class="transaction-list">
    <h2 class="text-xl font-bold mb-4">記帳列表</h2>
    <div class="space-y-4">
      <div
        v-for="transaction in transactions"
        :key="transaction.id"
        class="border p-4 rounded"
      >
        <div class="flex justify-between items-start">
          <div>
            <span
              :class="[
                'px-2 py-1 rounded text-sm',
                transaction.type === 'income'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800',
              ]"
            >
              {{ transaction.type === "income" ? "收入" : "支出" }}
            </span>
            <span
              :class="[
                'ml-2 px-2 py-1 rounded text-sm',
                transaction.paymentStatus === 'paid'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800',
              ]"
            >
              {{ transaction.paymentStatus === "paid" ? "已請款" : "未請款" }}
            </span>
          </div>
          <div class="text-lg font-bold">
            {{ transaction.type === "income" ? "+" : "-"
            }}{{ transaction.amount }}
          </div>
        </div>
        <div class="mt-2 text-sm text-gray-600">
          <div>分類：{{ transaction.category }}</div>
          <div>描述：{{ transaction.description }}</div>
          <div>記帳人：{{ transaction.recorder }}</div>
          <div>日期：{{ transaction.date }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Transaction } from "~/types/accounting";

defineProps<{
  transactions: Transaction[];
}>();
</script>
