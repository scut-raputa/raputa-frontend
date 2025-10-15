import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure(proxy) {
          proxy.on('error', (err, req) => {
            console.error('proxy error:', err?.message, 'for', req?.method, req?.url)
          })
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('proxying:', req.method, req.url, '->', proxyReq.getHeader('host'))
          })
        },
      },
    },
  },
})
