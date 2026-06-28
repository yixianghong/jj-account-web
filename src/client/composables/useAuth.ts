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
import { useErrorHandler, resolveMessage } from '~/composables/useErrorHandler'

// 模組層級的共享狀態（單例）——所有 useAuth() 呼叫共用同一份狀態與同一個監聽器，
// 避免每次呼叫都註冊新的 onAuthStateChanged 造成記憶體洩漏與重複觸發
const user = ref<User | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
let authListenerRegistered = false

export const useAuth = () => {
    const nuxtApp = useNuxtApp()
    const { handleError } = useErrorHandler()

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

    // 確保只在客戶端執行，且整個應用程式只註冊一次認證狀態監聽器
    if (import.meta.client && !authListenerRegistered) {
        const auth = nuxtApp.$firebase?.auth
        if (auth) {
            authListenerRegistered = true
            // 監聽認證狀態
            onAuthStateChanged(auth, async (newUser) => {
                user.value = newUser
                if (newUser) {
                    await ensureUserData(newUser)
                    const { initFcm } = useFcm()
                    initFcm(newUser.uid)
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
            error.value = resolveMessage(authError, '登入失敗')
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
            error.value = resolveMessage(authError, 'Google 登入失敗')
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
            error.value = resolveMessage(authError, '註冊失敗')
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
            error.value = resolveMessage(authError, '登出失敗')
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
        }
    };

    // 等待認證狀態初始化完成（loading 由 true 轉為 false）
    // 供需要在操作前確認登入狀態的 composable 共用，避免各自重複實作
    const waitForAuth = async () => {
        if (loading.value) {
            await new Promise<void>((resolve) => {
                const unwatch = watch(loading, (newLoading) => {
                    if (!newLoading) {
                        unwatch()
                        resolve()
                    }
                })
            })
        }
    }

    return {
        user,
        loading,
        error,
        login,
        loginWithGoogle,
        register,
        logout,
        updateDisplayName,
        waitForAuth
    }
}