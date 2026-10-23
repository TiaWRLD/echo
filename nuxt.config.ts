import tailwindcss from '@tailwindcss/vite'

const base = process.env.NUXT_APP_BASE_URL || '/'   // must end with "/"

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,                       // SPA pura
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@vite-pwa/nuxt'],
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
      link: [{ rel: 'apple-touch-icon', href: `${base}apple-touch-icon-180x180.png` }],
      meta: [
        { name: 'theme-color', content: '#0B0A14' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  pwa: {
    registerType: 'prompt', // no surprise reloads: conversations only live in memory
    manifest: {
      name: 'Echo, a quiet place to think',
      short_name: 'Echo',
      description: 'A private space to put your thoughts in order. It runs on your device.',
      lang: 'en',
      start_url: base,
      scope: base,
      display: 'standalone',
      theme_color: '#0B0A14',
      background_color: '#0B0A14',
      icons: [
        {src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png'},
        {src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png'},
        {src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
      ],
    },
  },
})