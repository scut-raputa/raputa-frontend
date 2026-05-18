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
  define: {
    global: 'globalThis',
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }
          if (id.includes('element-plus') || id.includes('@element-plus')) {
            return 'vendor-element-plus'
          }
          if (id.includes('echarts') || id.includes('zrender') || id.includes('vue-echarts')) {
            return 'vendor-charts'
          }
          if (id.includes('html2pdf.js') || id.includes('html2canvas') || id.includes('jspdf')) {
            return 'vendor-report'
          }
          if (id.includes('@stomp') || id.includes('sockjs-client')) {
            return 'vendor-realtime'
          }
          if (id.includes('vue')) {
            return 'vendor-vue'
          }
          return 'vendor'
        },
      },
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
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
      '/detect': {
        target: 'http://222.201.187.184:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/detect/, ''),
        configure(proxy) {
          proxy.on('error', (err, req) => {
            console.error('detect proxy error:', err?.message, 'for', req?.method, req?.url)
          })
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('detect proxying:', req.method, req.url, '->', proxyReq.getHeader('host'))
          })
        },
      },
    },
  },
})
