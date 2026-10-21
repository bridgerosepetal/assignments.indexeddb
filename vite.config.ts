import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  root: 'src/app',
  publicDir: '../../public',
  plugins: [tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically updates the service worker
      injectRegister: 'auto',
      manifest: {
        name: 'My Awesome PWA',
        short_name: 'MyPWA',
        description: 'A progressive web app built with Vite and pnpm',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })],
  server: {
    host: process.env.HOST,
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
})
