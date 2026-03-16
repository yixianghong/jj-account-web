import { test, expect } from '../../fixtures/auth.fixture';
import { clearFirestoreData } from '../../helpers/emulator';
import { createBook, openBookMenu } from '../../helpers/test-helpers';

test.beforeEach(async () => {
    await clearFirestoreData();
});

test('可以編輯記帳本名稱', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await createBook(page, '原始名稱');

    // 開啟操作選單並點擊「編輯」
    await openBookMenu(page, '原始名稱');
    await page.getByRole('menuitem', { name: '編輯' }).click();

    // 在對話框內修改名稱（避免與頁面上的新增表單 input 衝突）
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator('input[placeholder="輸入記帳本名稱"]').fill('新名稱');
    await dialog.getByRole('button', { name: '儲存' }).click();

    // 驗證名稱更新
    await expect(page.locator('h2').filter({ hasText: '新名稱' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2').filter({ hasText: '原始名稱' })).not.toBeVisible();
});

test('可以刪除記帳本', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await createBook(page, '要刪除的帳本');

    // 開啟操作選單並點擊「刪除」
    await openBookMenu(page, '要刪除的帳本');
    await page.getByRole('menuitem', { name: '刪除' }).click();
    // confirm 對話框由 fixture 的 dialog handler 自動接受

    // 驗證帳本已刪除，顯示空狀態提示
    await expect(page.locator('h2').filter({ hasText: '要刪除的帳本' })).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=還沒有記帳本')).toBeVisible();
});

test('可以共享記帳本給其他使用者', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await createBook(page, '共享測試帳本');

    // 開啟操作選單並點擊「共享」
    await openBookMenu(page, '共享測試帳本');
    await page.getByRole('menuitem', { name: '共享' }).click();

    // 在共享對話框中填入 email 並提交
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator('input[type="email"]').fill('shared@example.com');
    await dialog.getByRole('button', { name: '新增' }).click();

    // 驗證卡片出現共享使用者頭像（'S' 為 shared@example.com 首字母）
    const bookCard = page.locator('.group').filter({ has: page.locator('h2', { hasText: '共享測試帳本' }) });
    await expect(bookCard.locator('.rounded-full').filter({ hasText: 'S' })).toBeVisible({ timeout: 10000 });
});
