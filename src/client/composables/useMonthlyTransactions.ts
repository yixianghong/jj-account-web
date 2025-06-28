import { ref, computed } from 'vue';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { Transaction, Category, Recorder } from '~/types/accounting';
import { useCache } from '~/composables/useCache';

export const useMonthlyTransactions = () => {
  const monthlyTransactions = ref<Transaction[]>([]);
  const selectedMonth = ref(new Date().toISOString().slice(0, 7));
  const loading = ref(false);
  const { set: setCache, get: getCache, has: hasCache, remove: removeCache } = useCache();

  // 載入指定月份的資料
  const loadMonthlyTransactions = async (accountId: string, month?: string) => {
    if (month) {
      selectedMonth.value = month;
    }
    
    loading.value = true;
    try {
      // 檢查快取
      const cacheKey = `monthly_transactions_${accountId}_${selectedMonth.value}`;
      if (hasCache(cacheKey)) {
        const cachedData = getCache<Transaction[]>(cacheKey);
        if (cachedData) {
          monthlyTransactions.value = cachedData;
          loading.value = false;
          return;
        }
      }

      const { $firebase } = useNuxtApp();
      const [year, monthNum] = selectedMonth.value.split('-').map(Number);
      const startDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${monthNum.toString().padStart(2, '0')}-31`;

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

      monthlyTransactions.value = transactions;

      // 設定快取（10分鐘）
      setCache(cacheKey, transactions, 10 * 60 * 1000);

    } catch (error) {
      console.error('載入月度資料失敗:', error);
      monthlyTransactions.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 清除快取
  const clearCache = (accountId?: string) => {
    if (accountId) {
      // 清除特定記帳本的快取
      const cacheKey = `monthly_transactions_${accountId}_${selectedMonth.value}`;
      removeCache(cacheKey);
    } else {
      // 清除所有月度快取
      const cacheKey = `monthly_transactions_${accountId}_${selectedMonth.value}`;
      removeCache(cacheKey);
    }
  };

  // 切換月份
  const changeMonth = (delta: number) => {
    const [year, month] = selectedMonth.value.split("-").map(Number);
    const newDate = new Date(year, month - 1 + delta, 1);
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    selectedMonth.value = newMonth;
    return newMonth;
  };

  // 計算月度統計
  const monthlySummary = computed(() => {
    // 排除「上期結餘」的收入項目
    const totalIncome = monthlyTransactions.value
      .filter((t) => t.type === "income" && t.category !== "上期結餘")
      .reduce((sum, t) => sum + t.amount, 0);

    // 包含「上期結餘」的完整收入（用於顯示）
    const totalIncomeIncludingBalance = monthlyTransactions.value
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthlyTransactions.value
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const categorySummary = monthlyTransactions.value
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<Category, number>);

    const pendingAmountByRecorder = monthlyTransactions.value
      .filter((t) => t.type === "expense" && t.paymentStatus === "pending")
      .reduce((acc, t) => {
        acc[t.recorder] = (acc[t.recorder] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalIncome,
      totalIncomeIncludingBalance, // 包含上期結餘的總收入
      totalExpense,
      balance: totalIncomeIncludingBalance - totalExpense, // 結餘包含上期結餘
      categorySummary,
      pendingAmountByRecorder,
    };
  });

  return {
    monthlyTransactions: readonly(monthlyTransactions),
    selectedMonth,
    loading: readonly(loading),
    loadMonthlyTransactions,
    changeMonth,
    monthlySummary,
    clearCache,
    updateSelectedMonth: (month: string) => {
      selectedMonth.value = month;
    },
  };
}; 