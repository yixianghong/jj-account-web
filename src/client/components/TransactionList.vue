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
            <button
              v-if="transaction.type === 'expense'"
              @click="togglePaymentStatus(transaction)"
              :class="[
                'ml-2 px-2 py-1 rounded text-sm cursor-pointer',
                transaction.paymentStatus === 'paid'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800',
              ]"
            >
              {{ transaction.paymentStatus === "paid" ? "已請款" : "未請款" }}
            </button>
            <span
              v-else
              class="ml-2 px-2 py-1 rounded text-sm bg-gray-100 text-gray-800"
            >
              已請款
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="text-lg font-bold">
              {{ transaction.type === "income" ? "+" : "-"
              }}{{ transaction.amount }}
            </div>
            <button
              @click="handleDelete(transaction.id)"
              class="p-1 text-red-500 hover:text-red-700"
              title="刪除"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
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

const props = defineProps<{
  transactions: Transaction[];
}>();

const emit = defineEmits<{
  (e: "delete", id: string): void;
  (e: "update", transaction: Transaction): void;
}>();

const handleDelete = (id: string) => {
  if (confirm("確定要刪除這筆記帳嗎？")) {
    emit("delete", id);
  }
};

const togglePaymentStatus = (transaction: Transaction) => {
  if (transaction.type === "income") return;

  const updatedTransaction = {
    ...transaction,
    paymentStatus: transaction.paymentStatus === "paid" ? "pending" : "paid",
    updatedAt: new Date().toISOString(),
  };
  emit("update", updatedTransaction);
};
</script>
