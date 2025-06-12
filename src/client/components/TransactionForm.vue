<template>
  <div class="transaction-form">
    <h2 class="text-xl font-bold mb-4">新增記帳</h2>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">類型</label>
          <select v-model="form.type" class="w-full p-2 border rounded">
            <option value="income">收入</option>
            <option value="expense">支出</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">金額</label>
          <input
            type="number"
            v-model="form.amount"
            class="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">分類</label>
          <input
            type="text"
            v-model="form.category"
            class="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">記帳人</label>
          <input
            type="text"
            v-model="form.recorder"
            class="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">描述</label>
        <input
          type="text"
          v-model="form.description"
          class="w-full p-2 border rounded"
          required
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">日期</label>
          <input
            type="date"
            v-model="form.date"
            class="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">請款狀態</label>
          <select
            v-model="form.paymentStatus"
            class="w-full p-2 border rounded"
          >
            <option value="pending">未請款</option>
            <option value="paid">已請款</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        新增記帳
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type {
  Transaction,
  TransactionType,
  PaymentStatus,
} from "~/types/accounting";

const emit = defineEmits<{
  (
    e: "submit",
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ): void;
}>();

const form = ref({
  type: "expense" as TransactionType,
  amount: 0,
  category: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  recorder: "",
  paymentStatus: "pending" as PaymentStatus,
});

const handleSubmit = () => {
  emit("submit", { ...form.value });
  // 重置表單
  form.value = {
    type: "expense",
    amount: 0,
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    recorder: "",
    paymentStatus: "pending",
  };
};
</script>
