import tailwindcss from "@tailwindcss/vite";
// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";
export default defineNuxtConfig({
  compatibilityDate: "2024-12-25",
  devtools: { enabled: true },
  srcDir: "src/client/",
  serverDir: "src/server",
  dir: { public: "../../public" },
  alias: {
    "~types": fileURLToPath(new URL("./types", import.meta.url)),
    "~server": fileURLToPath(new URL("./src/server", import.meta.url)),
  },
  vite: {
    ssr: {
      noExternal: ["104components"],
    },
    plugins: [tailwindcss()],
  },
  components: [{ path: "~/components" }],
  imports: { dirs: ["composables/**"] },
  modules: [
    "@nuxt/content",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxt/ui",
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
  }
});
