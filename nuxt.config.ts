// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
   runtimeConfig: {
    geminiApiKey: '',
    geminiModel: 'gemini-3.8-flash',
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
