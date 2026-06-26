import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
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
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'e2e/',
        'tests/e2e/'
      ]
    }
  }
})
