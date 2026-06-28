import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// 模組層級：確保前景訊息監聽只註冊一次（避免重複 toast）
let foregroundListening = false;

export type NotificationResult = 'granted' | 'denied' | 'unsupported';

export const useFcm = () => {
    const { $firebase } = useNuxtApp();
    const config = useRuntimeConfig();
    const toast = useToast();

    const storageKeyOf = (uid: string) => `fcmToken_v2_${uid}`;

    // 此裝置／瀏覽器是否支援推播
    // 註：iOS 僅在「加入主畫面」的 standalone PWA 中才有 window.Notification，
    //     Safari 分頁不具備，故此處在 iOS 分頁會自然回傳 false
    const isSupported = () =>
        import.meta.client &&
        'Notification' in window &&
        'serviceWorker' in navigator &&
        !!$firebase.messaging;

    // 目前瀏覽器通知權限（granted / denied / default）
    const permission = (): NotificationPermission =>
        import.meta.client && 'Notification' in window
            ? Notification.permission
            : 'denied';

    // 這顆裝置是否已註冊（在發送名單內）
    const isRegistered = (uid: string) =>
        import.meta.client && !!localStorage.getItem(storageKeyOf(uid));

    // 取得 token 並寫入 Firestore（前提：權限已 granted）
    const registerToken = async (uid: string) => {
        const token = await getToken($firebase.messaging!, {
            vapidKey: config.public.firebaseVapidKey as string,
        });
        if (!token) return null;

        // token 沒變就不重寫 Firestore
        const key = storageKeyOf(uid);
        if (localStorage.getItem(key) !== token) {
            await setDoc(doc($firebase.db, 'users', uid, 'private', 'fcm'), {
                tokens: arrayUnion(token),
                updatedAt: new Date().toISOString(),
            }, { merge: true });
            localStorage.setItem(key, token);
        }
        return token;
    };

    // App 在前景時收到的推播以 toast 呈現（只註冊一次）
    const listenForeground = () => {
        if (foregroundListening) return;
        foregroundListening = true;
        onMessage($firebase.messaging!, (payload) => {
            toast.add({
                title: payload.notification?.title || '新通知',
                description: payload.notification?.body,
                color: 'info',
                duration: 5000,
            });
        });
    };

    // 自動初始化：僅在「已授權」時靜默註冊，不主動要求權限
    // iOS 要求 Notification.requestPermission() 必須由使用者手勢觸發，
    // 故授權一律走 enableNotifications（由設定頁按鈕呼叫）
    const initFcm = async (uid: string) => {
        if (!isSupported()) return;
        if (Notification.permission !== 'granted') return;
        try {
            await registerToken(uid);
            listenForeground();
        } catch (error) {
            console.error('FCM 初始化失敗：', error);
        }
    };

    // 使用者手勢觸發：開啟通知（要求權限 → 註冊 token）
    const enableNotifications = async (uid: string): Promise<NotificationResult> => {
        if (!isSupported()) return 'unsupported';
        const result = await Notification.requestPermission();
        if (result !== 'granted') return 'denied';
        try {
            await registerToken(uid);
            listenForeground();
            return 'granted';
        } catch (error) {
            console.error('FCM 註冊失敗：', error);
            return 'denied';
        }
    };

    // 關閉通知：將這顆裝置的 token 移出發送名單
    const disableNotifications = async (uid: string) => {
        const key = storageKeyOf(uid);
        let token: string | null = localStorage.getItem(key);
        // localStorage 沒有時，嘗試即時取得目前 token 以便移除
        if (!token && isSupported() && Notification.permission === 'granted') {
            token = await getToken($firebase.messaging!, {
                vapidKey: config.public.firebaseVapidKey as string,
            }).catch(() => null);
        }
        if (token) {
            await setDoc(doc($firebase.db, 'users', uid, 'private', 'fcm'), {
                tokens: arrayRemove(token),
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        }
        localStorage.removeItem(key);
    };

    return {
        isSupported,
        permission,
        isRegistered,
        initFcm,
        enableNotifications,
        disableNotifications,
    };
};
