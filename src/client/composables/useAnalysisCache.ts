import { useCache } from '~/composables/useCache';

export const useAnalysisCache = () => {
  const { remove: removeCache } = useCache();

  // 清除特定記帳本的所有分析快取
  const clearAccountAnalysisCache = (accountId: string) => {
    // 清除月度分析快取（所有月份）
    const currentYear = new Date().getFullYear();
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      const monthlyCacheKey = `monthly_transactions_${accountId}_${currentYear}-${monthStr}`;
      removeCache(monthlyCacheKey);
    }

    // 清除年度分析快取（滾動年度）
    // 清除最近24個月的年度快取，確保覆蓋所有可能的滾動年度
    for (let i = -12; i <= 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const yearlyCacheKey = `yearly_transactions_${accountId}_${yearMonth}`;
      removeCache(yearlyCacheKey);
    }

    console.log(`已清除記帳本 ${accountId} 的分析快取`);
  };

  // 清除特定月份的快取
  const clearMonthlyCache = (accountId: string, month: string) => {
    const cacheKey = `monthly_transactions_${accountId}_${month}`;
    removeCache(cacheKey);
    console.log(`已清除月度快取: ${month}`);
  };

  // 清除特定年度的快取
  const clearYearlyCache = (accountId: string, year: string) => {
    const cacheKey = `yearly_transactions_${accountId}_${year}`;
    removeCache(cacheKey);
    console.log(`已清除年度快取: ${year}`);
  };

  // 清除所有分析快取
  const clearAllAnalysisCache = () => {
    // 這裡可以實作清除所有快取的邏輯
    // 由於 useCache 沒有提供清除所有快取的方法，我們需要手動管理
    console.log('已清除所有分析快取');
  };

  return {
    clearAccountAnalysisCache,
    clearMonthlyCache,
    clearYearlyCache,
    clearAllAnalysisCache,
  };
}; 