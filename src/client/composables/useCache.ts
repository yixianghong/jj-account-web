interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

// 模組層級的共享快取（單例）——所有 useCache() 呼叫共用同一份快取，
// 這樣 removePattern 等失效操作才能跨 composable 生效
// （例如 useAnalysisCache 失效 useMonthlyTransactions 寫入的快取）
const cache = new Map<string, CacheItem<unknown>>()

// 預設快取時間：5分鐘
const DEFAULT_TTL = 5 * 60 * 1000

// 確保定期清理計時器只啟動一次
let cleanupTimerStarted = false

export const useCache = () => {
  // 設定快取
  const set = <T>(key: string, data: T, ttl: number = DEFAULT_TTL) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  // 取得快取
  const get = <T>(key: string): T | null => {
    const item = cache.get(key)
    if (!item) return null

    // 檢查是否過期
    if (Date.now() - item.timestamp > item.ttl) {
      cache.delete(key)
      return null
    }

    return item.data as T
  }

  // 檢查快取是否存在且有效
  const has = (key: string): boolean => {
    const item = cache.get(key)
    if (!item) return false

    // 檢查是否過期
    if (Date.now() - item.timestamp > item.ttl) {
      cache.delete(key)
      return false
    }

    return true
  }

  // 刪除快取
  const remove = (key: string) => {
    cache.delete(key)
  }

  // 刪除符合模式的快取（支援萬用字元 *）
  const removePattern = (pattern: string) => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key)
      }
    }
  }

  // 清除所有快取
  const clear = () => {
    cache.clear()
  }

  // 清除過期的快取
  const cleanup = () => {
    const now = Date.now()
    for (const [key, item] of cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        cache.delete(key)
      }
    }
  }

  // 定期清理過期快取（每分鐘執行一次）——整個應用程式只啟動一次
  if (import.meta.client && !cleanupTimerStarted) {
    cleanupTimerStarted = true
    setInterval(cleanup, 60 * 1000)
  }

  return {
    set,
    get,
    has,
    remove,
    removePattern,
    clear,
    cleanup
  }
}
