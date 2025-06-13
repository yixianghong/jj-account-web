import { ref, onUnmounted } from 'vue';
import type { Transaction, Recorder } from '~/types/accounting';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, writeBatch, onSnapshot, getDoc } from 'firebase/firestore';

export const useTransactions = (bookId: string) => {
    const { $firebase } = useNuxtApp();
    const { user, loading: authLoading } = useAuth();
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
            throw new Error('使用者未登入');
        }

        const bookRef = doc($firebase.db, 'accountBooks', bookId);
        const bookDoc = await getDoc(bookRef);

        if (!bookDoc.exists()) {
            throw new Error('記帳本不存在');
        }

        const bookData = bookDoc.data();
        // 檢查使用者是否為記帳本擁有者或共享使用者
        if (bookData.userId !== user.value.uid && !bookData.sharedUsers?.includes(user.value.email)) {
            throw new Error('沒有權限存取此記帳本');
        }
    };

    // 載入交易記錄並設定即時監聽
    const loadTransactions = async () => {
        try {
            await checkBookPermission();

            const transactionsRef = collection($firebase.db, 'accountBooks', bookId, 'transactions');
            const q = query(transactionsRef, orderBy('date', 'desc'));

            // 設定即時監聽
            unsubscribe = onSnapshot(q, (snapshot) => {
                transactions.value = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Transaction[];
            }, (error) => {
                console.error('監聽交易記錄失敗：', error);
            });

        } catch (error) {
            console.error('載入交易記錄失敗：', error);
            throw error;
        }
    };

    // 新增交易記錄
    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            await checkBookPermission();

            const newTransaction: Omit<Transaction, 'id'> = {
                ...transaction,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const transactionsRef = collection($firebase.db, 'accountBooks', bookId, 'transactions');
            await addDoc(transactionsRef, newTransaction);
        } catch (error) {
            console.error('新增交易記錄失敗：', error);
            throw error;
        }
    };

    // 更新交易記錄
    const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
        try {
            await checkBookPermission();

            const transactionRef = doc($firebase.db, 'accountBooks', bookId, 'transactions', transactionId);
            await updateDoc(transactionRef, {
                ...updates,
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('更新交易記錄失敗：', error);
            throw error;
        }
    };

    // 刪除交易記錄
    const deleteTransaction = async (transactionId: string) => {
        try {
            await checkBookPermission();

            const transactionRef = doc($firebase.db, 'accountBooks', bookId, 'transactions', transactionId);
            await deleteDoc(transactionRef);
        } catch (error) {
            console.error('刪除交易記錄失敗：', error);
            throw error;
        }
    };

    // 更新多筆交易記錄的請款狀態
    const updateTransactionsPaymentStatus = async (recorder: Recorder, status: 'paid' | 'pending') => {
        try {
            await checkBookPermission();

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
            console.error('更新交易記錄請款狀態失敗：', error);
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