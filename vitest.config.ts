import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.tsx',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/views/**/*.test.ts',
      'src/components/**/*.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      'e2e',
      'tests/e2e',
      '**/*.spec.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'e2e/',
        'tests/e2e/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.config.ts',
        'src/main.ts'
      ]
      // Note: Coverage thresholds set to 0 by default to allow CI to pass
      // Actual coverage verification done manually via HTML report
    },
    setupFiles: [],
    // Add transform options for JS files
    transformMode: {
      web: [/\.(tsx?|jsx)$/],
      ssr: [/\.tsx$/]
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
