import { ref, computed } from 'vue';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { Transaction, Category, Recorder } from '~/types/accounting';
import { useCache } from '~/composables/useCache';

export const useYearlyTransactions = () => {
  const yearlyTransactions = ref<Transaction[]>([]);
  const selectedYear = ref(new Date().toISOString().slice(0, 7)); // 改為月份格式
  const loading = ref(false);
  const { set: setCache, get: getCache, has: hasCache, remove: removeCache } = useCache();

  // 計算滾動年度的開始和結束日期
  const getRollingYearRange = (endMonth: string) => {
    const [endYear, endMonthNum] = endMonth.split('-').map(Number);
    const startDate = new Date(endYear, endMonthNum - 1 - 11, 1); // 往前推11個月
    const endDate = new Date(endYear, endMonthNum, 0); // 當月最後一天
    
    return {
      startDate: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`,
      endDate: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`,
      startMonth: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
      endMonth: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`
    };
  };

  // 載入指定滾動年度的資料
  const loadYearlyTransactions = async (accountId: string, endMonth?: string) => {
    if (endMonth) {
      selectedYear.value = endMonth;
    }
    
    loading.value = true;
    try {
      // 檢查快取
      const cacheKey = `yearly_transactions_${accountId}_${selectedYear.value}`;
      if (hasCache(cacheKey)) {
        const cachedData = getCache<Transaction[]>(cacheKey);
        if (cachedData) {
          yearlyTransactions.value = cachedData;
          loading.value = false;
          return;
        }
      }

      const { $firebase } = useNuxtApp();
      const { startDate, endDate } = getRollingYearRange(selectedYear.value);

      const transactionsRef = collection($firebase.db, 'accountBooks', accountId, 'transactions');
      const q = query(
        transactionsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        } as Transaction);
      });

      yearlyTransactions.value = transactions;

      // 設定快取（15分鐘）
      setCache(cacheKey, transactions, 15 * 60 * 1000);

    } catch (error) {
      console.error('載入年度資料失敗:', error);
      yearlyTransactions.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 清除快取
  const clearCache = (accountId?: string) => {
    if (accountId) {
      // 清除特定記帳本的快取
      const cacheKey = `yearly_transactions_${accountId}_${selectedYear.value}`;
      removeCache(cacheKey);
    } else {
      // 清除所有年度快取
      const cacheKey = `yearly_transactions_${accountId}_${selectedYear.value}`;
      removeCache(cacheKey);
    }
  };

  // 切換年度（往前或往後一個月）
  const changeYear = (delta: number) => {
    const [year, month] = selectedYear.value.split("-").map(Number);
    const newDate = new Date(year, month - 1 + delta, 1);
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    selectedYear.value = newMonth;
    return newMonth;
  };

  // 計算年度統計
  const yearlySummary = computed(() => {
    const totalIncome = yearlyTransactions.value
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = yearlyTransactions.value
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const categorySummary = yearlyTransactions.value
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<Category, number>);

    const recorderSummary = yearlyTransactions.value.reduce((acc, t) => {
      acc[t.recorder] = (acc[t.recorder] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    // 生成月度資料（12個月）
    const monthlyData = {
      labels: [] as string[],
      incomeData: [] as number[],
      expenseData: [] as number[]
    };

    const { startMonth, endMonth } = getRollingYearRange(selectedYear.value);
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    const [endYear, endMonthNum] = endMonth.split('-').map(Number);

    // 生成12個月的標籤和資料
    for (let i = 0; i < 12; i++) {
      const currentDate = new Date(startYear, startMonthNum - 1 + i, 1);
      const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const monthTransactions = yearlyTransactions.value.filter(t => 
        t.date.startsWith(monthStr)
      );
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // 顯示格式：2024年1月
      const displayLabel = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
      monthlyData.labels.push(displayLabel);
      monthlyData.incomeData.push(monthIncome);
      monthlyData.expenseData.push(monthExpense);
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categorySummary,
      recorderSummary,
      monthlyData,
      dateRange: {
        startMonth,
        endMonth
      }
    };
  });

  return {
    yearlyTransactions: readonly(yearlyTransactions),
    selectedYear,
    loading: readonly(loading),
    loadYearlyTransactions,
    changeYear,
    yearlySummary,
    clearCache,
    getRollingYearRange,
    updateSelectedYear: (year: string) => {
      selectedYear.value = year;
    },
  };
}; 