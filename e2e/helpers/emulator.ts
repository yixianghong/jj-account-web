const EMULATOR_FIRESTORE = 'http://127.0.0.1:8080';
const PROJECT = 'demo-test';

/**
 * 清除 Firestore Emulator 中所有資料
 * 在每個測試的 beforeEach 中呼叫，確保測試資料互相獨立
 */
export async function clearFirestoreData(): Promise<void> {
    const res = await fetch(
        `${EMULATOR_FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
        { method: 'DELETE' }
    );
    if (!res.ok) {
        throw new Error(`清除 Firestore 資料失敗：${res.status}`);
    }
}
