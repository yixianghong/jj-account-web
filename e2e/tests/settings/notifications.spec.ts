import { test, expect } from '../../fixtures/auth.fixture';

// 註：FCM 實際註冊（getToken）會打 FCM 服務，emulator 不支援，故此處只測 UI 與
//     裝置支援度的判斷分支，不涵蓋真正的 token 註冊。

test('個人設定頁顯示通知設定區塊', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: '通知設定' })).toBeVisible({ timeout: 10000 });
});

test('裝置不支援推播時顯示「加入主畫面」引導（模擬 iOS Safari 分頁）', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // 載入前移除 Notification API，模擬 iOS Safari 分頁（非 standalone PWA）的不支援環境
    await page.addInitScript(() => {
        // @ts-expect-error 測試環境刻意移除以模擬不支援
        delete window.Notification;
    });

    await page.goto('/settings');

    // 應顯示引導文字，且不出現通知開關
    await expect(page.getByText('加入主畫面')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('switch')).toHaveCount(0);
});
