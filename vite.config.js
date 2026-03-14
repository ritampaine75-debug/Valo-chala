import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TextShare App',
        short_name: 'TextShare',
        description: 'Secure Text Sharing',
        theme_color: '#000000',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
