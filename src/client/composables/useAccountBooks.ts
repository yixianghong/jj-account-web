import { ref, onUnmounted } from 'vue';
import type { AccountBook } from '~/types/accounting';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, where, getDoc } from 'firebase/firestore';
import { useAuth } from '~/composables/useAuth';
import { useErrorHandler } from '~/composables/useErrorHandler';

export const useAccountBooks = () => {
    const { $firebase } = useNuxtApp();
    const { user, loading: authLoading } = useAuth();
    const { handleError } = useErrorHandler();
    const accountBooks = ref<AccountBook[]>([]);
    let unsubscribeOwned: (() => void) | null = null;
    let unsubscribeShared: (() => void) | null = null;

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

    // 載入記帳本資料並設定即時監聽（不包含交易記錄）
    const loadAccountBooks = async () => {
        await waitForAuth();

        if (!user.value) {
            handleError('使用者未登入');
            return;
        }

        try {
            const booksRef = collection($firebase.db, 'accountBooks');
            
            // 查詢使用者擁有的記帳本
            const ownedBooksQuery = query(
                booksRef,
                where('userId', '==', user.value.uid)
            );

            // 查詢共享給使用者的記帳本
            const sharedBooksQuery = query(
                booksRef,
                where('sharedUsers', 'array-contains', user.value.email)
            );

            // 使用 Promise 等待第一次資料載入
            await new Promise<void>((resolve) => {
                let ownedBooks: AccountBook[] = [];
                let sharedBooks: AccountBook[] = [];
                let ownedLoaded = false;
                let sharedLoaded = false;

                // 監聽使用者擁有的記帳本
                unsubscribeOwned = onSnapshot(ownedBooksQuery, (snapshot) => {
                    const books = snapshot.docs.map(doc => {
                        const bookData = doc.data();
                        return {
                            id: doc.id,
                            name: bookData.name,
                            userId: bookData.userId,
                            sharedUsers: bookData.sharedUsers || [],
                            transactions: [], // 不載入交易記錄，節省讀取次數
                            createdAt: bookData.createdAt,
                            updatedAt: bookData.updatedAt,
                            lastUpdatedBy: bookData.lastUpdatedBy
                        } as AccountBook;
                    });

                    ownedBooks = books;
                    ownedLoaded = true;

                    // 合併兩個查詢的結果
                    if (ownedLoaded && sharedLoaded) {
                        const allBooks = [...ownedBooks, ...sharedBooks];
                        // 根據建立時間排序
                        accountBooks.value = allBooks.sort((a, b) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        );
                        resolve();
                    }
                }, (error) => {
                    console.error('監聽擁有的記帳本失敗：', error);
                    ownedLoaded = true;
                    if (ownedLoaded && sharedLoaded) {
                        resolve();
                    }
                });

                // 監聽共享的記帳本
                unsubscribeShared = onSnapshot(sharedBooksQuery, (snapshot) => {
                    const books = snapshot.docs.map(doc => {
                        const bookData = doc.data();
                        return {
                            id: doc.id,
                            name: bookData.name,
                            userId: bookData.userId,
                            sharedUsers: bookData.sharedUsers || [],
                            transactions: [], // 不載入交易記錄，節省讀取次數
                            createdAt: bookData.createdAt,
                            updatedAt: bookData.updatedAt,
                            lastUpdatedBy: bookData.lastUpdatedBy
                        } as AccountBook;
                    });

                    sharedBooks = books;
                    sharedLoaded = true;

                    // 合併兩個查詢的結果
                    if (ownedLoaded && sharedLoaded) {
                        const allBooks = [...ownedBooks, ...sharedBooks];
                        // 根據建立時間排序
                        accountBooks.value = allBooks.sort((a, b) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        );
                        resolve();
                    }
                }, (error) => {
                    console.error('監聽共享的記帳本失敗：', error);
                    sharedLoaded = true;
                    if (ownedLoaded && sharedLoaded) {
                        resolve();
                    }
                });
            });

        } catch (error) {
            handleError(error, '載入記帳本失敗');
        }
    };

    // 新增記帳本
    const createBook = async (name: string) => {
        await waitForAuth();

        if (!user.value) {
            handleError('使用者未登入');
            return;
        }

        try {
            const newBook: Omit<AccountBook, 'id'> = {
                name: name.trim(),
                userId: user.value.uid,
                sharedUsers: [],
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
            handleError(error, '新增記帳本失敗');
        }
    };

    // 新增共享使用者
    const addSharedUser = async (bookId: string, email: string) => {
        await waitForAuth();

        if (!user.value) {
            handleError('使用者未登入');
            return;
        }

        try {
            // 檢查記帳本是否存在且使用者有權限
            const bookRef = doc($firebase.db, 'accountBooks', bookId);
            const bookDoc = await getDoc(bookRef);

            if (!bookDoc.exists()) {
                throw new Error('記帳本不存在');
            }

            const bookData = bookDoc.data() as AccountBook;
            if (bookData.userId !== user.value.uid) {
                throw new Error('沒有權限修改此記帳本');
            }

            // 確保 sharedUsers 是陣列
            const currentSharedUsers = Array.isArray(bookData.sharedUsers) ? bookData.sharedUsers : [];

            // 檢查是否已經共享
            if (currentSharedUsers.includes(email)) {
                throw new Error('此使用者已經有權限存取此記帳本');
            }

            // 更新記帳本的共享使用者列表
            await updateDoc(bookRef, {
                sharedUsers: [...currentSharedUsers, email],
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            handleError(error, '新增共享使用者失敗');
        }
    };

    // 移除共享使用者
    const removeSharedUser = async (bookId: string, email: string) => {
        await waitForAuth();

        if (!user.value) {
            handleError('使用者未登入');
            return;
        }

        try {
            // 檢查記帳本是否存在且使用者有權限
            const bookRef = doc($firebase.db, 'accountBooks', bookId);
            const bookDoc = await getDoc(bookRef);

            if (!bookDoc.exists()) {
                throw new Error('記帳本不存在');
            }

            const bookData = bookDoc.data() as AccountBook;
            if (bookData.userId !== user.value.uid) {
                throw new Error('沒有權限修改此記帳本');
            }

            // 更新記帳本的共享使用者列表
            await updateDoc(bookRef, {
                sharedUsers: bookData.sharedUsers.filter(e => e !== email),
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            handleError(error, '移除共享使用者失敗');
        }
    };

    // 更新記帳本
    const updateBook = async (bookId: string, updates: Partial<AccountBook>) => {
        await waitForAuth();

        if (!user.value) {
            handleError('使用者未登入');
            return;
        }

        const bookRef = doc($firebase.db, 'accountBooks', bookId);
        const bookDoc = await getDoc(bookRef);

        if (!bookDoc.exists()) {
            throw new Error('記帳本不存在');
        }

        const bookData = bookDoc.data();
        if (bookData.userId !== user.value.uid) {
            throw new Error('沒有權限修改此記帳本');
        }

        await updateDoc(bookRef, {
            ...updates,
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: user.value.displayName || user.value.email
        });
    };

    // 刪除記帳本
    const deleteBook = async (bookId: string) => {
        await waitForAuth();

        if (!user.value) {
            handleError('使用者未登入');
            return;
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
            handleError(error, '刪除記帳本失敗');
        }
    };

    // 清理即時監聽
    const cleanup = () => {
        if (unsubscribeOwned) {
            unsubscribeOwned();
            unsubscribeOwned = null;
        }
        if (unsubscribeShared) {
            unsubscribeShared();
            unsubscribeShared = null;
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
        addSharedUser,
        removeSharedUser,
        cleanup
    };
}; 