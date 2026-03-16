import { test, expect } from '../../fixtures/auth.fixture';
import { clearFirestoreData } from '../../helpers/emulator';
import { createBook } from '../../helpers/test-helpers';

test.beforeEach(async () => {
    await clearFirestoreData();
});

test('可以新增收入交易記錄', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // 建立記帳本並進入
    await createBook(page, '收入測試帳本');
    await page.locator('h2').filter({ hasText: '收入測試帳本' }).click();
    await page.waitForURL('**/account/**', { timeout: 10000 });

    // 點擊右下角浮動新增按鈕
    await page.click('button[aria-label="新增記帳"]');
    await expect(page.locator('input[type="number"]')).toBeVisible({ timeout: 5000 });

    // 切換為收入類型
    await page.getByRole('button', { name: '收入' }).click();

    // 等待分類按鈕更新為收入分類，並點選「存款」（收入時自動選中）
    await expect(page.getByRole('button', { name: /存款/ })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /存款/ }).click();

    // 填寫金額和描述
    await page.fill('input[type="number"]', '500');
    await page.fill('input[placeholder="請輸入描述"]', '月薪收入');

    // 提交
    await page.click('button:has-text("新增記帳")');

    // 驗證收入交易出現在列表中
    await expect(page.locator('text=月薪收入')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=+$500')).toBeVisible({ timeout: 10000 });
});
