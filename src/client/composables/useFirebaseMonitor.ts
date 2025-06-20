import { ref, computed } from 'vue'

interface ReadOperation {
  collection: string
  operation: 'get' | 'list' | 'query'
  timestamp: number
  documentCount: number
}

export const useFirebaseMonitor = () => {
  const readOperations = ref<ReadOperation[]>([])
  const isMonitoring = ref(false)

  // 開始監控
  const startMonitoring = () => {
    isMonitoring.value = true
    readOperations.value = []
  }

  // 停止監控
  const stopMonitoring = () => {
    isMonitoring.value = false
  }

  // 記錄讀取操作
  const logRead = (collection: string, operation: 'get' | 'list' | 'query', documentCount: number = 1) => {
    if (!isMonitoring.value) return

    readOperations.value.push({
      collection,
      operation,
      timestamp: Date.now(),
      documentCount
    })
  }

  // 計算總讀取次數
  const totalReads = computed(() => {
    return readOperations.value.reduce((total, op) => total + op.documentCount, 0)
  })

  // 計算今日讀取次數
  const todayReads = computed(() => {
    const today = new Date().toDateString()
    return readOperations.value
      .filter(op => new Date(op.timestamp).toDateString() === today)
      .reduce((total, op) => total + op.documentCount, 0)
  })

  // 按集合分組統計
  const readsByCollection = computed(() => {
    const stats: Record<string, number> = {}
    readOperations.value.forEach(op => {
      stats[op.collection] = (stats[op.collection] || 0) + op.documentCount
    })
    return stats
  })

  // 按操作類型分組統計
  const readsByOperation = computed(() => {
    const stats: Record<string, number> = {}
    readOperations.value.forEach(op => {
      stats[op.operation] = (stats[op.operation] || 0) + op.documentCount
    })
    return stats
  })

  // 清除監控記錄
  const clearLogs = () => {
    readOperations.value = []
  }

  // 匯出監控報告
  const exportReport = () => {
    return {
      totalReads: totalReads.value,
      todayReads: todayReads.value,
      readsByCollection: readsByCollection.value,
      readsByOperation: readsByOperation.value,
      operations: readOperations.value
    }
  }

  // 檢查是否接近免費版限制（50,000 讀取/天）
  const isNearLimit = computed(() => {
    return todayReads.value > 40000 // 80% 限制
  })

  const isOverLimit = computed(() => {
    return todayReads.value > 50000
  })

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    logRead,
    totalReads,
    todayReads,
    readsByCollection,
    readsByOperation,
    clearLogs,
    exportReport,
    isNearLimit,
    isOverLimit
  }
} 