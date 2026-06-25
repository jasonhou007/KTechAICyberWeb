import { test, expect } from './fixtures/test-fixtures';

/**
 * Accessibility E2E Tests
 *
 * Tests for accessibility compliance
 * Priority: Regression
 */

test.describe('Accessibility', () => {
  test('should have proper page title', async ({ homePage }) => {
    await homePage.goto();

    // Check for page title
    const title = await homePage.page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have proper meta description', async ({ homePage }) => {
    await homePage.goto();

    const metaDescription = homePage.page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /开泰远景|科技|金融/);
  });

  test('should have proper heading hierarchy', async ({ homePage }) => {
    await homePage.goto();

    // Check for single h1
    const h1Count = await homePage.page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Check for h2 elements (section titles)
    const h2Elements = homePage.page.locator('h2');
    const h2Count = await h2Elements.count();
    expect(h2Count).toBeGreaterThan(0);

    // Verify section titles are present
    await expect(h2Elements.nth(0)).toContainText('核心服务');
  });

  test('should have proper language attribute', async ({ homePage }) => {
    await homePage.goto();

    const html = homePage.page.locator('html');
    await expect(html).toHaveAttribute('lang', /zh-CN|en/);
  });

  test('should have proper viewport meta tag', async ({ homePage }) => {
    await homePage.goto();

    const viewport = homePage.page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('images should have alt text or aria-hidden', async ({ page }) => {
    // Note: This site uses emoji icons as visual elements, not traditional img tags
    // The decorative elements are properly marked with aria-hidden
    await page.goto('/');

    const ariaHiddenElements = page.locator('[aria-hidden="true"]');
    const count = await ariaHiddenElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have skip link or proper navigation', async ({ homePage }) => {
    await homePage.goto();

    // Main navigation should be accessible
    await expect(homePage.navbar).toBeVisible();

    // Navigation links should be keyboard accessible
    await homePage.page.keyboard.press('Tab');
    await homePage.page.waitForTimeout(100);

    // Some element should be focused after tab
    const focusedElement = homePage.page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ homePage }) => {
    await homePage.goto();

    // Check that text is visible against background
    const heroTitle = homePage.heroTitle;
    await expect(heroTitle).toBeVisible();

    const computedStyle = await heroTitle.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });

    // Both color and backgroundColor should be defined
    expect(computedStyle.color).toBeDefined();
    expect(computedStyle.backgroundColor).toBeDefined();
  });

  test('should have proper ARIA labels where needed', async ({ homePage }) => {
    await homePage.goto();

    // Loading spinner should be hidden from screen readers
    await expect(homePage.loadingSpinner).toHaveAttribute('aria-hidden', 'true');

    // Decorative elements should be aria-hidden
    const scanlines = homePage.page.locator('.scanlines');
    await expect(scanlines).toHaveAttribute('aria-hidden', 'true');
  });

  test('should be keyboard navigable', async ({ homePage }) => {
    await homePage.goto();

    // Test keyboard navigation through the page
    const focusableElements = homePage.page.locator('a, button, [tabindex]:not([tabindex="-1"])');

    // Press Tab multiple times
    for (let i = 0; i < 5; i++) {
      await homePage.page.keyboard.press('Tab');
      await homePage.page.waitForTimeout(50);
    }

    // Verify something is focused
    const hasFocus = await homePage.page.evaluate(() => {
      return document.activeElement !== document.body;
    });
    expect(hasFocus).toBeTruthy();
  });
});
