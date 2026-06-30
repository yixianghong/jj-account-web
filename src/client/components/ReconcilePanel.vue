<template>
  <div class="space-y-4">
    <!-- 財務核對 -->
    <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5">
      <h3 class="text-base font-bold mb-4 flex items-center gap-2">
        💵 財務核對
        <UBadge v-if="summary.totalPendingAmount > 0" color="primary" variant="subtle" size="xs">含未請款</UBadge>
      </h3>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-500">當前結餘（帳面）</span>
          <span class="font-semibold tabular-nums">${{ summary.balance.toLocaleString() }}</span>
        </div>
        <div v-if="summary.totalPendingAmount > 0" class="flex justify-between items-center text-sm border-t border-gray-100 dark:border-gray-800 pt-2.5">
          <span class="text-gray-500">未請款金額</span>
          <span class="font-semibold text-amber-600 tabular-nums">+${{ summary.totalPendingAmount.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between items-center border-t-2 border-primary-100 dark:border-primary-900 pt-3">
          <span class="font-semibold">實際應有金額</span>
          <span class="text-2xl font-extrabold text-emerald-600 tabular-nums">${{ summary.expectedBalance.toLocaleString() }}</span>
        </div>
      </div>
      <p class="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2 mt-3">
        💡 此金額為請款後應有的總額，可用於對帳
      </p>
    </div>

    <!-- 未請款（依付款人） -->
    <div class="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5">
      <h3 class="text-base font-bold mb-4">未請款</h3>
      <div v-if="pendingRows.length" class="space-y-2">
        <div
          v-for="row in pendingRows"
          :key="row.recorder"
          class="flex items-center justify-between rounded-2xl bg-amber-50 dark:bg-amber-900/10 px-4 py-3"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 shrink-0 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-sm font-bold">
              {{ row.recorder.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium truncate">{{ row.recorder }}</p>
              <p class="text-xs text-amber-600 tabular-nums">${{ row.amount.toLocaleString() }}</p>
            </div>
          </div>
          <UButton color="warning" variant="soft" size="sm" @click="handleClaimAll(row.recorder)">一鍵請款</UButton>
        </div>
      </div>
      <div v-else class="text-center text-gray-400 py-6 text-sm">本月無未請款金額 🎉</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Recorder } from '~/types/accounting';

const emit = defineEmits<{
  (e: 'claimAll', recorder: Recorder): void;
}>();

const monthlyTransactionsInstance = inject('monthlyTransactions') as ReturnType<typeof useMonthlyTransactions> | undefined;
const instance = monthlyTransactionsInstance || useMonthlyTransactions();
const { monthlySummary } = instance;

const summary = monthlySummary;

const pendingRows = computed(() =>
  (Object.entries(monthlySummary.value.pendingAmountByRecorder) as [string, number][])
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([recorder, amount]) => ({ recorder, amount }))
);

const { confirm } = useConfirm();

const handleClaimAll = async (recorder: Recorder) => {
  const ok = await confirm({
    title: '批次請款',
    message: `確定要請款 ${recorder} 的所有未請款項目嗎？`,
    confirmText: '請款',
  });
  if (ok) emit('claimAll', recorder);
};
</script>
