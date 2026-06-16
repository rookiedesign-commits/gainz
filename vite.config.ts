import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base: './' => relative Pfade, funktioniert auf GitHub Pages (Projekt-Subpfad)
// ohne dass der Repo-Name hart kodiert werden muss. Mit HashRouter gibt es kein 404.
export default defineConfig({
  base: './',
  // Build-Zeitstempel zur Versionskontrolle (wird in "Mehr" angezeigt).
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registrierung erfolgt manuell in main.tsx (periodischer Update-Check + Auto-Reload).
      injectRegister: false,
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Gainz',
        short_name: 'Gainz',
        description: 'Persönlicher Trainings-Tracker',
        theme_color: '#04101f',
        background_color: '#04101f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,mp3,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ]
})
