# Playwright E2E Testing Guide

## Overview

This document describes the E2E testing setup for the KTech AI Cyberpunk website using Playwright.

## Test Structure

```
KTechAICyberWeb/
├── e2e/
│   ├── config.ts              # Shared test configuration
│   ├── navigation.spec.ts     # Navigation functionality tests
│   ├── theme.spec.ts          # Theme and visual tests
│   ├── responsive.spec.ts     # Mobile responsiveness tests
│   └── user-flows.spec.ts     # User flow and accessibility tests
├── playwright.config.js        # Playwright configuration
└── test-results/              # Generated test reports
```

## Test Coverage

### Navigation Tests (`navigation.spec.ts`)
- Navigate to home page
- Navigate to about page
- Navigate back to home from about
- Working navigation links
- Active navigation link highlighting
- Browser back button navigation

### Theme Tests (`theme.spec.ts`)
- Cyberpunk styling display
- Footer with status
- Feature cards display
- Stats section
- CTA button functionality
- Animated background grid
- Meta tags
- Semantic HTML structure

### Responsive Tests (`responsive.spec.ts`)
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)
- Touch interactions

### User Flow Tests (`user-flows.spec.ts`)
- Complete user journey
- Resource loading
- Page load performance
- Browser refresh
- Direct URL navigation
- Scroll position handling
- Keyboard navigation
- Rapid navigation clicks
- Accessibility checks
- Performance metrics

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (visible browser)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

### Run specific test file
```bash
npx playwright test e2e/navigation.spec.ts
```

### Run tests on specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('my test case', async ({ page }) => {
    // Your test code here
    await expect(page.locator('h1')).toContainText('KTech AI');
  });
});
```

### Best Practices

1. **Use descriptive test names** - Make it clear what is being tested
2. **Group related tests** - Use `test.describe()` for logical grouping
3. **Use beforeEach hooks** - For common setup like navigation
4. **Use specific selectors** - Prefer data attributes or semantic selectors
5. **Wait for elements** - Use `await expect(element).toBeVisible()`
6. **Clean up after tests** - Use `test.afterEach()` if needed

### Selectors

Use the shared selectors from `config.ts`:

```typescript
import { selectors } from './config';

test('example', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(selectors.nav)).toBeVisible();
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: test-results/
```

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.js`
- Check if the dev server is running

### Elements not found
- Verify selectors are correct
- Wait for elements to load using `waitForSelector`
- Check for timing issues

### Flaky tests
- Use `test.retry()` for known flaky tests
- Add proper waits for dynamic content
- Ensure clean state between tests

## Browser Coverage

- Chromium (Chrome, Edge)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Vue.js Testing Guide](https://vuejs.org/guide/scaling-up/testing.html)
