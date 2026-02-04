import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/php': {
        target: 'http://localhost:3000/phaser-game',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/php/, '/php')
      }
    }
  }
})
