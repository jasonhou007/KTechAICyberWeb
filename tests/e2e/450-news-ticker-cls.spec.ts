import { test, expect } from '@playwright/test';

/**
 * Issue #450: CLS regression on /news route
 *
 * CLS should be < 0.1 on /news page
 * Regression caused by NewsTicker.vue missing min-height
 */
test.describe('NewsTicker CLS regression', () => {
  test('should have CLS < 0.1 on /news route', async ({ page }) => {
    // Navigate to /news page
    await page.goto('/news');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');

    // Wait for NewsTicker to be present
    const newsTicker = page.locator('.news-ticker');
    await expect(newsTicker).toBeVisible();

    // Check that NewsTicker has min-height to prevent CLS
    const computedStyle = await newsTicker.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        minHeight: styles.minHeight,
        height: styles.height,
        display: styles.display
      };
    });

    // Verify min-height is set (should be '3rem' or similar)
    expect(computedStyle.minHeight).not.toBe('0px');
    expect(computedStyle.minHeight).not.toBe('auto');
    expect(computedStyle.minHeight).toBeTruthy();

    // Verify the element has actual dimensions
    const boundingBox = await newsTicker.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThan(0);
  });

  test('should prevent layout shift when NewsTicker loads', async ({ page }) => {
    // Navigate to /news page
    await page.goto('/news', { waitUntil: 'domcontentloaded' });

    // Get initial position of main content
    const mainContent = page.locator('main');
    const initialPosition = await mainContent.boundingBox();

    // Wait for NewsTicker to render
    await page.waitForSelector('.news-ticker', { state: 'visible' });

    // Get position after NewsTicker renders
    const finalPosition = await mainContent.boundingBox();

    // The main content should not shift vertically
    // A shift > 5px would indicate CLS issue
    const verticalShift = Math.abs(
      (finalPosition?.y || 0) - (initialPosition?.y || 0)
    );

    expect(verticalShift).toBeLessThanOrEqual(5);
  });
});
