// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      success: 'emerald',
      warning: 'amber',
      error: 'red'
    },
    button: {
      slots: {
        base: 'font-bold'
      }
    },
    card: {
      slots: {
        header: 'p-2 sm:px-2',
        body: 'p-2 sm:p-2',
        footer: 'p-2 sm:px-2'
      }
    }
  },
});
