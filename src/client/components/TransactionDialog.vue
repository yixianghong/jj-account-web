<template>
  <BottomSheet v-model="isOpen" :title="mode === 'add' ? '新增記帳' : '編輯記帳'">
    <TransactionForm
      v-if="book"
      :book="book"
      :initial-data="initialData"
      :submit-button-text="mode === 'add' ? '新增記帳' : '儲存變更'"
      @submit="handleSubmit"
    />
  </BottomSheet>
</template>

<script setup lang="ts">
import type { Transaction, AccountBook } from '~/types/accounting';

const props = defineProps<{
  modelValue: boolean;
  mode: 'add' | 'edit';
  book: AccountBook | null;
  initialData?: Transaction;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const handleSubmit = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
  emit('submit', transaction);
  isOpen.value = false;
};
</script>
