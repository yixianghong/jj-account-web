import { expect, type Page } from '@playwright/test';

/**
 * 新增記帳本並等待出現在列表中
 * 等待 input 清空確認 handler 已完全執行完畢
 */
export async function createBook(page: Page, name: string): Promise<void> {
    await page.fill('input[placeholder="輸入記帳本名稱"]', name);
    await page.click('form button[type="submit"]');
    await expect(page.locator('h2').filter({ hasText: name })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[placeholder="輸入記帳本名稱"]')).toHaveValue('', { timeout: 5000 });
}

/**
 * 開啟指定記帳本的操作選單（⋮ 按鈕）
 */
export async function openBookMenu(page: Page, bookName: string): Promise<void> {
    const card = page.locator('.group').filter({ has: page.locator('h2', { hasText: bookName }) });
    await card.locator('[class*="absolute"] button').click();
}

/**
 * 開啟指定交易的操作選單（⋮ 按鈕，透過描述文字定位）
 */
export async function openTransactionMenu(page: Page, description: string): Promise<void> {
    const row = page.locator('.space-y-2 > div').filter({ has: page.locator(`text=${description}`) });
    await row.locator('button').last().click();
}
