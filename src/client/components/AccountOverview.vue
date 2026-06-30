<template>
  <div class="rounded-3xl bg-gradient-to-br from-primary-600 to-primary-500 text-white p-5 shadow-lg shadow-primary-500/20">
    <!-- 月份切換 -->
    <div class="flex items-center justify-between mb-4">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-heroicons-chevron-left"
        class="text-white/90 hover:bg-white/15"
        aria-label="上個月"
        @click="handlePrevMonth"
      />
      <label class="relative cursor-pointer">
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
        class="text-white/90 hover:bg-white/15"
        aria-label="下個月"
        @click="handleNextMonth"
      />
    </div>

    <!-- 主結餘 -->
    <div class="text-center mb-1">
      <p class="text-sm text-white/70">本月結餘</p>
      <p class="text-4xl font-extrabold tracking-tight tabular-nums">
        ${{ monthlySummary.balance.toLocaleString() }}
      </p>
    </div>

    <!-- 收支比例條 -->
    <div class="mt-4 h-2 rounded-full bg-white/20 overflow-hidden flex">
      <div class="h-full bg-emerald-300 transition-all duration-500" :style="{ width: incomeRatio + '%' }" />
      <div class="h-full bg-rose-300 transition-all duration-500" :style="{ width: expenseRatio + '%' }" />
    </div>

    <!-- 收入 / 支出 -->
    <div class="grid grid-cols-2 gap-3 mt-4">
      <div class="rounded-2xl bg-white/10 backdrop-blur px-4 py-3">
        <div class="flex items-center gap-1.5 text-white/70 text-xs">
          <span class="w-2 h-2 rounded-full bg-emerald-300" />收入
        </div>
        <p class="text-lg font-bold tabular-nums mt-0.5">${{ monthlySummary.totalIncome.toLocaleString() }}</p>
        <p v-if="hasCarryOver" class="text-[11px] text-white/60 mt-0.5">
          含結餘 ${{ monthlySummary.totalIncomeIncludingBalance.toLocaleString() }}
        </p>
      </div>
      <div class="rounded-2xl bg-white/10 backdrop-blur px-4 py-3">
        <div class="flex items-center gap-1.5 text-white/70 text-xs">
          <span class="w-2 h-2 rounded-full bg-rose-300" />支出
        </div>
        <p class="text-lg font-bold tabular-nums mt-0.5">${{ monthlySummary.totalExpense.toLocaleString() }}</p>
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
