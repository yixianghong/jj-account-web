/**
 * Playwright global setup — 在所有測試執行前清理 Emulator 並建立測試帳號
 * 前提：Firebase Emulator 必須已在 port 9099 (auth) 與 8080 (firestore) 運行
 */
const EMULATOR_AUTH = 'http://127.0.0.1:9099';
const EMULATOR_FIRESTORE = 'http://127.0.0.1:8080';
const PROJECT = 'demo-test';
const API_KEY = 'fake-api-key';

export const TEST_USER = {
    email: 'test@example.com',
    password: 'TestPassword123!',
};

async function globalSetup() {
    console.log('[global-setup] 清理 Emulator 資料...');

    // 清除所有 Auth 使用者
    await fetch(`${EMULATOR_AUTH}/emulator/v1/projects/${PROJECT}/accounts`, {
        method: 'DELETE',
    }).catch((e) => {
        throw new Error(`Firebase Auth Emulator 未啟動（port 9099）：${e.message}`);
    });

    // 清除所有 Firestore 資料
    await fetch(`${EMULATOR_FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, {
        method: 'DELETE',
    }).catch((e) => {
        throw new Error(`Firebase Firestore Emulator 未啟動（port 8080）：${e.message}`);
    });

    console.log('[global-setup] 建立測試帳號...');

    // 建立測試帳號
    const res = await fetch(
        `${EMULATOR_AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_USER.email,
                password: TEST_USER.password,
                returnSecureToken: true,
            }),
        }
    );

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`無法建立測試帳號：${body}`);
    }

    console.log('[global-setup] 完成！測試帳號已建立。');
}

export default globalSetup;
