import { ref, onUnmounted } from 'vue';
import type { AccountBook } from '~/types/accounting';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, where, getDoc } from 'firebase/firestore';

export const useAccountBooks = () => {
    const { $firebase } = useNuxtApp();
    const { user, loading: authLoading } = useAuth();
    const accountBooks = ref<AccountBook[]>([]);
    let unsubscribe: (() => void) | null = null;

    // 載入記帳本資料並設定即時監聽
    const loadAccountBooks = async () => {
        // 等待認證狀態初始化完成
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

        if (!user.value) {
            console.error('使用者未登入');
            return;
        }

        try {
            const booksRef = collection($firebase.db, 'accountBooks');
            const q = query(
                booksRef,
                where('userId', '==', user.value.uid),
                orderBy('createdAt', 'desc')
            );

            // 使用 Promise 等待第一次資料載入
            await new Promise<void>((resolve) => {
                // 設定即時監聽
                unsubscribe = onSnapshot(q, (snapshot) => {
                    accountBooks.value = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as AccountBook[];
                    // 第一次資料載入完成後，解析 Promise
                    resolve();
                }, (error) => {
                    console.error('監聽記帳本失敗：', error);
                    resolve(); // 即使發生錯誤也要解析 Promise
                });
            });

        } catch (error) {
            console.error('載入記帳本失敗：', error);
        }
    };

    // 新增記帳本
    const createBook = async (name: string) => {
        // 等待認證狀態初始化完成
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

        if (!user.value) {
            throw new Error('使用者未登入');
        }

        try {
            const newBook: Omit<AccountBook, 'id'> = {
                name: name.trim(),
                userId: user.value.uid,
                transactions: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const docRef = await addDoc(collection($firebase.db, 'accountBooks'), newBook);
            return {
                id: docRef.id,
                ...newBook
            } as AccountBook;
        } catch (error) {
            console.error('新增記帳本失敗：', error);
            throw error;
        }
    };

    // 更新記帳本
    const updateBook = async (bookId: string, updates: Partial<AccountBook>) => {
        // 等待認證狀態初始化完成
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

        if (!user.value) {
            throw new Error('使用者未登入');
        }

        try {
            const bookRef = doc($firebase.db, 'accountBooks', bookId);
            const bookDoc = await getDoc(bookRef);

            if (!bookDoc.exists()) {
                throw new Error('記帳本不存在');
            }

            const bookData = bookDoc.data() as AccountBook;
            if (bookData.userId !== user.value.uid) {
                throw new Error('沒有權限修改此記帳本');
            }

            await updateDoc(bookRef, {
                ...updates,
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('更新記帳本失敗：', error);
            throw error;
        }
    };

    // 刪除記帳本
    const deleteBook = async (bookId: string) => {
        // 等待認證狀態初始化完成
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

        if (!user.value) {
            throw new Error('使用者未登入');
        }

        try {
            const bookRef = doc($firebase.db, 'accountBooks', bookId);
            const bookDoc = await getDoc(bookRef);

            if (!bookDoc.exists()) {
                throw new Error('記帳本不存在');
            }

            const bookData = bookDoc.data() as AccountBook;
            if (bookData.userId !== user.value.uid) {
                throw new Error('沒有權限刪除此記帳本');
            }

            await deleteDoc(bookRef);
        } catch (error) {
            console.error('刪除記帳本失敗：', error);
            throw error;
        }
    };

    // 更新記帳本中的交易記錄
    const updateBookTransactions = async (bookId: string, transactions: AccountBook['transactions']) => {
        // 等待認證狀態初始化完成
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

        if (!user.value) {
            throw new Error('使用者未登入');
        }

        try {
            const bookRef = doc($firebase.db, 'accountBooks', bookId);
            const bookDoc = await getDoc(bookRef);

            if (!bookDoc.exists()) {
                throw new Error('記帳本不存在');
            }

            const bookData = bookDoc.data() as AccountBook;
            if (bookData.userId !== user.value.uid) {
                throw new Error('沒有權限修改此記帳本');
            }

            await updateDoc(bookRef, {
                transactions,
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('更新交易記錄失敗：', error);
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
        accountBooks,
        loadAccountBooks,
        createBook,
        updateBook,
        deleteBook,
        updateBookTransactions,
        cleanup,
    };
}; 