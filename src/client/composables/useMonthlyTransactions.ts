import { ref, computed } from 'vue';
import { collection, query, where, orderBy, getDocs, addDoc } from 'firebase/firestore';
import type { Transaction, Category } from '~/types/accounting';
import { useCache } from '~/composables/useCache';

export const useMonthlyTransactions = () => {
  const monthlyTransactions = ref<Transaction[]>([]);
  const selectedMonth = ref(new Date().toISOString().slice(0, 7));
  const loading = ref(false);
  const { set: setCache, get: getCache, has: hasCache, removePattern } = useCache();

  // 輔助函數：取得上個月的月份字串
  const getPreviousMonth = (month: string): string => {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1 - 1, 1); // 往前一個月
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // 輔助函數：載入指定月份的交易記錄（不使用快取）
  const loadMonthTransactionsWithoutCache = async (accountId: string, month: string): Promise<Transaction[]> => {
    try {
      const { $firebase } = useNuxtApp();
      const [year, monthNum] = month.split('-').map(Number);
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

      return transactions;
    } catch (error) {
      console.error('載入月度資料失敗:', error);
      return [];
    }
  };

  // 輔助函數：計算指定月份的結餘
  const calculateMonthBalance = async (accountId: string, month: string): Promise<number> => {
    const transactions = await loadMonthTransactionsWithoutCache(accountId, month);

    // 計算該月收入（包含上期結餘）
    const totalIncomeIncludingBalance = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // 計算該月支出
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // 結餘 = 收入（含上期結餘）- 支出
    return totalIncomeIncludingBalance - totalExpense;
  };

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
      // 清除特定記帳本的所有月度快取
      removePattern(`monthly_transactions_${accountId}_*`);
    } else {
      // 清除所有月度快取
      removePattern(`monthly_transactions_*`);
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

  // 核心函數：自動產生上期結餘
  const autoGeneratePreviousBalance = async (accountId: string) => {
    try {
      const currentMonth = selectedMonth.value;

      // 1. 檢查當月是否已有上期結餘
      const existingBalances = monthlyTransactions.value.filter(
        t => t.type === 'income' && t.category === '上期結餘'
      );

      // 2. 如果有多筆上期結餘，發出警告
      if (existingBalances.length > 1) {
        return {
          status: 'warning',
          message: `發現 ${existingBalances.length} 筆上期結餘記錄，建議只保留一筆`
        };
      }

      // 3. 計算上個月的結餘
      const previousMonth = getPreviousMonth(currentMonth);

      // 檢查上個月是否有交易記錄（判斷是否為第一個月）
      const previousTransactions = await loadMonthTransactionsWithoutCache(accountId, previousMonth);
      if (previousTransactions.length === 0) {
        return {
          status: 'first_month',
          message: '這是第一個月，無需產生上期結餘'
        };
      }

      // 計算上個月結餘
      const previousMonthBalance = await calculateMonthBalance(accountId, previousMonth);

      // 4. 如果沒有上期結餘，可以產生
      if (existingBalances.length === 0) {
        return {
          status: 'can_create',
          amount: previousMonthBalance,
          previousMonth
        };
      }

      // 5. 如果有上期結餘，檢查金額是否正確
      const existingBalance = existingBalances[0];
      if (existingBalance.amount !== previousMonthBalance) {
        return {
          status: 'mismatch',
          expected: previousMonthBalance,
          actual: existingBalance.amount,
          difference: previousMonthBalance - existingBalance.amount,
          previousMonth
        };
      }

      return {
        status: 'ok',
        amount: previousMonthBalance
      };
    } catch (error) {
      console.error('檢查上期結餘失敗:', error);
      return {
        status: 'error',
        message: '檢查上期結餘時發生錯誤'
      };
    }
  };

  // 產生上期結餘交易記錄
  const createPreviousBalanceTransaction = async (accountId: string, amount: number) => {
    try {
      const { $firebase } = useNuxtApp();
      const currentMonth = selectedMonth.value;
      const previousMonth = getPreviousMonth(currentMonth);

      const transaction: Omit<Transaction, 'id'> = {
        type: 'income',
        amount: amount,
        category: '上期結餘',
        description: `${previousMonth} 結轉`,
        date: `${currentMonth}-01`,
        recorder: 'System',
        paymentStatus: 'paid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const transactionsRef = collection($firebase.db, 'accountBooks', accountId, 'transactions');
      await addDoc(transactionsRef, transaction);

      // 清除快取並重新載入
      removePattern(`monthly_transactions_${accountId}_*`);
      await loadMonthlyTransactions(accountId, currentMonth);

      return {
        status: 'success',
        amount,
        previousMonth
      };
    } catch (error) {
      console.error('產生上期結餘失敗:', error);
      throw error;
    }
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

    // 計算總未請款金額
    const totalPendingAmount = Object.values(pendingAmountByRecorder)
      .reduce((sum, amount) => sum + amount, 0);

    // 計算實際應有金額（含未請款）= 結餘 + 未請款金額
    const balance = totalIncomeIncludingBalance - totalExpense;
    const expectedBalance = balance + totalPendingAmount;

    return {
      totalIncome,
      totalIncomeIncludingBalance, // 包含上期結餘的總收入
      totalExpense,
      balance, // 結餘包含上期結餘
      categorySummary,
      pendingAmountByRecorder,
      totalPendingAmount, // 總未請款金額
      expectedBalance, // 實際應有金額（含未請款）
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
    autoGeneratePreviousBalance,
    createPreviousBalanceTransaction,
  };
}; 