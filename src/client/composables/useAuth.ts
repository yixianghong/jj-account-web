import { ref } from 'vue'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup,
    type User,
    type AuthError,
    updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useErrorHandler } from '~/composables/useErrorHandler'

export const useAuth = () => {
    const nuxtApp = useNuxtApp()
    const { handleError } = useErrorHandler()
    const user = ref<User | null>(null)
    const loading = ref(true)
    const error = ref<string | null>(null)

    // 確保使用者資料存在於 Firestore
    const ensureUserData = async (user: User) => {
        const db = nuxtApp.$firebase?.db
        if (!db) {
            handleError('Firebase 資料庫未初始化');
            return;
        }

        try {
            const userRef = doc(db, 'users', user.uid)
            const userDoc = await getDoc(userRef)

            if (!userDoc.exists()) {
                // 如果使用者資料不存在，則建立
                await setDoc(userRef, {
                    email: user.email,
                    displayName: user.displayName || null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
            }
        } catch (error) {
            handleError(error, '建立使用者資料失敗');
        }
    }

    // 確保只在客戶端執行
    if (import.meta.client) {
        const auth = nuxtApp.$firebase?.auth
        if (auth) {
            // 監聽認證狀態
            onAuthStateChanged(auth, async (newUser) => {
                user.value = newUser
                if (newUser) {
                    await ensureUserData(newUser)
                }
                loading.value = false
            }, (error) => {
                handleError(error, '認證狀態監聽失敗');
                loading.value = false
            })
        }
    }

    // 登入
    const login = async (email: string, password: string) => {
        try {
            error.value = null
            const auth = nuxtApp.$firebase?.auth
            if (!auth) {
                handleError('Firebase 認證未初始化');
                return;
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            await ensureUserData(userCredential.user)
            return userCredential.user
        } catch (e) {
            const authError = e as AuthError
            error.value = authError.message
            handleError(authError, '登入失敗');
            throw authError
        }
    }

    // Google 登入
    const loginWithGoogle = async () => {
        try {
            error.value = null
            const auth = nuxtApp.$firebase?.auth
            const googleProvider = nuxtApp.$firebase?.googleProvider
            if (!auth || !googleProvider) {
                handleError('Firebase 認證未初始化');
                return;
            }

            const userCredential = await signInWithPopup(auth, googleProvider)
            await ensureUserData(userCredential.user)
            return userCredential.user
        } catch (e) {
            const authError = e as AuthError
            error.value = authError.message
            handleError(authError, 'Google 登入失敗');
            throw authError
        }
    }

    // 註冊
    const register = async (email: string, password: string) => {
        try {
            error.value = null
            const auth = nuxtApp.$firebase?.auth
            if (!auth) {
                handleError('Firebase 認證未初始化');
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            await ensureUserData(userCredential.user)
            return userCredential.user
        } catch (e) {
            const authError = e as AuthError
            error.value = authError.message
            handleError(authError, '註冊失敗');
            throw authError
        }
    }

    // 登出
    const logout = async () => {
        try {
            error.value = null
            const auth = nuxtApp.$firebase?.auth
            if (!auth) {
                handleError('Firebase 認證未初始化');
                return;
            }

            await signOut(auth)
        } catch (e) {
            const authError = e as AuthError
            error.value = authError.message
            handleError(authError, '登出失敗');
            throw authError
        }
    }

    // 更新使用者暱稱
    const updateDisplayName = async (newDisplayName: string) => {
        if (!user.value) {
            handleError('使用者未登入');
            return;
        }

        try {
            await updateProfile(user.value, {
                displayName: newDisplayName
            });

            // 更新 Firestore 中的使用者資料
            const db = nuxtApp.$firebase?.db
            if (db) {
                const userRef = doc(db, 'users', user.value.uid)
                await setDoc(userRef, {
                    displayName: newDisplayName,
                    updatedAt: new Date().toISOString()
                }, { merge: true })
            }

            // 更新本地狀態
            user.value = {
                ...user.value,
                displayName: newDisplayName
            };
        } catch (error) {
            handleError(error, '更新暱稱失敗');
            throw error;
        }
    };

    return {
        user,
        loading,
        error,
        login,
        loginWithGoogle,
        register,
        logout,
        updateDisplayName
    }
} 