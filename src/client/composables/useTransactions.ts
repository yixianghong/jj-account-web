import { ref, onUnmounted } from 'vue';
import type { Transaction, Recorder } from '~/types/accounting';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, writeBatch, onSnapshot, getDoc, limit } from 'firebase/firestore';
import { useCache } from '~/composables/useCache';

export const useTransactions = (bookId: string) => {
    const { $firebase } = useNuxtApp();
    const { user, loading: authLoading } = useAuth();
    const { handleError } = useErrorHandler();
    const { set: setCache, get: getCache, has: hasCache, remove: removeCache, removePattern } = useCache();

    const transactions = ref<Transaction[]>([]);
    const loading = ref(false);
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

    // 設定即時監聽（只監聽最新的交易）
    const setupRealtimeListener = async () => {
        try {
            const hasPermission = await checkBookPermission();
            if (!hasPermission) return;

            // 先清理舊的監聽器
            cleanup();

            const transactionsRef = collection($firebase.db, 'accountBooks', bookId, 'transactions');
            const q = query(transactionsRef, orderBy('date', 'desc'), limit(50));

            unsubscribe = onSnapshot(q, (snapshot) => {
                const realtimeTransactions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Transaction[];

                // 直接更新交易記錄列表
                transactions.value = realtimeTransactions;

                // 清除相關快取
                removePattern(`transactions_${bookId}_*`);
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
            removePattern(`transactions_${bookId}_*`);
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
            removePattern(`transactions_${bookId}_*`);
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
            removePattern(`transactions_${bookId}_*`);
        } catch (error) {
            handleError(error, '刪除交易記錄失敗');
            throw error;
        }
    };

    // 更新多筆交易記錄的請款狀態
    const updateTransactionsPaymentStatus = async (recorder: Recorder, status: 'paid' | 'pending', month?: string) => {
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

            // 如果有指定月份，則只更新該月份的交易記錄
            const docsToUpdate = month
                ? querySnapshot.docs.filter(doc => {
                    const date = doc.data().date as string;
                    // 日期格式為 'YYYY-MM-DD'，月份格式為 'YYYY-MM'
                    return date.startsWith(month);
                })
                : querySnapshot.docs;

            docsToUpdate.forEach((doc) => {
                const transactionRef = doc.ref;
                batch.update(transactionRef, {
                    paymentStatus: status,
                    updatedAt: new Date().toISOString(),
                });
            });

            await batch.commit();

            // 清除快取
            removePattern(`transactions_${bookId}_*`);
        } catch (error) {
            handleError(error, '更新交易記錄請款狀態失敗');
            throw error;
        }
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
        setupRealtimeListener,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateTransactionsPaymentStatus,
        cleanup,
    };
}; 