<template>
  <div class="monthly-summary">
    <!-- Splitwise 風格標題區（含月份選擇器） -->
    <div class="flex items-center justify-center mb-6">
      <div class="flex items-center space-x-2">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-chevron-left"
          @click="handlePrevMonth"
        />
        <UInput
          v-model="selectedMonth"
          type="month"
          class="w-32"
          @change="handleMonthChange"
        />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-chevron-right"
          @click="handleNextMonth"
        />
      </div>
    </div>

    <!-- 載入中狀態 -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary-500" />
      <span class="ml-2 text-gray-600">載入中...</span>
    </div>

    <!-- 月度統計內容 -->
    <div v-else>
      <div class="grid grid-cols-3 gap-4 mb-6">
        <UCard class="bg-success-50 rounded-lg shadow-md flex flex-col items-center py-2">
          <div class="text-sm text-success-700">總收入</div>
          <div class="text-lg font-extrabold text-success-900 mt-1">
            ${{ monthlySummary.totalIncome.toLocaleString() }}
          </div>
        </UCard>
        <UCard class="bg-error-50 rounded-lg shadow-md flex flex-col items-center py-2">
          <div class="text-sm text-error-700">總支出</div>
          <div class="text-lg font-extrabold text-error-900 mt-1">
            ${{ monthlySummary.totalExpense.toLocaleString() }}
          </div>
        </UCard>
        <UCard class="bg-primary-50 rounded-lg shadow-md flex flex-col items-center py-2">
          <div class="text-sm text-primary-700">結餘</div>
          <div class="text-lg font-extrabold text-primary-900 mt-1">
            ${{ monthlySummary.balance.toLocaleString() }}
          </div>
        </UCard>
      </div>

      <UCard class="bg-white rounded-lg shadow p-2 mb-6">
        <h3 class="text-lg font-semibold mb-3">分類支出</h3>
        <div class="space-y-2">
          <div
            v-for="(amount, category) in monthlySummary.categorySummary"
            :key="category"
            class="flex justify-between items-center border-b last:border-b-0 py-2"
          >
            <span class="font-medium">{{ category }}</span>
            <span class="font-bold text-error-600">${{ amount?.toLocaleString() }}</span>
          </div>
          <div v-if="Object.keys(monthlySummary.categorySummary).length === 0" class="text-gray-400 text-center py-2">本月尚無支出</div>
        </div>
      </UCard>

      <UCard class="bg-white rounded-lg shadow p-2">
        <h3 class="text-lg font-semibold mb-3">未請款金額</h3>
        <div class="space-y-2">
          <div
            v-for="(amount, recorder) in monthlySummary.pendingAmountByRecorder"
            :key="recorder"
            class="flex justify-between items-center border-b last:border-b-0 py-2"
          >
            <div class="flex items-center space-x-2">
              <span class="font-medium">{{ recorder }}</span>
              <UButton
                v-if="amount > 0"
                color="warning"
                size="xs"
                @click="handleClaimAll(recorder as Recorder)"
              >
                一鍵請款
              </UButton>
            </div>
            <span class="font-bold text-warning-600">${{ amount.toLocaleString() }}</span>
          </div>
          <div v-if="Object.keys(monthlySummary.pendingAmountByRecorder).length === 0" class="text-gray-400 text-center py-2">本月無未請款金額</div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Recorder } from "~/types/accounting";

const props = defineProps<{
  accountId: string;
}>();

const emit = defineEmits<{
  (e: "claimAll", recorder: Recorder): void;
}>();

// 使用注入的共享月度交易 composable
const monthlyTransactionsInstance = inject('monthlyTransactions') as ReturnType<typeof useMonthlyTransactions> | undefined;

const {
  monthlyTransactions,
  selectedMonth,
  loading,
  loadMonthlyTransactions,
  changeMonth,
  monthlySummary,
  updateSelectedMonth
} = monthlyTransactionsInstance || useMonthlyTransactions();

// 初始化載入資料
onMounted(() => {
  loadMonthlyTransactions(props.accountId);
});

// 監聽 accountId 變化
watch(() => props.accountId, (newAccountId) => {
  if (newAccountId) {
    loadMonthlyTransactions(newAccountId);
  }
});

const handleMonthChange = () => {
  // 當日期選擇器變更時，重新載入資料
  loadMonthlyTransactions(props.accountId, selectedMonth.value);
};

// 新增監聽 selectedMonth 的變化
watch(selectedMonth, (newMonth) => {
  if (newMonth) {
    loadMonthlyTransactions(props.accountId, newMonth);
  }
});

const handlePrevMonth = () => {
  const newMonth = changeMonth(-1);
  loadMonthlyTransactions(props.accountId, newMonth);
};

const handleNextMonth = () => {
  const newMonth = changeMonth(1);
  loadMonthlyTransactions(props.accountId, newMonth);
};

const handleClaimAll = (recorder: Recorder) => {
  if (confirm(`確定要請款 ${recorder} 的所有未請款項目嗎？`)) {
    emit("claimAll", recorder);
  }
};
</script>
