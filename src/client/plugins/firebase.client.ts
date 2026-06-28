import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

export default defineNuxtPlugin(() => {
    // 確保只在客戶端執行
    if (import.meta.server) return;

    const config = useRuntimeConfig();

    const firebaseConfig = {
        apiKey: config.public.firebaseApiKey,
        authDomain: config.public.firebaseAuthDomain,
        projectId: config.public.firebaseProjectId,
        storageBucket: config.public.firebaseStorageBucket,
        messagingSenderId: config.public.firebaseMessagingSenderId,
        appId: config.public.firebaseAppId
    };

    // 初始化 Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const googleProvider = new GoogleAuthProvider();

    // 連接到 Firebase 本地模擬器（測試環境）
    const isEmulator = config.public.useEmulator === true || String(config.public.useEmulator) === 'true';
    if (isEmulator) {
        try { connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); } catch { /* 已連線則忽略 */ }
        try { connectFirestoreEmulator(db, '127.0.0.1', 8080); } catch { /* 已連線則忽略 */ }
    }

    // FCM 在模擬器環境下不支援，以 try/catch 包裹
    let messaging: ReturnType<typeof getMessaging> | null = null;
    try {
        messaging = getMessaging(app);
    } catch {
        // Emulator 環境無 FCM 支援，靜默忽略
    }

    // 只提供一次 Firebase 實例
    return {
        provide: {
            firebase: {
                app,
                auth,
                db,
                messaging,
                googleProvider
            }
        }
    };
});