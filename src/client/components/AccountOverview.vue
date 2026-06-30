<template>
  <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-white dark:from-sky-950/20 dark:via-gray-900 dark:to-gray-900 border border-sky-100/70 dark:border-gray-800 p-5 shadow-sm">
    <div class="relative">
      <!-- 月份切換 -->
      <div class="flex items-center justify-between mb-4">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-heroicons-chevron-left"
          class="rounded-full text-gray-500 dark:text-gray-400"
          aria-label="上個月"
          @click="handlePrevMonth"
        />
        <label class="relative cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-gray-400" />
          <span class="text-base font-semibold tracking-wide">{{ monthLabel }}</span>
          <input
            v-model="selectedMonth"
            type="month"
            class="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="選擇月份"
            @change="handleMonthChange"
          >
        </label>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-heroicons-chevron-right"
          class="rounded-full text-gray-500 dark:text-gray-400"
          aria-label="下個月"
          @click="handleNextMonth"
        />
      </div>

      <!-- 主結餘 -->
      <div class="text-center mb-1">
        <p class="text-xs font-medium text-gray-400 tracking-wide">本月結餘</p>
        <p class="text-[2.75rem] leading-tight font-extrabold tracking-tight tabular-nums text-gray-900 dark:text-white">
          <span class="text-2xl font-bold align-top mr-0.5 text-gray-400">$</span>{{ monthlySummary.balance.toLocaleString() }}
        </p>
      </div>

      <!-- 收支比例條 -->
      <div class="mt-4 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
        <div class="h-full bg-emerald-500 transition-all duration-500" :style="{ width: incomeRatio + '%' }" />
        <div class="h-full bg-rose-500 transition-all duration-500" :style="{ width: expenseRatio + '%' }" />
      </div>

      <!-- 收入 / 支出 -->
      <div class="grid grid-cols-2 gap-3 mt-4">
        <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 px-4 py-3">
          <div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium">
            <span class="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
              <UIcon name="i-lucide-arrow-down-left" class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            </span>收入
          </div>
          <p class="text-lg font-bold tabular-nums mt-1 text-gray-900 dark:text-white">${{ monthlySummary.totalIncome.toLocaleString() }}</p>
          <p v-if="hasCarryOver" class="text-[11px] text-gray-400 mt-0.5">
            含結餘 ${{ monthlySummary.totalIncomeIncludingBalance.toLocaleString() }}
          </p>
        </div>
        <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 px-4 py-3">
          <div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium">
            <span class="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
              <UIcon name="i-lucide-arrow-up-right" class="w-3 h-3 text-rose-600 dark:text-rose-400" />
            </span>支出
          </div>
          <p class="text-lg font-bold tabular-nums mt-1 text-gray-900 dark:text-white">${{ monthlySummary.totalExpense.toLocaleString() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  accountId: string;
}>();

const monthlyTransactionsInstance = inject('monthlyTransactions') as ReturnType<typeof useMonthlyTransactions> | undefined;
const instance = monthlyTransactionsInstance || useMonthlyTransactions();

const { selectedMonth, monthlySummary, changeMonth, loadMonthlyTransactions } = instance;

const monthLabel = computed(() => {
  const [year, month] = selectedMonth.value.split('-');
  return `${year} 年 ${Number(month)} 月`;
});

const hasCarryOver = computed(
  () => monthlySummary.value.totalIncomeIncludingBalance !== monthlySummary.value.totalIncome
);

// 收支比例（以收入＋支出為分母）
const incomeRatio = computed(() => {
  const total = monthlySummary.value.totalIncomeIncludingBalance + monthlySummary.value.totalExpense;
  if (total === 0) return 0;
  return Math.round((monthlySummary.value.totalIncomeIncludingBalance / total) * 100);
});
const expenseRatio = computed(() => (incomeRatio.value === 0 && monthlySummary.value.totalExpense === 0 ? 0 : 100 - incomeRatio.value));

const handlePrevMonth = () => {
  const m = changeMonth(-1);
  loadMonthlyTransactions(props.accountId, m);
};
const handleNextMonth = () => {
  const m = changeMonth(1);
  loadMonthlyTransactions(props.accountId, m);
};
const handleMonthChange = () => {
  loadMonthlyTransactions(props.accountId, selectedMonth.value);
};
</script>
