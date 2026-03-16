import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { TEST_USER } from '../global-setup';

/**
 * 提供已登入狀態的 page fixture
 * 透過 UI 直接執行登入流程，確保 Firebase Auth 狀態正確建立
 */
export const test = base.extend<{ authenticatedPage: Page }>({
    authenticatedPage: async ({ page }, use) => {
        // 攔截所有 dialog（alert/confirm），自動接受
        page.on('dialog', (dialog) => dialog.accept());

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // 填寫登入表單
        await page.fill('input[type="email"]', TEST_USER.email);
        await page.fill('input[type="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');

        // 等待導向 /accounts
        await page.waitForURL('**/accounts', { timeout: 15000 });

        await use(page);
    },
});

export { expect };
