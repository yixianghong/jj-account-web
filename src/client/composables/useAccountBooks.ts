import { ref } from 'vue';
import type { AccountBook } from '~/types/accounting';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export const useAccountBooks = () => {
    const { $firebase } = useNuxtApp();
    const accountBooks = ref<AccountBook[]>([]);

    // 載入記帳本資料
    const loadAccountBooks = async () => {
        try {
            const booksRef = collection($firebase.db, 'accountBooks');
            const q = query(booksRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            accountBooks.value = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AccountBook[];
        } catch (error) {
            console.error('載入記帳本失敗：', error);
        }
    };

    // 新增記帳本
    const createBook = async (name: string) => {
        try {
            const newBook: Omit<AccountBook, 'id'> = {
                name: name.trim(),
                transactions: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const docRef = await addDoc(collection($firebase.db, 'accountBooks'), newBook);
            const createdBook = {
                id: docRef.id,
                ...newBook
            };

            accountBooks.value.unshift(createdBook);
            return createdBook;
        } catch (error) {
            console.error('新增記帳本失敗：', error);
            throw error;
        }
    };

    // 更新記帳本
    const updateBook = async (bookId: string, updates: Partial<AccountBook>) => {
        try {
            const bookRef = doc($firebase.db, 'accountBooks', bookId);
            await updateDoc(bookRef, {
                ...updates,
                updatedAt: new Date().toISOString(),
            });

            const index = accountBooks.value.findIndex((b) => b.id === bookId);
            if (index !== -1) {
                accountBooks.value[index] = {
                    ...accountBooks.value[index],
                    ...updates,
                    updatedAt: new Date().toISOString(),
                };
            }
        } catch (error) {
            console.error('更新記帳本失敗：', error);
            throw error;
        }
    };

    // 刪除記帳本
    const deleteBook = async (bookId: string) => {
        try {
            const bookRef = doc($firebase.db, 'accountBooks', bookId);
            await deleteDoc(bookRef);
            accountBooks.value = accountBooks.value.filter((b) => b.id !== bookId);
        } catch (error) {
            console.error('刪除記帳本失敗：', error);
            throw error;
        }
    };

    // 更新記帳本中的交易記錄
    const updateBookTransactions = async (bookId: string, transactions: AccountBook['transactions']) => {
        try {
            const bookRef = doc($firebase.db, 'accountBooks', bookId);
            await updateDoc(bookRef, {
                transactions,
                updatedAt: new Date().toISOString(),
            });

            const index = accountBooks.value.findIndex((b) => b.id === bookId);
            if (index !== -1) {
                accountBooks.value[index] = {
                    ...accountBooks.value[index],
                    transactions,
                    updatedAt: new Date().toISOString(),
                };
            }
        } catch (error) {
            console.error('更新交易記錄失敗：', error);
            throw error;
        }
    };

    return {
        accountBooks,
        loadAccountBooks,
        createBook,
        updateBook,
        deleteBook,
        updateBookTransactions,
    };
}; 