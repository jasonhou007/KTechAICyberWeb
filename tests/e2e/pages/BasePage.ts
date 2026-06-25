import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object
 *
 * Provides common functionality for all page objects
 */
export class BasePage {
  readonly page: Page;
  readonly navbar: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navbar = page.locator('.nav');
    this.loadingSpinner = page.locator('#loading');
  }

  /**
   * Navigate to a URL path
   */
  async goto(path: string = '') {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad() {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  /**
   * Check if element is visible in viewport
   */
  async isVisibleInViewport(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'attached', timeout: 5000 });
    return await element.isVisible();
  }
}
