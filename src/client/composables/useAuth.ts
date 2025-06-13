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

export const useAuth = () => {
    const nuxtApp = useNuxtApp()
    const user = ref<User | null>(null)
    const loading = ref(true)
    const error = ref<string | null>(null)

    // 確保只在客戶端執行
    if (import.meta.client) {
        const auth = nuxtApp.$firebase?.auth
        if (auth) {
            // 監聽認證狀態
            onAuthStateChanged(auth, (newUser) => {
                user.value = newUser
                loading.value = false
            })
        }
    }

    // 登入
    const login = async (email: string, password: string) => {
        try {
            error.value = null
            const auth = nuxtApp.$firebase?.auth
            if (!auth) throw new Error('Firebase auth is not initialized')

            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            return userCredential.user
        } catch (e) {
            const authError = e as AuthError
            error.value = authError.message
            throw authError
        }
    }

    // Google 登入
    const loginWithGoogle = async () => {
        try {
            error.value = null
            const auth = nuxtApp.$firebase?.auth
            const googleProvider = nuxtApp.$firebase?.googleProvider
            if (!auth || !googleProvider) throw new Error('Firebase auth is not initialized')

            const userCredential = await signInWithPopup(auth, googleProvider)
            return userCredential.user
        } catch (e) {
            const authError = e as AuthError
            error.value = authError.message
            throw authError
        }
    }

    // 註冊
    const register = async (email: string, password: string) => {
        try {
            error.value = null
            const auth = nuxtApp.$firebase?.auth
            if (!auth) throw new Error('Firebase auth is not initialized')

            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            return userCredential.user
        } catch (e) {
            const authError = e as AuthError
            error.value = authError.message
            throw authError
        }
    }

    // 登出
    const logout = async () => {
        try {
            error.value = null
            const auth = nuxtApp.$firebase?.auth
            if (!auth) throw new Error('Firebase auth is not initialized')

            await signOut(auth)
        } catch (e) {
            const authError = e as AuthError
            error.value = authError.message
            throw authError
        }
    }

    // 更新使用者暱稱
    const updateDisplayName = async (newDisplayName: string) => {
        if (!user.value) {
            throw new Error('使用者未登入');
        }

        try {
            await updateProfile(user.value, {
                displayName: newDisplayName
            });
            // 更新本地狀態
            user.value = {
                ...user.value,
                displayName: newDisplayName
            };
        } catch (error) {
            console.error('更新暱稱失敗：', error);
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