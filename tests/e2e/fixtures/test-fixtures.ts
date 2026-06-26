import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ServicesPage } from '../pages/ServicesPage';

/**
 * Extended Test Fixtures
 *
 * Custom fixtures that extend Playwright's base test with page objects
 */

export type TestFixtures = {
  homePage: HomePage;
  servicesPage: ServicesPage;
};

export const test = base.extend<TestFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
  servicesPage: async ({ page }, use) => {
    const servicesPage = new ServicesPage(page);
    await use(servicesPage);
  },
});

export { expect } from '@playwright/test';
