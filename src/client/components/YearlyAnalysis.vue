<template>
  <div class="yearly-analysis">
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
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-3 text-center">
          <div class="flex items-center justify-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <UIcon name="i-lucide-trending-up" class="w-3.5 h-3.5" />年度收入
          </div>
          <div class="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 tabular-nums truncate">
            ${{ yearlySummary.totalIncome.toLocaleString() }}
          </div>
        </div>
        <div class="rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-3 text-center">
          <div class="flex items-center justify-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400">
            <UIcon name="i-lucide-trending-down" class="w-3.5 h-3.5" />年度支出
          </div>
          <div class="text-base sm:text-lg font-extrabold text-rose-700 dark:text-rose-300 mt-1 tabular-nums truncate">
            ${{ yearlySummary.totalExpense.toLocaleString() }}
          </div>
        </div>
        <div class="rounded-2xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 p-3 text-center">
          <div class="flex items-center justify-center gap-1 text-xs font-medium text-primary-700 dark:text-primary-400">
            <UIcon name="i-lucide-wallet" class="w-3.5 h-3.5" />年度結餘
          </div>
          <div class="text-base sm:text-lg font-extrabold text-primary-700 dark:text-primary-300 mt-1 tabular-nums truncate">
            ${{ yearlySummary.balance.toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- Chart.js 折線圖表 -->
      <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-4 mb-6">
        <h3 class="text-base font-bold mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-line-chart" class="w-4 h-4 text-primary-500" />近一年收支趨勢
        </h3>
        <div class="h-64">
          <Line
            :data="chartData"
            :options="chartOptions"
            class="w-full h-full"
          />
        </div>
      </div>

      <!-- 年度分類統計 - 圓餅圖 -->
      <div class="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm p-4 mb-6">
        <h3 class="text-base font-bold mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-chart-pie" class="w-4 h-4 text-primary-500" />年度分類支出
        </h3>
        <div v-if="Object.keys(yearlySummary.categorySummary).length === 0" class="text-gray-400 text-center py-8">今年尚無支出</div>
        <div v-else class="grid grid-cols-1 gap-6">
          <!-- 圓餅圖 -->
          <div class="h-64">
            <Pie
              :data="pieChartData"
              :options="pieChartOptions"
              class="w-full h-full"
            />
          </div>
          <!-- 分類列表 -->
          <div class="space-y-1">
            <div
              v-for="(amount, category) in yearlySummary.categorySummary"
              :key="category"
              class="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 last:border-b-0 py-2"
            >
              <span class="flex items-center gap-2 font-medium">
                <span class="w-6 h-6 shrink-0 rounded-md flex items-center justify-center" :class="getCategoryColor(category)">
                  <UIcon :name="getCategoryIcon(category)" class="w-3.5 h-3.5" />
                </span>{{ category }}
              </span>
              <span class="font-bold text-rose-600 dark:text-rose-400 tabular-nums">${{ amount?.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Line, Pie } from 'vue-chartjs';
import { getCategoryIcon, getCategoryColor } from "~/utils/category";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  type ChartOptions,
  type TooltipItem
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
  Filler,
  ArcElement
);

const props = defineProps<{
  accountId: string;
}>();

// 使用年度交易 composable
const {
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
  // 當日期選擇器變更時，重新載入資料
  loadYearlyTransactions(props.accountId, selectedYear.value);
};

// 新增監聽 selectedYear 的變化
watch(selectedYear, (newYear) => {
  if (newYear) {
    loadYearlyTransactions(props.accountId, newYear);
  }
});

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
      borderColor: '#059669',
      backgroundColor: 'rgba(5, 150, 105, 0.12)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#059669',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    },
    {
      label: '支出',
      data: yearlySummary.value.monthlyData.expenseData,
      borderColor: '#e11d48',
      backgroundColor: 'rgba(225, 29, 72, 0.10)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#e11d48',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    }
  ]
}));

// 圓餅圖資料配置
const pieChartData = computed(() => {
  const categories = Object.keys(yearlySummary.value.categorySummary);
  const amounts = Object.values(yearlySummary.value.categorySummary);
  
  // 定義顏色陣列（與主色系協調的現代調色盤）
  const colors = [
    '#0ea982', '#3b82f6', '#f59e0b', '#e11d48', '#8b5cf6', '#06b6d4',
    '#ec4899', '#10b981', '#6366f1', '#f97316', '#14b8a6', '#a855f7'
  ];

  return {
    labels: categories,
    datasets: [
      {
        data: amounts,
        backgroundColor: colors.slice(0, categories.length),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 10
      }
    ]
  };
});

// Chart.js 選項配置
const chartOptions: ChartOptions<'line'> = {
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
      borderColor: '#0ea982',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: function(context: TooltipItem<'line'>) {
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
        callback: function(value: number | string) {
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

// 圓餅圖選項配置
const pieChartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#0ea982',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: function(context: TooltipItem<'pie'>) {
          const label = context.label || '';
          const value = context.parsed;
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: $${value.toLocaleString()} (${percentage}%)`;
        }
      }
    }
  }
};
</script> 