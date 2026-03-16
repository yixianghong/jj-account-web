import { test, expect } from '@playwright/test';
import { TEST_USER } from '../../global-setup';

test.beforeEach(async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
});

test('有效帳號登入後導向 /accounts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/accounts', { timeout: 15000 });
    expect(page.url()).toContain('/accounts');

    // 驗證記帳本頁面標題顯示
    await expect(page.locator('h1').filter({ hasText: '我的記帳本' })).toBeVisible();
});

test('錯誤密碼應顯示錯誤提示', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', 'WrongPassword!');
    await page.click('button[type="submit"]');

    // 應顯示錯誤提示（login form 內的 UAlert）
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 10000 });

    // 應停在登入頁（URL 仍為 /）
    expect(page.url()).not.toContain('/accounts');
});
