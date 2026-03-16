import { test, expect } from '../../fixtures/auth.fixture';
import { clearFirestoreData } from '../../helpers/emulator';

test.beforeEach(async () => {
    await clearFirestoreData();
});

test('可以新增記帳本並在列表中顯示', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const bookName = '測試記帳本';

    // 確認初始狀態：無記帳本提示
    await expect(page.locator('text=還沒有記帳本')).toBeVisible();

    // 輸入名稱並提交
    await page.fill('input[placeholder="輸入記帳本名稱"]', bookName);
    await page.click('form button[type="submit"]');

    // 驗證新建的記帳本卡片出現在列表
    await expect(page.locator('h2').filter({ hasText: bookName })).toBeVisible({ timeout: 10000 });
});

test('可以連續新增多個記帳本', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const bookNames = ['帳本 A', '帳本 B'];

    for (const name of bookNames) {
        await page.fill('input[placeholder="輸入記帳本名稱"]', name);
        await page.click('form button[type="submit"]');
        await expect(page.locator('h2').filter({ hasText: name })).toBeVisible({ timeout: 10000 });
        // 等待 input 被清空，確認 handleCreateBook 已完全執行完畢
        // 避免 createBook() resolve 後清空 input 覆蓋下一輪填值的競態
        await expect(page.locator('input[placeholder="輸入記帳本名稱"]')).toHaveValue('', { timeout: 5000 });
    }

    // 兩個記帳本都在列表中
    await expect(page.locator('h2').filter({ hasText: '帳本 A' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: '帳本 B' })).toBeVisible();
});
