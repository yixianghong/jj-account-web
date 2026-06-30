// app.config.ts
export default defineAppConfig({
  ui: {
    // primary 指向 main.css @theme 定義的自訂 brand（slate blue）色階，避免與內建色衝突
    colors: {
      primary: 'brand',
      secondary: 'brand',
      success: 'emerald',
      warning: 'amber',
      error: 'rose',
      neutral: 'slate'
    },
    button: {
      slots: {
        base: 'font-semibold transition-all duration-200'
      }
    },
    card: {
      slots: {
        root: 'rounded-3xl',
        header: 'p-2 sm:px-2',
        body: 'p-2 sm:p-2',
        footer: 'p-2 sm:px-2'
      }
    }
  },
});
