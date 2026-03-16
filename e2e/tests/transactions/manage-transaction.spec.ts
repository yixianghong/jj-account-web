import { test, expect, type Page } from '../../fixtures/auth.fixture';
import { clearFirestoreData } from '../../helpers/emulator';
import { createBook, openTransactionMenu } from '../../helpers/test-helpers';

test.beforeEach(async () => {
    await clearFirestoreData();
});

/**
 * 共用設定：建立帳本 → 進入帳本 → 新增一筆支出（500, '測試費用'）
 */
async function setupTransactionTest(page: Page): Promise<void> {
    await createBook(page, '測試帳本');
    await page.locator('h2').filter({ hasText: '測試帳本' }).click();
    await page.waitForURL('**/account/**', { timeout: 10000 });

    await page.click('button[aria-label="新增記帳"]');
    await expect(page.locator('input[type="number"]')).toBeVisible({ timeout: 5000 });
    await page.fill('input[type="number"]', '500');
    await page.fill('input[placeholder="請輸入描述"]', '測試費用');
    await page.click('button:has-text("新增記帳")');
    await expect(page.locator('text=測試費用')).toBeVisible({ timeout: 10000 });
}

test('可以編輯交易記錄', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await setupTransactionTest(page);

    // 開啟操作選單並點擊「編輯」
    await openTransactionMenu(page, '測試費用');
    await page.getByRole('menuitem', { name: '編輯' }).click();

    // 在編輯對話框內修改資料
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator('input[type="number"]').fill('800');
    await dialog.locator('input[placeholder="請輸入描述"]').fill('修改後費用');
    await dialog.getByRole('button', { name: '儲存變更' }).click();

    // 驗證交易已更新
    await expect(page.locator('text=修改後費用')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=-$800')).toBeVisible({ timeout: 10000 });
});

test('可以刪除交易記錄', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await setupTransactionTest(page);

    // 開啟操作選單並點擊「刪除」
    await openTransactionMenu(page, '測試費用');
    await page.getByRole('menuitem', { name: '刪除' }).click();
    // confirm 對話框由 fixture 的 dialog handler 自動接受

    // 驗證交易已從列表中移除
    await expect(page.locator('text=測試費用')).not.toBeVisible({ timeout: 10000 });
});

test('可以切換支出交易的請款狀態', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await setupTransactionTest(page);

    // 定位包含「測試費用」的交易列
    const row = page.locator('.space-y-2 > div').filter({ has: page.locator('text=測試費用') });

    // 初始狀態應為「未請款」
    await expect(row.locator('button').filter({ hasText: '未請款' })).toBeVisible();

    // 點擊切換為「已請款」
    await row.locator('button').filter({ hasText: '未請款' }).click();
    await expect(row.locator('button').filter({ hasText: '已請款' })).toBeVisible({ timeout: 10000 });

    // 再次點擊切換回「未請款」
    await row.locator('button').filter({ hasText: '已請款' }).click();
    await expect(row.locator('button').filter({ hasText: '未請款' })).toBeVisible({ timeout: 10000 });
});
