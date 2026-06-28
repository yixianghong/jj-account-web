import { useToast } from '#imports';

// Firebase 錯誤代碼 → 友善中文訊息
// auth/* 來自登入頁原有的對照表；其餘為 Firestore 常見錯誤（套用安全規則後 permission-denied 會更常出現）
const firebaseMessages: Record<string, string> = {
  // Auth
  'auth/invalid-email': '電子郵件格式不正確',
  'auth/user-disabled': '此帳號已被停用',
  'auth/user-not-found': '找不到此帳號',
  'auth/wrong-password': '密碼錯誤',
  'auth/invalid-credential': '電子郵件或密碼錯誤',
  'auth/too-many-requests': '登入嘗試次數過多，請稍後再試',
  'auth/network-request-failed': '網路連線失敗，請檢查網路設定',
  'auth/email-already-in-use': '此電子郵件已被註冊',
  'auth/weak-password': '密碼強度不足，請使用至少 6 個字元',
  'auth/operation-not-allowed': '此登入方式未啟用',
  'auth/popup-closed-by-user': '登入視窗已關閉',
  'auth/cancelled-popup-request': '登入請求已取消',
  'auth/popup-blocked': '登入彈窗被阻擋，請允許彈窗',
  // Firestore
  'permission-denied': '沒有權限執行此操作',
  'unauthenticated': '請先登入後再試',
  'unavailable': '網路連線失敗，請稍後再試',
  'not-found': '找不到資料',
  'already-exists': '資料已存在',
};

// 將任意錯誤轉換成適合顯示給使用者的訊息
const resolveMessage = (error: unknown, defaultMessage: string): string => {
  const code = (error as { code?: string } | null)?.code;
  // 1. 已知的 Firebase 錯誤代碼 → 友善中文
  if (code && firebaseMessages[code]) {
    return firebaseMessages[code];
  }
  // 2. 自訂的中文 Error（程式內 throw new Error('中文...')）→ 直接顯示
  if (error instanceof Error && /[一-龥]/.test(error.message)) {
    return error.message;
  }
  if (typeof error === 'string' && /[一-龥]/.test(error)) {
    return error;
  }
  // 3. 其餘（多為英文技術訊息）→ 使用呼叫端提供的友善預設訊息
  return defaultMessage;
};

export const useErrorHandler = () => {
  const toast = useToast();

  const handleError = (error: unknown, defaultMessage = '發生錯誤，請稍後再試') => {
    // 技術細節只進 console，不直接呈現給使用者
    console.error(error);

    toast.add({
      title: '錯誤',
      description: resolveMessage(error, defaultMessage),
      color: 'error',
      duration: 5000,
      icon: 'i-heroicons-exclamation-circle',
    });
  };

  return {
    handleError,
  };
};
