import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  // Déployé sur GitHub Pages sous https://beckybenu.github.io/facebook/swiss-paint/
  base: '/facebook/swiss-paint/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'logo.jpg', 'favicon.svg'],
      manifest: {
        name: 'SwissPaints',
        short_name: 'SwissPaints',
        description: 'Pointage, chantiers et documents pour les ouvriers SwissPaints',
        theme_color: '#ED1212',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
