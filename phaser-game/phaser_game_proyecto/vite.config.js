import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/php': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})