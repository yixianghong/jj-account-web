import { ref, onUnmounted } from 'vue';
import type { Transaction, Recorder } from '~/types/accounting';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, writeBatch, onSnapshot, getDoc } from 'firebase/firestore';

export const useTransactions = (bookId: string) => {
    const { $firebase } = useNuxtApp();
    const { user, loading: authLoading } = useAuth();
    const { handleError } = useErrorHandler();
    const transactions = ref<Transaction[]>([]);
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

        try {
            const bookRef = doc($firebase.db, 'accountBooks', bookId);
            const bookDoc = await getDoc(bookRef);

            if (!bookDoc.exists()) {
                handleError('記帳本不存在');
                return false;
            }

            const bookData = bookDoc.data();
            // 檢查使用者是否為記帳本擁有者或共享使用者
            if (bookData.userId !== user.value.uid && !bookData.sharedUsers?.includes(user.value.email)) {
                handleError('沒有權限存取此記帳本');
                return false;
            }

            return true;
        } catch (error) {
            handleError(error, '檢查記帳本權限失敗');
            return false;
        }
    };

    // 載入交易記錄並設定即時監聽
    const loadTransactions = async () => {
        try {
            const hasPermission = await checkBookPermission();
            if (!hasPermission) return;

            const transactionsRef = collection($firebase.db, 'accountBooks', bookId, 'transactions');
            const q = query(transactionsRef, orderBy('date', 'desc'));

            // 設定即時監聽
            unsubscribe = onSnapshot(q, (snapshot) => {
                transactions.value = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Transaction[];
            }, (error) => {
                handleError(error, '監聽交易記錄失敗');
            });

        } catch (error) {
            handleError(error, '載入交易記錄失敗');
            throw error;
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
        } catch (error) {
            handleError(error, '更新交易記錄請款狀態失敗');
            throw error;
        }
    };

    // 根據月份過濾交易記錄
    const getTransactionsByMonth = (month: string) => {
        return transactions.value.filter(t => t.date.startsWith(month));
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
        loadTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateTransactionsPaymentStatus,
        getTransactionsByMonth,
        cleanup,
    };
}; 