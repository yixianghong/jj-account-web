import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();

    const firebaseConfig = {
        apiKey: config.public.firebaseApiKey,
        authDomain: config.public.firebaseAuthDomain,
        projectId: config.public.firebaseProjectId,
        storageBucket: config.public.firebaseStorageBucket,
        messagingSenderId: config.public.firebaseMessagingSenderId,
        appId: config.public.firebaseAppId
    };

    console.log('Firebase Config:', firebaseConfig);

    // 初始化 Firebase
    const app = initializeApp(firebaseConfig);

    // 初始化 Firestore
    const db = getFirestore(app);

    // 初始化 Auth
    const auth = getAuth(app);

    // 測試 Firebase 連線
    const testFirebaseConnection = async () => {
        try {
            // 嘗試讀取一個測試集合
            const testCollection = collection(db, 'test');
            await getDocs(testCollection);
            console.log('Firebase 連線成功！');
            return true;
        } catch (error) {
            console.error('Firebase 連線失敗：', error);
            return false;
        }
    };

    return {
        provide: {
            firebase: {
                app,
                db,
                auth,
                testConnection: testFirebaseConnection
            }
        }
    };
}); 