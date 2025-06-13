import { ref, onUnmounted } from 'vue';
import type { Transaction, Recorder } from '~/types/accounting';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, writeBatch, onSnapshot } from 'firebase/firestore';

export const useTransactions = (bookId: string) => {
    const { $firebase } = useNuxtApp();
    const transactions = ref<Transaction[]>([]);
    let unsubscribe: (() => void) | null = null;

    // 載入交易記錄並設定即時監聽
    const loadTransactions = async () => {
        try {
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
        }
    };

    // 新增交易記錄
    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
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