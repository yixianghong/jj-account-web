import { ref } from 'vue'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

export const useCache = () => {
  const cache = ref<Map<string, CacheItem<any>>>(new Map())

  // 預設快取時間：5分鐘
  const DEFAULT_TTL = 5 * 60 * 1000

  // 設定快取
  const set = <T>(key: string, data: T, ttl: number = DEFAULT_TTL) => {
    cache.value.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  // 取得快取
  const get = <T>(key: string): T | null => {
    const item = cache.value.get(key)
    if (!item) return null

    // 檢查是否過期
    if (Date.now() - item.timestamp > item.ttl) {
      cache.value.delete(key)
      return null
    }

    return item.data
  }

  // 檢查快取是否存在且有效
  const has = (key: string): boolean => {
    const item = cache.value.get(key)
    if (!item) return false

    // 檢查是否過期
    if (Date.now() - item.timestamp > item.ttl) {
      cache.value.delete(key)
      return false
    }

    return true
  }

  // 刪除快取
  const remove = (key: string) => {
    cache.value.delete(key)
  }

  // 刪除符合模式的快取（支援萬用字元 *）
  const removePattern = (pattern: string) => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let deletedCount = 0;

    for (const key of cache.value.keys()) {
      if (regex.test(key)) {
        cache.value.delete(key);
        deletedCount++;
        console.log(`已刪除快取: ${key}`);
      }
    }

    console.log(`removePattern("${pattern}") 共刪除了 ${deletedCount} 個快取項目`);
  }

  // 清除所有快取
  const clear = () => {
    cache.value.clear()
  }

  // 清除過期的快取
  const cleanup = () => {
    const now = Date.now()
    for (const [key, item] of cache.value.entries()) {
      if (now - item.timestamp > item.ttl) {
        cache.value.delete(key)
      }
    }
  }

  // 定期清理過期快取（每分鐘執行一次）
  if (process.client) {
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