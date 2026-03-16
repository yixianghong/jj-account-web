import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
});

test('可以使用 Email 註冊新帳號並導向 /accounts', async ({ page }) => {
    // 使用 Date.now() 確保唯一 email
    // clearFirestoreData 不清除 Auth emulator，故每次需不同 email
    const newEmail = `newuser-${Date.now()}@example.com`;

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 切換到註冊模式
    await page.click('text=還沒有帳號？點此註冊');

    await page.fill('input[type="email"]', newEmail);
    await page.fill('input[type="password"]', 'NewPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/accounts', { timeout: 15000 });
    await expect(page.locator('h1').filter({ hasText: '我的記帳本' })).toBeVisible();
});
