// app.config.ts
import { defineAppConfig } from '#app'; // 確保引入 defineAppConfig

export default defineAppConfig({
  ui: {
    card: {
      slots: {
        body: 'p-2',
        header: 'p-2',
        footer: 'p-2'
      }
    }
  },
});
