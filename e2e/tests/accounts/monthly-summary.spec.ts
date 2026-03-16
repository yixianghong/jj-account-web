import { test, expect } from '../../fixtures/auth.fixture';
import { clearFirestoreData } from '../../helpers/emulator';
import { createBook } from '../../helpers/test-helpers';

test.beforeEach(async () => {
    await clearFirestoreData();
});

test('月度統計正確計算收入、支出與結餘', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // 建立記帳本並進入
    await createBook(page, '統計測試帳本');
    await page.locator('h2').filter({ hasText: '統計測試帳本' }).click();
    await page.waitForURL('**/account/**', { timeout: 10000 });

    // 新增收入 $100（使用 < 1000 整數避免 toLocaleString 產生逗號）
    await page.click('button[aria-label="新增記帳"]');
    await expect(page.locator('input[type="number"]')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '收入' }).click();
    await expect(page.getByRole('button', { name: /存款/ })).toBeVisible({ timeout: 5000 });
    await page.fill('input[type="number"]', '100');
    await page.fill('input[placeholder="請輸入描述"]', '月薪');
    await page.click('button:has-text("新增記帳")');
    await expect(page.locator('text=月薪')).toBeVisible({ timeout: 10000 });

    // 新增支出 $30
    await page.click('button[aria-label="新增記帳"]');
    await expect(page.locator('input[type="number"]')).toBeVisible({ timeout: 5000 });
    await page.fill('input[type="number"]', '30');
    await page.fill('input[placeholder="請輸入描述"]', '午餐');
    await page.click('button:has-text("新增記帳")');
    await expect(page.locator('text=午餐')).toBeVisible({ timeout: 10000 });

    // 驗證月度統計卡片數字
    // bg-success-50 = 總收入卡片、bg-error-50 = 總支出卡片、bg-primary-50 = 結餘卡片
    await expect(page.locator('[class*="bg-success-50"]')).toContainText('$100', { timeout: 10000 });
    await expect(page.locator('[class*="bg-error-50"]')).toContainText('$30', { timeout: 10000 });
    await expect(page.locator('[class*="bg-primary-50"]')).toContainText('$70', { timeout: 10000 });
});
