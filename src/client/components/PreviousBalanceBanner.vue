<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <!-- 可帶入：主動提示 -->
    <div
      v-if="result?.status === 'can_create'"
      class="flex items-center gap-3 rounded-2xl bg-sky-50 border border-sky-200 px-4 py-3"
    >
      <div class="w-9 h-9 shrink-0 rounded-full bg-sky-100 flex items-center justify-center text-lg">📊</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-sky-900">偵測到上期結餘</p>
        <p class="text-xs text-sky-700 truncate">
          來自 {{ result.previousMonth }} 的結餘 ${{ result.amount?.toLocaleString() }}，要帶入本月嗎？
        </p>
      </div>
      <UButton color="primary" size="sm" :loading="generating" @click="handleGenerate">帶入</UButton>
    </div>

    <!-- 金額不符：警示 -->
    <div
      v-else-if="result?.status === 'mismatch'"
      class="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3"
    >
      <div class="w-9 h-9 shrink-0 rounded-full bg-amber-100 flex items-center justify-center text-lg">⚠️</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-amber-900">上期結餘金額不符</p>
        <p class="text-xs text-amber-700">
          應為 ${{ result.expected?.toLocaleString() }}，目前記錄 ${{ result.actual?.toLocaleString() }}
          （差 ${{ result.difference?.toLocaleString() }}）
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  accountId: string;
}>();

const monthlyTransactionsInstance = inject('monthlyTransactions') as ReturnType<typeof useMonthlyTransactions> | undefined;
const instance = monthlyTransactionsInstance || useMonthlyTransactions();
const { selectedMonth, monthlyTransactions, autoGeneratePreviousBalance, createPreviousBalanceTransaction } = instance;

interface BalanceCheckResult {
  status: string;
  amount?: number;
  expected?: number;
  actual?: number;
  difference?: number;
  previousMonth?: string;
}

const result = ref<BalanceCheckResult | null>(null);
const generating = ref(false);

// 被動檢查：月份或交易資料變動時自動重新偵測（唯讀，不寫入）
const runCheck = async () => {
  if (!props.accountId) return;
  try {
    result.value = await autoGeneratePreviousBalance?.(props.accountId) ?? null;
  } catch {
    result.value = null;
  }
};

watch([() => props.accountId, selectedMonth, monthlyTransactions], runCheck, { immediate: true, deep: true });

const handleGenerate = async () => {
  if (result.value?.status !== 'can_create' || result.value.amount == null) return;
  generating.value = true;
  try {
    await createPreviousBalanceTransaction?.(props.accountId, result.value.amount);
    useToast().add({ title: '✓ 已帶入上期結餘', color: 'success' });
    result.value = null;
  } catch {
    useToast().add({ title: '帶入上期結餘失敗', color: 'error' });
  } finally {
    generating.value = false;
  }
};
</script>
