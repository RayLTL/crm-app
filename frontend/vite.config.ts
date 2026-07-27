import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/airscript': {
        target: 'https://www.kdocs.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/airscript/, ''),
        headers: { Origin: 'https://www.kdocs.cn', Referer: 'https://www.kdocs.cn/' },
      },
    },
  },
})