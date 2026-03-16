import { test, expect } from '../../fixtures/auth.fixture';
import { clearFirestoreData } from '../../helpers/emulator';

test.beforeEach(async () => {
    await clearFirestoreData();
});

test('可以新增支出交易記錄', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // 先建立記帳本
    await page.fill('input[placeholder="輸入記帳本名稱"]', '交易測試帳本');
    await page.click('form button[type="submit"]');
    const bookCard = page.locator('h2').filter({ hasText: '交易測試帳本' });
    await expect(bookCard).toBeVisible({ timeout: 10000 });

    // 進入記帳本
    await bookCard.click();
    await page.waitForURL('**/account/**', { timeout: 10000 });

    // 點擊右下角浮動新增按鈕
    await page.click('button[aria-label="新增記帳"]');

    // 等待 Modal 開啟並確認表單可見
    await expect(page.locator('input[type="number"]')).toBeVisible({ timeout: 5000 });

    // 填寫金額
    await page.fill('input[type="number"]', '500');

    // 填寫描述
    await page.fill('input[placeholder="請輸入描述"]', '午餐費用');

    // 點擊「新增記帳」提交按鈕
    await page.click('button:has-text("新增記帳")');

    // 驗證交易出現在列表中（描述文字可見）
    await expect(page.locator('text=午餐費用')).toBeVisible({ timeout: 10000 });
});
