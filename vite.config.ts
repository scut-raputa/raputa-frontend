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
    // 修复 SockJS 在 Vite 中的兼容性问题
    global: 'globalThis',
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
      // WebSocket 代理 - 用于实时数据推送
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true, // 启用 WebSocket 代理
        secure: false,
      },
      // 检测接口代理 - 用于文件上传和检测
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
