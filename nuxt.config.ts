import tailwindcss from "@tailwindcss/vite";
// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";
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
      firebaseAppId: process.env.FIREBASE_APP_ID
    }
  },
  ui: {
  },
  nitro: {
    preset: 'static',
    prerender: {
      ignore: ['/favicon.ico']
    }
  },
  app: {
    head: {
      title: '記帳本',
      meta: [
        { name: 'description', content: '記帳本' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
});
