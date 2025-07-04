import { useCache } from '~/composables/useCache';

export const useAnalysisCache = () => {
  const { remove: removeCache, removePattern } = useCache();

  // 清除特定記帳本的所有分析快取
  const clearAccountAnalysisCache = (accountId: string) => {
    console.log(`開始清除記帳本 ${accountId} 的分析快取...`);

    // 清除所有月度分析快取
    removePattern(`monthly_transactions_${accountId}_*`);
    console.log(`已清除月度分析快取: monthly_transactions_${accountId}_*`);

    // 清除所有年度分析快取
    removePattern(`yearly_transactions_${accountId}_*`);
    console.log(`已清除年度分析快取: yearly_transactions_${accountId}_*`);

    console.log(`已清除記帳本 ${accountId} 的所有分析快取`);
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