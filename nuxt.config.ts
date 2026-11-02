export default defineNuxtConfig({
  runtimeConfig: {
    geminiApiKey: '',
    geminiModel: 'gemini-flash-lite-latest',
  },
  nitro: {
    storage: {
      reports: {
        driver: 'fs',
        base: './.data/reports',
      },
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})