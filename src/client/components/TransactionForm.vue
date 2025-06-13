<template>
  <div class="transaction-form">
    <h2 class="text-xl font-bold mb-4">新增記帳</h2>
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <UFormField label="類型">
            <USelect
              v-model="form.type"
              class="w-full"
              :items="[
                { label: '收入', value: 'income' },
                { label: '支出', value: 'expense' }
              ]"
            />
          </UFormField>
        </div>
        <div>
          <UFormField label="金額">
            <UInput
              v-model="form.amount"
              class="w-full"
              type="tel"
              inputmode="decimal"
              pattern="[0-9]*"
              required
            />
          </UFormField>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <UFormField label="分類">
            <USelect
              v-model="form.category"
              class="w-full"
              :items="CATEGORIES.map(category => ({ label: category, value: category }))"
              required
            />
          </UFormField>
        </div>
        <div>
          <UFormField label="記帳人">
            <USelect
              v-model="form.recorder"
              class="w-full"
              :items="RECORDERS.map(recorder => ({ label: recorder, value: recorder }))"
              required
            />
          </UFormField>
        </div>
      </div>

      <div>
        <UFormField label="描述">
          <UInput
            v-model="form.description"
            type="text"
            required
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <UFormField label="日期">
            <UInput
              v-model="form.date"
              type="date"
              required
              class="w-full"
            />
          </UFormField>
        </div>
        <div>
          <UFormField label="請款狀態">
            <USelect
              v-model="form.paymentStatus"
              class="w-full"
              :items="[
                { label: '未請款', value: 'pending' },
                { label: '已請款', value: 'paid' }
              ]"
              :disabled="form.type === 'income'"
            />
          </UFormField>
        </div>
      </div>

      <UButton
        type="submit"
        color="primary"
        block
      >
        新增記帳
      </UButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type {
  Transaction,
  TransactionType,
  PaymentStatus,
  Category,
  Recorder,
} from "~/types/accounting";
import { CATEGORIES, RECORDERS } from "~/types/accounting";

const emit = defineEmits<{
  (
    e: "submit",
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ): void;
}>();

const form = ref({
  type: "expense" as TransactionType,
  amount: 0,
  category: "其他" as Category,
  description: "",
  date: new Date().toISOString().split("T")[0],
  recorder: "jason" as Recorder,
  paymentStatus: "pending" as PaymentStatus,
});

// 當類型變更為收入時，自動設定為已請款
watch(
  () => form.value.type,
  (newType) => {
    if (newType === "income") {
      form.value.paymentStatus = "paid";
      form.value.category = "存款";
    }
  }
);

const handleSubmit = () => {
  emit("submit", { ...form.value });
  // 重置表單
  form.value = {
    type: "expense",
    amount: 0,
    category: "其他",
    description: "",
    date: new Date().toISOString().split("T")[0],
    recorder: "jason",
    paymentStatus: "pending",
  };
};
</script>
