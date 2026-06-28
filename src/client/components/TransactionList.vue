<template>
  <div class="transaction-list">
    <!-- Splitwise 風格標題區 -->
    <div class="flex flex-col items-center mb-6">
      <h2 class="text-2xl font-extrabold text-center tracking-tight">記帳列表</h2>
    </div>
    <div class="space-y-2">
      <div 
        v-for="transaction in transactions" 
        :key="transaction.id"
        class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors  group"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium truncate">{{ transaction.category }}</span>
            <UButton
              v-if="transaction.type === 'expense'"
              :color="transaction.paymentStatus === 'paid' ? 'primary' : 'warning'"
              variant="subtle"
              size="xs"
              @click="togglePaymentStatus(transaction)"
            >
              {{ transaction.paymentStatus === "paid" ? "已請款" : "未請款" }}
            </UButton>
          </div>
          <div class="text-sm text-gray-500 truncate">{{ transaction.description }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ transaction.recorder }} • {{ transaction.date }}</div>
        </div>
        <div class="flex items-center gap-2 ml-4">
          <div class="text-right">
            <div class="font-bold" :class="transaction.type === 'income' ? 'text-success-600' : 'text-error-600'">
              {{ transaction.type === "income" ? "+" : "-" }}${{ transaction.amount.toLocaleString() }}
            </div>
          </div>
          <!-- 操作按鈕 -->
          <div>
            <UDropdownMenu
              :items="getTransactionActions(transaction)"
              :popper="{ placement: 'bottom-end' }"
              class="!p-0"
            >
              <UButton icon="i-heroicons-ellipsis-vertical" size="sm" color="neutral" variant="ghost" @click.stop />
            </UDropdownMenu>
          </div>
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

const emit = defineEmits<{
  (e: "delete", id: string): void;
  (e: "update" | "edit", transaction: Transaction): void;
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

function getTransactionActions(transaction: Transaction) {
  return [
    [
      {
        label: '編輯',
        icon: 'i-heroicons-pencil-square',
        onSelect: () => handleEdit(transaction)
      },
      {
        label: '刪除',
        icon: 'i-heroicons-trash',
        class: 'text-red-500',
        onSelect: () => handleDelete(transaction.id)
      }
    ]
  ];
}
</script>
