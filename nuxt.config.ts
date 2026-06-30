import tailwindcss from "@tailwindcss/vite";
// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
export default defineNuxtConfig({
  compatibilityDate: "2024-12-25",
  devtools: { enabled: true },
  srcDir: "src/client/",
  serverDir: "src/server",
  alias: {
    "~types": fileURLToPath(new URL("./types", import.meta.url)),
    "~server": fileURLToPath(new URL("./src/server", import.meta.url)),
  },
  vite: {
    plugins: [tailwindcss()],
  },
  components: [{ path: "~/components" }],
  imports: { dirs: ["composables/**"] },
  modules: [
    "@nuxt/ui",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/eslint",
    "@vite-pwa/nuxt",
  ],
  css: ["~/assets/css/main.css"],
  image: {
    dir: "assets/imgs",
  },
  typescript: {
    strict: true,
  },
  colorMode: {
    preference: "light",
  },
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseVapidKey: process.env.FIREBASE_VAPID_KEY,
      useEmulator: false,
    }
  },
  hooks: {
    'build:before'() {
      const swContent = `importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "${process.env.FIREBASE_API_KEY}",
  authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.FIREBASE_APP_ID}"
});

// 初始化 messaging 以接收背景推播。
// 注意：訊息帶有 notification payload 時，Firebase SDK 會在背景「自動顯示」通知，
// 因此不可再於 onBackgroundMessage 內手動 showNotification，否則會收到兩則一模一樣的通知。
// 通知外觀（icon 等）由 Cloud Function 的 webpush.notification 設定。
firebase.messaging();
`;
      fs.writeFileSync(
        path.resolve('./src/client/public/firebase-messaging-sw.js'),
        swContent
      );
    }
  },
  nitro: {
    preset: 'static',
  },
  app: {
    head: {
      title: '記帳夥伴',
      meta: [
        { name: 'description', content: '記帳,共享,分析' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module',
    },
    manifest: {
      name: '記帳夥伴',
      short_name: '記帳夥伴',
      description: '記帳,共享,分析',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: 'icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: 'icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        },
      ],
      screenshots: [
        {
          "src": "screenshots/home.png",
          "type": "image/png",
          "sizes": "540x720",
          "form_factor": "narrow",
          "label": "首頁記帳輸入"
        },
        {
          "src": "screenshots/summary.png",
          "type": "image/png",
          "sizes": "1080x1600",
          "form_factor": "narrow",
          "label": "支出分析總覽"
        },
        {
          "src": "screenshots/desktop.png",
          "type": "image/png",
          "sizes": "1600x900",
          "form_factor": "wide",
          "label": "桌面版介面"
        }
      ]
    },
  },
});
