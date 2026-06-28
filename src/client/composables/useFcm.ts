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

            // token 沒變就不寫 Firestore
            // v2：token 改存於 users/{uid}/private/fcm（僅本人可讀），換 key 以強制既有使用者重新註冊到新位置
            const storageKey = `fcmToken_v2_${uid}`;
            const savedToken = localStorage.getItem(storageKey);
            if (savedToken !== token) {
                await setDoc(doc($firebase.db, 'users', uid, 'private', 'fcm'), {
                    tokens: arrayUnion(token),
                    updatedAt: new Date().toISOString(),
                }, { merge: true });
                localStorage.setItem(storageKey, token);
            }

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
