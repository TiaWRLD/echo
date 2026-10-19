import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,                       // SPA pura
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
    worker: { format: 'es' },       // necessario per il worker con type: 'module'
  },

  nitro: { preset: 'github_pages' },

  app: {
    // Su GitHub Pages il sito vive in /nome-repo/
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Echo, a quiet place to think',
      htmlAttrs: { lang: 'en', class: 'dark' },
      meta: [
        { name: 'theme-color', content: '#0B0A14' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})