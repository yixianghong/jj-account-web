import { ref, computed } from 'vue';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { Transaction, Category, Recorder } from '~/types/accounting';

export const useYearlyTransactions = () => {
  const yearlyTransactions = ref<Transaction[]>([]);
  const selectedYear = ref(new Date().getFullYear().toString());
  const loading = ref(false);

  // 載入指定年度的資料
  const loadYearlyTransactions = async (accountId: string, year?: string) => {
    if (year) {
      selectedYear.value = year;
    }
    
    loading.value = true;
    try {
      const { $firebase } = useNuxtApp();
      const startDate = `${selectedYear.value}-01-01`;
      const endDate = `${selectedYear.value}-12-31`;

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
    } catch (error) {
      console.error('載入年度資料失敗:', error);
      yearlyTransactions.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 切換年度
  const changeYear = (delta: number) => {
    const newYear = parseInt(selectedYear.value) + delta;
    selectedYear.value = newYear.toString();
    return selectedYear.value;
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

    // 生成月度資料
    const monthlyData = {
      labels: [] as string[],
      incomeData: [] as number[],
      expenseData: [] as number[]
    };

    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      const monthTransactions = yearlyTransactions.value.filter(t => 
        t.date.startsWith(`${selectedYear.value}-${monthStr}`)
      );
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.labels.push(`${month}月`);
      monthlyData.incomeData.push(monthIncome);
      monthlyData.expenseData.push(monthExpense);
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categorySummary,
      recorderSummary,
      monthlyData
    };
  });

  return {
    yearlyTransactions: readonly(yearlyTransactions),
    selectedYear: readonly(selectedYear),
    loading: readonly(loading),
    loadYearlyTransactions,
    changeYear,
    yearlySummary,
  };
}; 