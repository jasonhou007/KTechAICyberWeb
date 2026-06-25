# Playwright E2E Testing Suite

## Overview

This directory contains the End-to-End (E2E) testing suite for the KTech website using Playwright. The tests validate critical user journeys across different browsers and devices.

## Test Structure

```
tests/e2e/
├── fixtures/
│   ├── test-data.ts       # Test data constants
│   └── test-fixtures.ts   # Custom Playwright fixtures
├── pages/
│   ├── BasePage.ts        # Base page object model
│   └── HomePage.ts        # Home page object model
├── homepage.spec.ts       # Homepage loading tests
├── navigation.spec.ts     # Navigation functionality tests
├── responsive.spec.ts     # Responsive design tests
├── visual.spec.ts         # Visual regression tests
└── README.md             # This file
```

## Page Object Model

The tests use the Page Object Model (POM) pattern to separate test logic from page structure:

- **BasePage**: Common functionality for all pages (navigation, waiting, utilities)
- **HomePage**: Specific locators and methods for the home page

## Running Tests Locally

### Install Dependencies

```bash
npm install
```

### Install Browser Binaries

```bash
npx playwright install
```

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode

```bash
npm run test:e2e:ui
```

### Run Tests Headed (with browser window visible)

```bash
npm run test:e2e:headed
```

### Debug Tests

```bash
npm run test:e2e:debug
```

### Run Specific Test File

```bash
npx playwright test homepage.spec.ts
```

### Run Tests on Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Mobile Tests

```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## Test Categories

### Smoke Tests (@smoke)

Critical functionality tests that must pass for the application to be considered usable:

- Homepage loads successfully
- Navigation menu is functional
- Core content is displayed

### Regression Tests

Comprehensive tests covering:

- Responsive design across viewports
- Visual element consistency
- Interactive element behavior
- Scroll behavior

## Test Reports

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

## Debugging Failed Tests

### Screenshots

Screenshots are automatically captured on test failures and saved to:
- `screenshots/` directory

### Traces

Test traces are captured on first retry and can be opened in the Playwright app:

```bash
npx playwright show-trace playwright-traces/[test-name].zip
```

### Videos

Videos are recorded on test failures and saved to:
- `test-results/` directory

## CI/CD Integration

Tests run automatically on:

1. **Pull Requests**: Full test suite on Chromium
2. **Push to main**: Full test suite on Chromium
3. **Smoke Tests Job**: Quick smoke tests only
4. **Mobile Tests Job**: Mobile viewport specific tests

Test artifacts are retained for 30 days:
- Playwright HTML reports
- Screenshots and videos (on failure)
- Test traces (on failure)
- JUnit XML results

## Writing New Tests

### 1. Add Page Object (if needed)

```typescript
// tests/e2e/pages/NewPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class NewPage extends BasePage {
  readonly someElement: Locator;

  constructor(page: Page) {
    super(page);
    this.someElement = page.locator('.selector');
  }

  async someAction() {
    await this.someElement.click();
  }
}
```

### 2. Add Test Data (if needed)

```typescript
// tests/e2e/fixtures/test-data.ts
export const NEW_TEST_DATA = {
  expectedValue: 'something',
};
```

### 3. Write Test

```typescript
// tests/e2e/new-feature.spec.ts
import { test, expect } from './fixtures/test-fixtures';

test.describe('New Feature', () => {
  test('should do something', async ({ homePage }) => {
    await homePage.goto();
    // Test logic here
  });
});
```

### 4. Run the Test

```bash
npx playwright test new-feature.spec.ts
```

## Best Practices

1. **Use Page Objects**: Keep locators and page interactions in page object classes
2. **Wait Properly**: Use Playwright's auto-waiting features, avoid fixed timeouts
3. **Select Appropriately**: Prefer user-visible selectors (text, aria labels)
4. **Keep Tests Independent**: Each test should be able to run alone
5. **Use Fixtures**: Share setup code through fixtures, not inheritance
6. **Add Tags**: Use @smoke, @regression tags to categorize tests
7. **Descriptive Names**: Test names should describe what is being tested

## Troubleshooting

### Tests Timeout

If tests timeout:
1. Check if the dev server is running
2. Verify the baseURL in playwright.config.ts
3. Increase timeout in the test or config

### Browser Not Found

If browser binaries are missing:
```bash
npx playwright install
```

### Flaky Tests

If tests are inconsistent:
1. Check for race conditions
2. Ensure proper waiting for elements
3. Check for timing-dependent animations
4. Use retry mechanism for known flaky scenarios

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
