export default defineNuxtConfig({
  runtimeConfig: {
    geminiApiKey: '',
    geminiModel: 'gemini-flash-lite-latest',
  },
  nitro: {
    storage: {
      reports: process.env.KV_REST_API_URL
        ? {
            driver: 'upstash',
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
          }
        : {
            driver: 'fs',
            base: './.data/reports',
          },
    },
    vercel: {
      functions: {
        maxDuration: 60,
      },
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})