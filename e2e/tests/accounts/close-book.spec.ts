import { test, expect } from '../../fixtures/auth.fixture';
import { clearFirestoreData } from '../../helpers/emulator';
import { createBook, openBookMenu } from '../../helpers/test-helpers';

test.beforeEach(async () => {
    await clearFirestoreData();
});

test('可以關閉記帳本，卡片反灰且選單變為重新開啟', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await createBook(page, '要關閉的帳本');
    const card = page.locator('.group').filter({ has: page.locator('h2', { hasText: '要關閉的帳本' }) });

    // 開啟操作選單並點擊「關閉」，再於確認彈窗按下「關閉」
    await openBookMenu(page, '要關閉的帳本');
    await page.getByRole('menuitem', { name: '關閉' }).click();
    await page.getByRole('dialog').getByRole('button', { name: '關閉' }).click();

    // 卡片反灰
    await expect(card).toHaveClass(/grayscale/, { timeout: 10000 });

    // 再次開啟選單，應顯示「重新開啟」而非「關閉」
    await openBookMenu(page, '要關閉的帳本');
    await expect(page.getByRole('menuitem', { name: '重新開啟' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: '關閉', exact: true })).not.toBeVisible();
});

test('可以重新開啟已關閉的記帳本', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await createBook(page, '重開測試');
    const card = page.locator('.group').filter({ has: page.locator('h2', { hasText: '重開測試' }) });

    // 先關閉
    await openBookMenu(page, '重開測試');
    await page.getByRole('menuitem', { name: '關閉' }).click();
    await page.getByRole('dialog').getByRole('button', { name: '關閉' }).click();
    await expect(card).toHaveClass(/grayscale/, { timeout: 10000 });

    // 重新開啟（無確認彈窗，直接執行）
    await openBookMenu(page, '重開測試');
    await page.getByRole('menuitem', { name: '重新開啟' }).click();

    // 反灰移除
    await expect(card).not.toHaveClass(/grayscale/, { timeout: 10000 });
});

test('已關閉的記帳本排序至最後', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // 依序建立：B 較新，預設排在 A 之前
    await createBook(page, '帳本A');
    await createBook(page, '帳本B');

    const titles = page.locator('.group h2');
    await expect(titles.nth(0)).toHaveText('帳本B');
    await expect(titles.nth(1)).toHaveText('帳本A');

    // 關閉較新的「帳本B」，它應沉到最後
    await openBookMenu(page, '帳本B');
    await page.getByRole('menuitem', { name: '關閉' }).click();
    await page.getByRole('dialog').getByRole('button', { name: '關閉' }).click();

    const cardB = page.locator('.group').filter({ has: page.locator('h2', { hasText: '帳本B' }) });
    await expect(cardB).toHaveClass(/grayscale/, { timeout: 10000 });

    // 未關閉的「帳本A」排前面，已關閉的「帳本B」排最後
    await expect(titles.nth(0)).toHaveText('帳本A');
    await expect(titles.nth(1)).toHaveText('帳本B');
});
