<template>
  <div class="transaction-list">
    <div v-if="groups.length" class="space-y-5">
      <div v-for="group in groups" :key="group.date">
        <!-- 日期分組標頭 -->
        <div class="flex items-center justify-between px-1 mb-1.5">
          <span class="text-xs font-semibold text-gray-400">{{ group.label }}</span>
          <span class="text-xs text-gray-400 tabular-nums">
            <span v-if="group.income" class="text-emerald-500">+${{ group.income.toLocaleString() }}</span>
            <span v-if="group.income && group.expense" class="mx-1 text-gray-300">·</span>
            <span v-if="group.expense" class="text-rose-500">-${{ group.expense.toLocaleString() }}</span>
          </span>
        </div>

        <div class="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/60 overflow-hidden">
          <div
            v-for="transaction in group.items"
            :key="transaction.id"
            class="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
          >
            <!-- 分類圖標 -->
            <div
              class="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg"
              :class="getCategoryColor(transaction.category)"
            >{{ getCategoryIcon(transaction.category) }}</div>

            <!-- 內容 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium truncate">{{ transaction.category }}</span>
                <button
                  v-if="transaction.type === 'expense'"
                  type="button"
                  class="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full transition-colors"
                  :class="transaction.paymentStatus === 'paid'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'"
                  @click="togglePaymentStatus(transaction)"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="transaction.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'" />
                  {{ transaction.paymentStatus === 'paid' ? '已請款' : '未請款' }}
                </button>
              </div>
              <p v-if="transaction.description" class="text-sm text-gray-500 truncate">{{ transaction.description }}</p>
              <p class="text-xs text-gray-400 truncate">{{ transaction.recorder }}</p>
            </div>

            <!-- 金額 -->
            <div class="text-right shrink-0">
              <div class="font-bold tabular-nums" :class="transaction.type === 'income' ? 'text-emerald-600' : 'text-gray-800 dark:text-gray-100'">
                {{ transaction.type === 'income' ? '+' : '-' }}${{ transaction.amount.toLocaleString() }}
              </div>
            </div>

            <!-- 操作 -->
            <UDropdownMenu :items="getTransactionActions(transaction)" :popper="{ placement: 'bottom-end' }" class="!p-0">
              <UButton
                icon="i-heroicons-ellipsis-vertical"
                size="sm"
                color="neutral"
                variant="ghost"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop
              />
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </div>

    <!-- 空狀態 -->
    <div v-else class="flex flex-col items-center justify-center py-16 text-center">
      <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl mb-3">🧾</div>
      <p class="text-gray-500 font-medium">本月還沒有記帳</p>
      <p class="text-sm text-gray-400 mt-1">點右下角的 ＋ 開始記帳</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Transaction } from '~/types/accounting';
import { getCategoryIcon, getCategoryColor, formatDateGroupLabel } from '~/utils/category';

const props = defineProps<{
  transactions: Transaction[];
}>();

const emit = defineEmits<{
  (e: 'delete', id: string): void;
  (e: 'update' | 'edit', transaction: Transaction): void;
}>();

// 依日期分組（日期由新到舊）
const groups = computed(() => {
  const map = new Map<string, Transaction[]>();
  for (const t of props.transactions) {
    if (!map.has(t.date)) map.set(t.date, []);
    map.get(t.date)!.push(t);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({
      date,
      label: formatDateGroupLabel(date),
      items,
      income: items.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: items.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }));
});

const { confirm } = useConfirm();

const handleDelete = async (id: string) => {
  const ok = await confirm({
    title: '刪除記帳',
    message: '確定要刪除這筆記帳嗎？',
    confirmText: '刪除',
    color: 'error',
  });
  if (ok) emit('delete', id);
};

const togglePaymentStatus = (transaction: Transaction) => {
  if (transaction.type === 'income') return;
  emit('update', {
    ...transaction,
    paymentStatus: transaction.paymentStatus === 'paid' ? 'pending' : 'paid',
    updatedAt: new Date().toISOString(),
  });
};

const handleEdit = (transaction: Transaction) => emit('edit', transaction);

function getTransactionActions(transaction: Transaction) {
  return [[
    { label: '編輯', icon: 'i-heroicons-pencil-square', onSelect: () => handleEdit(transaction) },
    { label: '刪除', icon: 'i-heroicons-trash', class: 'text-red-500', onSelect: () => handleDelete(transaction.id) },
  ]];
}
</script>
