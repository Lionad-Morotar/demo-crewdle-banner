import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2026-06-25',
  future: {
    compatibilityVersion: 4,
  },
  app: {
    baseURL: '/crewdle-banner/',
  },
})
