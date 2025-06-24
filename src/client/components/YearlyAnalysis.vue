<template>
  <div class="yearly-analysis">
    <!-- Splitwise 風格標題區 -->
    <div class="flex flex-col items-center mb-6">
      <h2 class="text-2xl font-extrabold text-center tracking-tight">年度分析</h2>
    </div>

    <!-- 月份選擇器 -->
    <div class="flex items-center justify-center mb-6">
      <div class="flex items-center space-x-2">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-chevron-left"
          @click="handlePrevMonth"
        />
        <UInput
          v-model="selectedYear"
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

    <!-- 日期範圍顯示 -->
    <div class="text-center mb-6">
      <div class="text-sm text-gray-600">
        分析期間：{{ yearlySummary.dateRange.startMonth }} 至 {{ yearlySummary.dateRange.endMonth }}
      </div>
    </div>

    <!-- 載入中狀態 -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-primary-500" />
      <span class="ml-2 text-gray-600">載入中...</span>
    </div>

    <!-- 年度統計內容 -->
    <div v-else>
      <!-- 年度統計卡片 -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <UCard class="bg-success-50 rounded-2xl shadow-md flex flex-col items-center py-4">
          <div class="text-sm text-success-700">年度總收入</div>
          <div class="text-2xl font-extrabold text-success-900 mt-1">
            ${{ yearlySummary.totalIncome.toLocaleString() }}
          </div>
        </UCard>
        <UCard class="bg-error-50 rounded-2xl shadow-md flex flex-col items-center py-4">
          <div class="text-sm text-error-700">年度總支出</div>
          <div class="text-2xl font-extrabold text-error-900 mt-1">
            ${{ yearlySummary.totalExpense.toLocaleString() }}
          </div>
        </UCard>
        <UCard class="bg-primary-50 rounded-2xl shadow-md flex flex-col items-center py-4">
          <div class="text-sm text-primary-700">年度結餘</div>
          <div class="text-2xl font-extrabold text-primary-900 mt-1">
            ${{ yearlySummary.balance.toLocaleString() }}
          </div>
        </UCard>
      </div>

      <!-- Chart.js 折線圖表 -->
      <UCard class="bg-white rounded-2xl shadow p-4 mb-6">
        <h3 class="text-lg font-semibold mb-3">近一年收支趨勢</h3>
        <div class="h-64">
          <Line
            :data="chartData"
            :options="chartOptions"
            class="w-full h-full"
          />
        </div>
      </UCard>

      <!-- 年度分類統計 -->
      <UCard class="bg-white rounded-2xl shadow p-4 mb-6">
        <h3 class="text-lg font-semibold mb-3">年度分類支出</h3>
        <div class="space-y-2">
          <div
            v-for="(amount, category) in yearlySummary.categorySummary"
            :key="category"
            class="flex justify-between items-center border-b last:border-b-0 py-2"
          >
            <span class="font-medium">{{ category }}</span>
            <span class="font-bold text-error-600">${{ amount?.toLocaleString() }}</span>
          </div>
          <div v-if="Object.keys(yearlySummary.categorySummary).length === 0" class="text-gray-400 text-center py-2">今年尚無支出</div>
        </div>
      </UCard>

      <!-- 年度記帳人統計 -->
      <UCard class="bg-white rounded-2xl shadow p-4">
        <h3 class="text-lg font-semibold mb-3">年度記帳人統計</h3>
        <div class="space-y-2">
          <div
            v-for="(amount, recorder) in yearlySummary.recorderSummary"
            :key="recorder"
            class="flex justify-between items-center border-b last:border-b-0 py-2"
          >
            <span class="font-medium">{{ recorder }}</span>
            <span class="font-bold text-primary-600">${{ amount.toLocaleString() }}</span>
          </div>
          <div v-if="Object.keys(yearlySummary.recorderSummary).length === 0" class="text-gray-400 text-center py-2">今年尚無記帳記錄</div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// 註冊 Chart.js 元件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps<{
  accountId: string;
}>();

// 使用年度交易 composable
const {
  yearlyTransactions,
  selectedYear,
  loading,
  loadYearlyTransactions,
  changeYear,
  yearlySummary
} = useYearlyTransactions();

// 初始化載入資料
onMounted(() => {
  loadYearlyTransactions(props.accountId);
});

// 監聽 accountId 變化
watch(() => props.accountId, (newAccountId) => {
  if (newAccountId) {
    loadYearlyTransactions(newAccountId);
  }
});

const handleMonthChange = () => {
  loadYearlyTransactions(props.accountId, selectedYear.value);
};

const handlePrevMonth = () => {
  const newMonth = changeYear(-1);
  loadYearlyTransactions(props.accountId, newMonth);
};

const handleNextMonth = () => {
  const newMonth = changeYear(1);
  loadYearlyTransactions(props.accountId, newMonth);
};

// Chart.js 資料配置
const chartData = computed(() => ({
  labels: yearlySummary.value.monthlyData.labels,
  datasets: [
    {
      label: '收入',
      data: yearlySummary.value.monthlyData.incomeData,
      borderColor: '#4F8A8B',
      backgroundColor: 'rgba(79, 138, 139, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#4F8A8B',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    },
    {
      label: '支出',
      data: yearlySummary.value.monthlyData.expenseData,
      borderColor: '#F08A5D',
      backgroundColor: 'rgba(240, 138, 93, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#F08A5D',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    }
  ]
}));

// Chart.js 選項配置
const chartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#4F8A8B',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: function(context: any) {
          return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
        drawBorder: false
      },
      ticks: {
        color: '#6b7280',
        maxRotation: 45,
        minRotation: 45
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
        drawBorder: false
      },
      ticks: {
        color: '#6b7280',
        callback: function(value: any) {
          return '$' + value.toLocaleString();
        }
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const
  }
};
</script> 