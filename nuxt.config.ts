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
    "@nuxt/ui",
    "@nuxt/scripts",
  ],
  css: ["~/assets/css/main.css"],
  image: {
    dir: "assets/imgs",
  },
});
