import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';

export const useFcm = () => {
    const { $firebase } = useNuxtApp();
    const config = useRuntimeConfig();
    const toast = useToast();

    const initFcm = async (uid: string) => {
        if (!import.meta.client) return;
        if (!('Notification' in window)) return;
        if (!('serviceWorker' in navigator)) return;

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            // 取得 FCM token
            const token = await getToken($firebase.messaging, {
                vapidKey: config.public.firebaseVapidKey as string,
            });

            if (!token) return;

            // 將 token 加入 Firestore users/{uid}.fcmTokens（陣列，保留所有裝置）
            await setDoc(doc($firebase.db, 'users', uid), {
                fcmTokens: arrayUnion(token),
                updatedAt: new Date().toISOString(),
            }, { merge: true });

            // 處理 App 在前景時收到的推播（顯示 toast）
            onMessage($firebase.messaging, (payload) => {
                toast.add({
                    title: payload.notification?.title || '新通知',
                    description: payload.notification?.body,
                    color: 'info',
                    duration: 5000,
                });
            });
        } catch (error) {
            console.error('FCM 初始化失敗：', error);
        }
    };

    return { initFcm };
};
