import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Mirror the conventional `@` -> src alias used across the codebase so
      // test files (and the components they import) can resolve `@/...`.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    // Note: the previous glob only matched `*.test.ts` / `*.spec.ts` under
    // __tests__, which silently skipped any `.spec.js` / `.test.js` files there
    // (e.g. src/components/__tests__/i18n-toggle.spec.js was never collected).
    // Match both .js and .ts under __tests__ AND tests/unit so every guard runs.
    include: [
      '**/__tests__/*.{test,spec}.{js,ts}',
      'tests/unit/*.{test,spec}.{js,ts}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,ts,vue}'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        'e2e/',
        'tests/e2e/',
        '.claude/',
        'src/main.js',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
})
