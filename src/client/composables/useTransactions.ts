import { ref, onUnmounted } from 'vue';
import type { Transaction, Recorder } from '~/types/accounting';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, writeBatch, onSnapshot, getDoc, limit, startAfter } from 'firebase/firestore';
import { useCache } from '~/composables/useCache';

export const useTransactions = (bookId: string) => {
    const { $firebase } = useNuxtApp();
    const { user, loading: authLoading } = useAuth();
    const { handleError } = useErrorHandler();
    const { set: setCache, get: getCache, has: hasCache, remove: removeCache } = useCache();
    
    const transactions = ref<Transaction[]>([]);
    const loading = ref(false);
    const hasMore = ref(true);
    const lastDoc = ref<any>(null);
    let unsubscribe: (() => void) | null = null;

    // 等待認證狀態初始化完成
    const waitForAuth = async () => {
        if (authLoading.value) {
            await new Promise<void>((resolve) => {
                const unwatch = watch(authLoading, (newLoading) => {
                    if (!newLoading) {
                        unwatch();
                        resolve();
                    }
                });
            });
        }
    };

    // 檢查記帳本權限
    const checkBookPermission = async () => {
        await waitForAuth();

        if (!user.value) {
            handleError('使用者未登入');
            return false;
        }

        // 使用快取檢查權限
        const permissionKey = `permission_${bookId}_${user.value.uid}`;
        if (hasCache(permissionKey)) {
            return getCache<boolean>(permissionKey);
        }

        try {
            const bookRef = doc($firebase.db, 'accountBooks', bookId);
            const bookDoc = await getDoc(bookRef);

            if (!bookDoc.exists()) {
                handleError('記帳本不存在');
                setCache(permissionKey, false, 10 * 60 * 1000); // 10分鐘快取
                return false;
            }

            const bookData = bookDoc.data();
            // 檢查使用者是否為記帳本擁有者或共享使用者
            const hasPermission = bookData.userId === user.value.uid || bookData.sharedUsers?.includes(user.value.email);
            
            setCache(permissionKey, hasPermission, 10 * 60 * 1000); // 10分鐘快取
            return hasPermission;
        } catch (error) {
            handleError(error, '檢查記帳本權限失敗');
            return false;
        }
    };

    // 載入交易記錄（分頁載入）
    const loadTransactions = async (pageSize: number = 20) => {
        try {
            loading.value = true;
            const hasPermission = await checkBookPermission();
            if (!hasPermission) return;

            // 檢查快取
            const cacheKey = `transactions_${bookId}_${pageSize}_${lastDoc.value?.id || 'initial'}`;
            if (hasCache(cacheKey)) {
                const cachedData = getCache<{ transactions: Transaction[], hasMore: boolean, lastDoc: any }>(cacheKey);
                if (cachedData) {
                    transactions.value = lastDoc.value ? [...transactions.value, ...cachedData.transactions] : cachedData.transactions;
                    hasMore.value = cachedData.hasMore;
                    lastDoc.value = cachedData.lastDoc;
                    return;
                }
            }

            const transactionsRef = collection($firebase.db, 'accountBooks', bookId, 'transactions');
            let q = query(transactionsRef, orderBy('date', 'desc'), limit(pageSize));
            
            if (lastDoc.value) {
                q = query(q, startAfter(lastDoc.value));
            }

            const snapshot = await getDocs(q);
            const newTransactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Transaction[];

            transactions.value = lastDoc.value ? [...transactions.value, ...newTransactions] : newTransactions;
            hasMore.value = snapshot.docs.length === pageSize;
            lastDoc.value = snapshot.docs[snapshot.docs.length - 1] || null;

            // 設定快取
            setCache(cacheKey, {
                transactions: newTransactions,
                hasMore: hasMore.value,
                lastDoc: lastDoc.value
            }, 5 * 60 * 1000); // 5分鐘快取

        } catch (error) {
            handleError(error, '載入交易記錄失敗');
            throw error;
        } finally {
            loading.value = false;
        }
    };

    // 載入更多交易記錄
    const loadMore = async (pageSize: number = 20) => {
        if (loading.value || !hasMore.value) return;
        await loadTransactions(pageSize);
    };

    // 設定即時監聽（只監聽最新的交易）
    const setupRealtimeListener = async () => {
        try {
            const hasPermission = await checkBookPermission();
            if (!hasPermission) return;

            const transactionsRef = collection($firebase.db, 'accountBooks', bookId, 'transactions');
            const q = query(transactionsRef, orderBy('date', 'desc'), limit(10)); // 只監聽最新的10筆

            unsubscribe = onSnapshot(q, (snapshot) => {
                const realtimeTransactions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Transaction[];

                // 更新現有交易記錄
                const existingIds = new Set(transactions.value.map(t => t.id));
                const newTransactions = realtimeTransactions.filter(t => !existingIds.has(t.id));
                
                if (newTransactions.length > 0) {
                    transactions.value = [...newTransactions, ...transactions.value];
                    // 清除相關快取
                    removeCache(`transactions_${bookId}_*`);
                }
            }, (error) => {
                handleError(error, '監聽交易記錄失敗');
            });

        } catch (error) {
            handleError(error, '設定即時監聽失敗');
        }
    };

    // 新增交易記錄
    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const hasPermission = await checkBookPermission();
            if (!hasPermission) return;

            const newTransaction: Omit<Transaction, 'id'> = {
                ...transaction,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const transactionsRef = collection($firebase.db, 'accountBooks', bookId, 'transactions');
            await addDoc(transactionsRef, newTransaction);
            
            // 清除快取
            removeCache(`transactions_${bookId}_*`);
        } catch (error) {
            handleError(error, '新增交易記錄失敗');
            throw error;
        }
    };

    // 更新交易記錄
    const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
        try {
            const hasPermission = await checkBookPermission();
            if (!hasPermission) return;

            const transactionRef = doc($firebase.db, 'accountBooks', bookId, 'transactions', transactionId);
            await updateDoc(transactionRef, {
                ...updates,
                updatedAt: new Date().toISOString(),
            });
            
            // 清除快取
            removeCache(`transactions_${bookId}_*`);
        } catch (error) {
            handleError(error, '更新交易記錄失敗');
            throw error;
        }
    };

    // 刪除交易記錄
    const deleteTransaction = async (transactionId: string) => {
        try {
            const hasPermission = await checkBookPermission();
            if (!hasPermission) return;

            const transactionRef = doc($firebase.db, 'accountBooks', bookId, 'transactions', transactionId);
            await deleteDoc(transactionRef);
            
            // 清除快取
            removeCache(`transactions_${bookId}_*`);
        } catch (error) {
            handleError(error, '刪除交易記錄失敗');
            throw error;
        }
    };

    // 更新多筆交易記錄的請款狀態
    const updateTransactionsPaymentStatus = async (recorder: Recorder, status: 'paid' | 'pending') => {
        try {
            const hasPermission = await checkBookPermission();
            if (!hasPermission) return;

            const transactionsRef = collection($firebase.db, 'accountBooks', bookId, 'transactions');
            const q = query(
                transactionsRef,
                where('recorder', '==', recorder),
                where('type', '==', 'expense'),
                where('paymentStatus', '==', status === 'paid' ? 'pending' : 'paid')
            );

            const querySnapshot = await getDocs(q);
            const batch = writeBatch($firebase.db);

            querySnapshot.docs.forEach((doc) => {
                const transactionRef = doc.ref;
                batch.update(transactionRef, {
                    paymentStatus: status,
                    updatedAt: new Date().toISOString(),
                });
            });

            await batch.commit();
            
            // 清除快取
            removeCache(`transactions_${bookId}_*`);
        } catch (error) {
            handleError(error, '更新交易記錄請款狀態失敗');
            throw error;
        }
    };

    // 根據月份過濾交易記錄
    const getTransactionsByMonth = (month: string) => {
        return transactions.value.filter(t => t.date.startsWith(month));
    };

    // 重置分頁狀態
    const resetPagination = () => {
        transactions.value = [];
        hasMore.value = true;
        lastDoc.value = null;
    };

    // 清理即時監聽
    const cleanup = () => {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
    };

    // 當組件卸載時清理即時監聽
    onUnmounted(() => {
        cleanup();
    });

    return {
        transactions,
        loading,
        hasMore,
        loadTransactions,
        loadMore,
        setupRealtimeListener,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateTransactionsPaymentStatus,
        getTransactionsByMonth,
        resetPagination,
        cleanup,
    };
}; 