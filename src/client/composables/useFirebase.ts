import { ref } from 'vue';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import type { AccountBook, Transaction } from '~/types/accounting';

export const useFirebase = () => {
    const { $firebase } = useNuxtApp();
    const { db } = $firebase;
    const loading = ref(false);
    const error = ref<string | null>(null);

    // 取得所有記帳本
    const getAccountBooks = async (userId: string) => {
        try {
            loading.value = true;
            const q = query(
                collection(db, 'accountBooks'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AccountBook[];
        } catch (e) {
            error.value = '取得記帳本失敗';
            console.error(e);
            return [];
        } finally {
            loading.value = false;
        }
    };

    // 新增記帳本
    const addAccountBook = async (book: Omit<AccountBook, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            loading.value = true;
            const docRef = await addDoc(collection(db, 'accountBooks'), {
                ...book,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            return docRef.id;
        } catch (e) {
            error.value = '新增記帳本失敗';
            console.error(e);
            return null;
        } finally {
            loading.value = false;
        }
    };

    // 更新記帳本
    const updateAccountBook = async (id: string, data: Partial<AccountBook>) => {
        try {
            loading.value = true;
            const bookRef = doc(db, 'accountBooks', id);
            await updateDoc(bookRef, {
                ...data,
                updatedAt: Timestamp.now()
            });
            return true;
        } catch (e) {
            error.value = '更新記帳本失敗';
            console.error(e);
            return false;
        } finally {
            loading.value = false;
        }
    };

    // 刪除記帳本
    const deleteAccountBook = async (id: string) => {
        try {
            loading.value = true;
            await deleteDoc(doc(db, 'accountBooks', id));
            return true;
        } catch (e) {
            error.value = '刪除記帳本失敗';
            console.error(e);
            return false;
        } finally {
            loading.value = false;
        }
    };

    // 新增交易記錄
    const addTransaction = async (bookId: string, transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            loading.value = true;
            const docRef = await addDoc(collection(db, 'accountBooks', bookId, 'transactions'), {
                ...transaction,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            return docRef.id;
        } catch (e) {
            error.value = '新增交易記錄失敗';
            console.error(e);
            return null;
        } finally {
            loading.value = false;
        }
    };

    // 更新交易記錄
    const updateTransaction = async (bookId: string, transactionId: string, data: Partial<Transaction>) => {
        try {
            loading.value = true;
            const transactionRef = doc(db, 'accountBooks', bookId, 'transactions', transactionId);
            await updateDoc(transactionRef, {
                ...data,
                updatedAt: Timestamp.now()
            });
            return true;
        } catch (e) {
            error.value = '更新交易記錄失敗';
            console.error(e);
            return false;
        } finally {
            loading.value = false;
        }
    };

    // 刪除交易記錄
    const deleteTransaction = async (bookId: string, transactionId: string) => {
        try {
            loading.value = true;
            await deleteDoc(doc(db, 'accountBooks', bookId, 'transactions', transactionId));
            return true;
        } catch (e) {
            error.value = '刪除交易記錄失敗';
            console.error(e);
            return false;
        } finally {
            loading.value = false;
        }
    };

    return {
        loading,
        error,
        getAccountBooks,
        addAccountBook,
        updateAccountBook,
        deleteAccountBook,
        addTransaction,
        updateTransaction,
        deleteTransaction
    };
}; 