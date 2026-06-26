import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    // Bundle analyzer - generates stats.html
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
    }),
    // Brotli compression
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000
  },
  build: {
    // Configure manual chunks for code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk - separate Vue and Vue Router
          'vendor': ['vue', 'vue-router'],
        },
        // Chunk naming strategy
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Minify with esbuild (default, faster)
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true,
    //   },
    // },
    // Report compressed sizes
    reportCompressedSize: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 10000,
    include: ['tests/unit/**/*.spec.js', 'tests/unit/**/*.test.js'],
    exclude: [
      'node_modules/',
      'tests/e2e/',
      'dist/',
      'src/main.js'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/e2e/',
        'dist/',
        '**/*.spec.js',
        '**/*.test.js',
        'src/main.js'
      ]
    }
  }
})
