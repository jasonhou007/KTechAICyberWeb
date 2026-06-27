import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const SITE_URL = 'https://jasonhou007.github.io/KTechAICyberWeb'

export default defineConfig({
  plugins: [vue()],
  base: '/KTechAICyberWeb/',
  server: {
    port: 3000
  },
  build: {
    // SEO optimization: generate source maps for better debugging
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router']
        }
      }
    }
  }
})
