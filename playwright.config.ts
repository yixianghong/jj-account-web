import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e/tests',
    fullyParallel: false,
    workers: 1,
    timeout: 30000,
    retries: 0,
    reporter: [['html'], ['line']],
    use: {
        baseURL: 'http://localhost:3011',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
    },
    globalSetup: './e2e/global-setup.ts',
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
    webServer: {
        command: 'npm run dev:test',
        url: 'http://localhost:3011',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
            NUXT_PUBLIC_FIREBASE_API_KEY: 'fake-api-key',
            NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-test.firebaseapp.com',
            NUXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-test',
            NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-test.appspot.com',
            NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
            NUXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef',
            NUXT_PUBLIC_USE_EMULATOR: 'true',
        },
    },
});
