import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Ensure service worker is served correctly
  publicDir: 'public',
  server: {
    // Allow service worker to work in dev mode
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  build: {
    // Ensure service worker is included in build
    rollupOptions: {
      // Service worker from public folder is automatically copied
    },
    // Copy public folder contents (including sw.js) to dist
    copyPublicDir: true
  }
})
