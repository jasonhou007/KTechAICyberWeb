import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

/**
 * Extended Test Fixtures
 *
 * Custom fixtures that extend Playwright's base test with page objects
 */

export type TestFixtures = {
  homePage: HomePage;
};

export const test = base.extend<TestFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
});

export { expect } from '@playwright/test';
