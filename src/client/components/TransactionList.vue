<template>
  <div class="transaction-list">
    <h2 class="text-xl font-bold mb-4">記帳列表</h2>
    <div class="space-y-4">
      <UCard
        v-for="transaction in transactions"
        :key="transaction.id"
        class="w-full"
      >
        <div class="flex justify-between items-start">
          <div>
            <UBadge
              :color="transaction.type === 'income' ? 'success' : 'error'"
              variant="subtle"
            >
              {{ transaction.type === "income" ? "收入" : "支出" }}
            </UBadge>
            <UButton
              v-if="transaction.type === 'expense'"
              :color="transaction.paymentStatus === 'paid' ? 'primary' : 'warning'"
              variant="subtle"
              size="xs"
              class="ml-2"
              @click="togglePaymentStatus(transaction)"
            >
              {{ transaction.paymentStatus === "paid" ? "已請款" : "未請款" }}
            </UButton>
            <UBadge
              v-else
              color="neutral"
              variant="subtle"
              class="ml-2"
            >
              已請款
            </UBadge>
          </div>
          <div class="flex items-center space-x-2">
            <div class="text-lg font-bold">
              {{ transaction.type === "income" ? "+" : "-" }}${{ transaction.amount.toLocaleString() }}
            </div>
            <UButton
              color="primary"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              size="xs"
              @click="handleEdit(transaction)"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              @click="handleDelete(transaction.id)"
            />
          </div>
        </div>
        <div class="mt-2 text-sm text-gray-600">
          <div>分類：{{ transaction.category }}</div>
          <div>描述：{{ transaction.description }}</div>
          <div>記帳人：{{ transaction.recorder }}</div>
          <div>日期：{{ transaction.date }}</div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Transaction } from "~/types/accounting";

defineProps<{
  transactions: Transaction[];
}>();

const emit = defineEmits<{
  (e: "delete", id: string): void;
  (e: "update", transaction: Transaction): void;
  (e: "edit", transaction: Transaction): void;
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
    paymentStatus: (transaction.paymentStatus === "paid"
      ? "pending"
      : "paid") as "pending" | "paid",
    updatedAt: new Date().toISOString(),
  };
  emit("update", updatedTransaction);
};

const handleEdit = (transaction: Transaction) => {
  emit("edit", transaction);
};
</script>
