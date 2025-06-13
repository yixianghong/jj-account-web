import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

    // 只提供一次 Firebase 實例
    return {
        provide: {
            firebase: {
                app,
                auth,
                db
            }
        }
    };
}); 