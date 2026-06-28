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
      <!-- 上期結餘檢查區塊 -->
      <UCard class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold mb-1">上期結餘檢查</h3>
            <p class="text-sm text-neutral-500">檢查並自動產生上期結餘</p>
          </div>
          <UButton
            color="primary"
            :loading="isCheckingBalance"
            @click="handleCheckBalance"
          >
            檢查上期結餘
          </UButton>
        </div>

        <!-- 檢查結果顯示 -->
        <div v-if="balanceCheckResult" class="mt-4">
          <!-- 可以產生 -->
          <div v-if="balanceCheckResult.status === 'can_create'" class="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-semibold text-primary-900">💡 可以產生上期結餘</p>
                <p class="text-sm text-primary-700 mt-1">
                  來自 {{ balanceCheckResult.previousMonth }} 的結餘：
                  <span class="font-bold">${{ balanceCheckResult.amount?.toLocaleString() }}</span>
                </p>
              </div>
              <UButton
                color="primary"
                size="sm"
                @click="handleGenerateBalance"
              >
                產生
              </UButton>
            </div>
          </div>

          <!-- 金額不符 -->
          <div v-else-if="balanceCheckResult.status === 'mismatch'" class="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p class="font-semibold text-warning-900">⚠️ 上期結餘金額不符</p>
            <div class="text-sm text-warning-700 mt-2 space-y-1">
              <p>預期金額（{{ balanceCheckResult.previousMonth }} 結餘）：<span class="font-bold">${{ balanceCheckResult.expected?.toLocaleString() }}</span></p>
              <p>實際記錄：<span class="font-bold">${{ balanceCheckResult.actual?.toLocaleString() }}</span></p>
              <p class="text-error-600">差異：<span class="font-bold">${{ balanceCheckResult.difference?.toLocaleString() }}</span></p>
            </div>
          </div>
        </div>
      </UCard>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <UCard class="bg-success-50 rounded-lg shadow-md flex flex-col items-center py-2">
          <div class="text-sm text-success-700">總收入</div>
          <div class="text-lg font-extrabold text-success-900 mt-1">
            ${{ monthlySummary.totalIncome.toLocaleString() }}
          </div>
          <div v-if="monthlySummary.totalIncomeIncludingBalance !== monthlySummary.totalIncome" class="text-xs text-success-600 mt-1">
            含結餘: ${{ monthlySummary.totalIncomeIncludingBalance.toLocaleString() }}
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

      <!-- 財務核對卡片 -->
      <UCard v-if="monthlySummary.totalPendingAmount > 0" class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-md p-4 mb-6">
        <h3 class="text-lg font-semibold mb-3 flex items-center">
          💵 財務核對
          <UBadge class="ml-2" color="primary" size="xs">含未請款</UBadge>
        </h3>
        
        <div class="space-y-3">
          <!-- 當前結餘 -->
          <div class="flex justify-between items-center">
            <span class="text-neutral-600">當前結餘（帳面）</span>
            <span class="text-xl font-bold text-primary-600">
              ${{ monthlySummary.balance.toLocaleString() }}
            </span>
          </div>
          
          <!-- 未請款金額 -->
          <div class="flex justify-between items-center border-t pt-2">
            <span class="text-neutral-600">未請款金額</span>
            <span class="text-lg font-semibold text-warning-600">
              +${{ monthlySummary.totalPendingAmount.toLocaleString() }}
            </span>
          </div>
          
          <!-- 應有金額 -->
          <div class="flex justify-between items-center border-t-2 border-primary-200 pt-3">
            <span class="font-semibold text-neutral-800">實際應有金額</span>
            <span class="text-2xl font-extrabold text-success-600">
              ${{ monthlySummary.expectedBalance.toLocaleString() }}
            </span>
          </div>
          
          <!-- 說明 -->
          <div class="text-xs text-neutral-500 bg-white/50 rounded p-2 mt-2">
            💡 此金額為請款後應有的總額，可用於對帳
          </div>
        </div>
      </UCard>

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

const instance = monthlyTransactionsInstance || useMonthlyTransactions();

const {
  selectedMonth,
  loading,
  loadMonthlyTransactions,
  changeMonth,
  monthlySummary
} = instance;

// 上期結餘檢查結果
interface BalanceCheckResult {
  status: string;
  amount?: number;
  message?: string;
  previousMonth?: string;
}

// 上期結餘檢查狀態
const balanceCheckResult = ref<BalanceCheckResult | null>(null);
const isCheckingBalance = ref(false);

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

const { confirm } = useConfirm();

const handleClaimAll = async (recorder: Recorder) => {
  const ok = await confirm({
    title: "批次請款",
    message: `確定要請款 ${recorder} 的所有未請款項目嗎？`,
    confirmText: "請款",
  });
  if (ok) {
    emit("claimAll", recorder);
  }
};

// 檢查並產生上期結餘
const handleCheckBalance = async () => {
  isCheckingBalance.value = true;
  try {
    const result = await instance.autoGeneratePreviousBalance?.(props.accountId);
    balanceCheckResult.value = result;
    
    // 根據結果顯示訊息
    if (result?.status === 'ok') {
      useToast().add({
        title: '✓ 上期結餘正確',
        description: `金額：$${result.amount?.toLocaleString()}`,
        color: 'success'
      });
    } else if (result?.status === 'first_month') {
      useToast().add({
        title: '提示',
        description: result.message,
        color: 'primary'
      });
    } else if (result?.status === 'warning') {
      useToast().add({
        title: '⚠️ 警告',
        description: result.message,
        color: 'warning'
      });
    }
  } catch (error) {
    console.error('檢查上期結餘失敗:', error);
    useToast().add({
      title: '錯誤',
      description: '檢查上期結餘時發生錯誤',
      color: 'error'
    });
  } finally {
    isCheckingBalance.value = false;
  }
};

// 產生上期結餘
const handleGenerateBalance = async () => {
  if (!balanceCheckResult.value || balanceCheckResult.value.status !== 'can_create') {
    return;
  }
  
  try {
    const amount = balanceCheckResult.value.amount;
    const previousMonth = balanceCheckResult.value.previousMonth;
    
    const ok = await confirm({
      title: '產生上期結餘',
      message: `確定要產生上期結餘嗎？\n金額：$${amount.toLocaleString()}\n來源：${previousMonth} 結餘`,
      confirmText: '產生',
    });
    if (ok) {
      await instance.createPreviousBalanceTransaction?.(props.accountId, amount);
      
      useToast().add({
        title: '✓ 已產生上期結餘',
        description: `金額：$${amount.toLocaleString()}（來自 ${previousMonth}）`,
        color: 'success'
      });
      
      // 清除檢查結果
      balanceCheckResult.value = null;
    }
  } catch (error) {
    console.error('產生上期結餘失敗:', error);
    useToast().add({
      title: '錯誤',
      description: '產生上期結餘時發生錯誤',
      color: 'error'
    });
  }
};
</script>
