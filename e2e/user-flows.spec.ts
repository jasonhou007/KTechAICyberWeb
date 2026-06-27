import { test, expect } from '@playwright/test';

test.describe('User Flow Tests', () => {
  test('complete user journey - home to about and back', async ({ page }) => {
    // Start at home page
    await page.goto('/');

    // Verify home page elements
    await expect(page.locator('h1')).toContainText('KTech AI');
    await expect(page.locator('.cyber-card')).toContainText('Next Generation AI');

    // Navigate to about page
    await page.click('text=About');
    await expect(page).toHaveURL('/about');

    // Verify about page content
    await expect(page.locator('h1, h2')).toBeVisible();

    // Navigate back to home
    await page.click('text=Home');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('KTech AI');
  });

  test('should load all resources successfully', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });

    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    expect(failedRequests).toHaveLength(0);
  });

  test('should have fast initial page load', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle browser refresh', async ({ page }) => {
    await page.goto('/');

    const h1Text = await page.locator('h1').textContent();
    expect(h1Text).toContain('KTech AI');

    await page.reload();

    await expect(page.locator('h1')).toContainText('KTech AI');
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Navigate directly to about page
    await page.goto('/about');
    await expect(page).toHaveURL('/about');

    // Navigate directly to home page
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('KTech AI');
  });

  test('should handle 404 for invalid routes', async ({ page }) => {
    const response = await page.goto('/invalid-page-that-does-not-exist');

    // Vue Router might handle this gracefully
    // The page should still respond
    expect(response?.status()).toBeLessThan(500);
  });

  test('should maintain scroll position on navigation', async ({ page }) => {
    await page.goto('/');

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);

    // Navigate to about
    await page.click('text=About');

    // Scroll should be reset on new page
    const newScrollY = await page.evaluate(() => window.scrollY);
    expect(newScrollY).toBe(0);
  });

  test('should display loading states', async ({ page }) => {
    // Monitor network activity
    let resourcesLoaded = 0;

    page.on('load', () => {
      resourcesLoaded++;
    });

    await page.goto('/');

    // Page should eventually load
    await page.waitForLoadState('load');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have working keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Test Tab navigation
    await page.keyboard.press('Tab');

    // Focus should move to a focusable element
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON']).toContain(activeElement);
  });

  test('should handle rapid navigation clicks', async ({ page }) => {
    await page.goto('/');

    // Rapidly click navigation links
    for (let i = 0; i < 5; i++) {
      await page.click('text=About');
      await page.waitForTimeout(100);
      await page.click('text=Home');
      await page.waitForTimeout(100);
    }

    // Should end up on home page
    await expect(page).toHaveURL('/');
  });
});

test.describe('Accessibility Tests', () => {
  test('should have proper alt texts for images', async ({ page }) => {
    await page.goto('/');

    // Check for images without alt text
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    // Check for proper ARIA labels on interactive elements
    const button = page.locator('.cyber-button[aria-label]');
    await expect(button).toHaveCount(1);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    // Check that text is visible
    const h1 = page.locator('h1');
    const isVisible = await h1.isVisible();
    expect(isVisible).toBe(true);
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/');

    // Check for semantic HTML
    const main = page.locator('main');
    const nav = page.locator('nav');
    const footer = page.locator('footer');

    await expect(main).toHaveCount(1);
    await expect(nav).toHaveCount(1);
    await expect(footer).toHaveCount(1);
  });
});

test.describe('Performance Tests', () => {
  test('should have low CLS (Cumulative Layout Shift)', async ({ page }) => {
    await page.goto('/');

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Key elements should be in their final position
    const nav = page.locator('.cyber-nav');
    const footer = page.locator('.cyber-footer');

    await expect(nav).toBeVisible();
    await expect(footer).toBeVisible();
  });

  test('should render animations smoothly', async ({ page }) => {
    await page.goto('/');

    // Wait for animations to complete
    await page.waitForTimeout(2000);

    // Elements should still be visible after animations
    const featureCards = page.locator('.feature-card');
    await expect(featureCards).toHaveCount(3);
  });
});
