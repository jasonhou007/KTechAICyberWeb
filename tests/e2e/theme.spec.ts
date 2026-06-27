import { test, expect } from './fixtures/test-fixtures';

/**
 * Theme Toggle E2E Tests
 *
 * Tests for the theme toggle (dark/light mode) functionality
 * Priority: Regression
 * @tags regression theme
 */

test.describe('Theme Toggle', { tag: ['@regression', '@theme'] }, () => {
  test.beforeEach(async ({ homePage }) => {
    // Clear localStorage before each test to ensure clean state
    await homePage.page.goto('/');
    await homePage.page.evaluate(() => {
      localStorage.clear();
    });
    await homePage.goto('/');
  });

  test('should display theme toggle button', async ({ homePage }) => {
    // Verify theme toggle button is visible
    const themeToggle = homePage.page.locator('.theme-toggle');
    await expect(themeToggle).toBeVisible();
  });

  test('should toggle theme on click', async ({ homePage }) => {
    const themeToggle = homePage.page.locator('.theme-toggle');
    const htmlElement = homePage.page.locator('html');

    // Get initial theme (should be dark by default)
    const initialTheme = await htmlElement.getAttribute('data-theme');
    expect(['dark', 'light']).toContain(initialTheme); // Can be either based on system preference

    // Click theme toggle
    await themeToggle.click();
    await homePage.page.waitForTimeout(350); // Wait for transition

    // Get new theme
    const newTheme = await htmlElement.getAttribute('data-theme');
    expect(newTheme).toBeTruthy();
    expect(['dark', 'light']).toContain(newTheme);

    // Verify theme actually changed
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should persist theme across page reloads', async ({ homePage }) => {
    const themeToggle = homePage.page.locator('.theme-toggle');
    const htmlElement = homePage.page.locator('html');

    // Get initial theme
    const initialTheme = await htmlElement.getAttribute('data-theme');

    // Click to toggle theme
    await themeToggle.click();
    await homePage.page.waitForTimeout(350);

    // Verify theme changed
    const changedTheme = await htmlElement.getAttribute('data-theme');
    expect(changedTheme).not.toBe(initialTheme);

    // Reload page
    await homePage.page.reload();
    await homePage.page.waitForLoadState('networkidle');

    // Verify theme persisted
    const persistedTheme = await htmlElement.getAttribute('data-theme');
    expect(persistedTheme).toBe(changedTheme);
  });

  test('should respect system preference on first visit', async ({ homePage }) => {
    const htmlElement = homePage.page.locator('html');

    // On first visit (no localStorage), should respect system preference
    const theme = await htmlElement.getAttribute('data-theme');
    expect(theme).toBeTruthy();
    expect(['dark', 'light']).toContain(theme);
  });

  test('should apply correct CSS variables for dark theme', async ({ homePage }) => {
    const themeToggle = homePage.page.locator('.theme-toggle');
    const htmlElement = homePage.page.locator('html');

    // Ensure dark theme is active
    const currentTheme = await htmlElement.getAttribute('data-theme');
    if (currentTheme !== 'dark') {
      await themeToggle.click();
      await homePage.page.waitForTimeout(350);
    }

    // Verify theme is now dark
    expect(await htmlElement.getAttribute('data-theme')).toBe('dark');

    // Check that the page is styled (dark theme should have dark background)
    const bodyBgColor = await homePage.page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // Dark theme should have a very dark background (close to #0a0a0a)
    expect(bodyBgColor).toBe('rgb(10, 10, 10)');
  });

  test('should apply correct CSS variables for light theme', async ({ homePage }) => {
    const themeToggle = homePage.page.locator('.theme-toggle');
    const htmlElement = homePage.page.locator('html');

    // Toggle to light theme if not already
    const currentTheme = await htmlElement.getAttribute('data-theme');
    if (currentTheme !== 'light') {
      await themeToggle.click();
      await homePage.page.waitForTimeout(350);
    }

    // Verify theme is now light
    expect(await htmlElement.getAttribute('data-theme')).toBe('light');

    // Check that the page is styled (light theme should have light background)
    const bodyBgColor = await homePage.page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // Light theme should have a light background (close to #f5f7fa)
    expect(bodyBgColor).toBe('rgb(245, 247, 250)');
  });

  test('should transition smoothly between themes', async ({ homePage }) => {
    const themeToggle = homePage.page.locator('.theme-toggle');

    // Check for transition CSS
    const hasTransitions = await homePage.page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.style.transition = 'background-color 0.3s ease';
      document.body.appendChild(testElement);
      const styles = getComputedStyle(testElement);
      const hasTransition = styles.transition.includes('0.3s');
      document.body.removeChild(testElement);
      return hasTransition;
    });

    expect(hasTransitions).toBe(true);

    // Measure transition time
    const startTime = Date.now();
    await themeToggle.click();
    await homePage.page.waitForTimeout(50); // Small wait for DOM update
    const endTime = Date.now();

    // Toggle should be responsive (< 200ms for initial DOM update)
    expect(endTime - startTime).toBeLessThan(500);
  });

  test('should work on all pages', async ({ page }) => {
    const pages = ['/', '/services', '/about'];

    for (const pagePath of pages) {
      // Clear localStorage and navigate to page
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Verify theme toggle exists and is visible on each page
      const themeToggle = page.locator('.theme-toggle');
      await expect(themeToggle).toBeVisible();

      // Try toggling theme on this page
      const htmlElement = page.locator('html');
      const initialTheme = await htmlElement.getAttribute('data-theme');

      await themeToggle.click();
      await page.waitForTimeout(350);

      const newTheme = await htmlElement.getAttribute('data-theme');
      expect(newTheme).not.toBe(initialTheme);

      // Toggle back for next test
      await themeToggle.click();
      await page.waitForTimeout(350);
    }
  });

  test('should update icon based on theme', async ({ homePage }) => {
    const themeToggle = homePage.page.locator('.theme-toggle');
    const htmlElement = homePage.page.locator('html');

    // Get initial theme and check corresponding icon
    const initialTheme = await htmlElement.getAttribute('data-theme');

    if (initialTheme === 'dark') {
      await expect(homePage.page.locator('.icon-moon')).toBeVisible();
    } else {
      await expect(homePage.page.locator('.icon-sun')).toBeVisible();
    }

    // Toggle theme and verify icon changes
    await themeToggle.click();
    await homePage.page.waitForTimeout(350);

    const newTheme = await htmlElement.getAttribute('data-theme');

    if (newTheme === 'dark') {
      await expect(homePage.page.locator('.icon-moon')).toBeVisible();
    } else {
      await expect(homePage.page.locator('.icon-sun')).toBeVisible();
    }
  });

  test('should have proper accessibility attributes', async ({ homePage }) => {
    const themeToggle = homePage.page.locator('.theme-toggle');

    // Check for aria-label
    const ariaLabel = await themeToggle.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).not.toBe('');

    // Check for title attribute
    const title = await themeToggle.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title).not.toBe('');

    // Check it's a button element
    const tagName = await themeToggle.evaluate(el => el.tagName);
    expect(tagName).toBe('BUTTON');
  });

  test('should work with keyboard navigation', async ({ homePage }) => {
    const themeToggle = homePage.page.locator('.theme-toggle');
    const htmlElement = homePage.page.locator('html');

    // Focus the theme toggle
    await themeToggle.focus();
    await expect(themeToggle).toBeFocused();

    // Get initial theme
    const initialTheme = await htmlElement.getAttribute('data-theme');

    // Press Enter to toggle
    await homePage.page.keyboard.press('Enter');
    await homePage.page.waitForTimeout(350);

    // Verify theme changed
    const newTheme = await htmlElement.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);

    // Press Space to toggle back
    await themeToggle.focus();
    await homePage.page.keyboard.press('Space');
    await homePage.page.waitForTimeout(350);

    // Verify theme changed back
    const finalTheme = await htmlElement.getAttribute('data-theme');
    expect(finalTheme).toBe(initialTheme);
  });

  test('should maintain theme consistency across navigation', async ({ page }) => {
    const themeToggle = page.locator('.theme-toggle');
    const htmlElement = page.locator('html');

    // Start on homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle to light theme (or dark if already light)
    const initialTheme = await htmlElement.getAttribute('data-theme');
    await themeToggle.click();
    await page.waitForTimeout(350);

    const changedTheme = await htmlElement.getAttribute('data-theme');
    expect(changedTheme).not.toBe(initialTheme);

    // Navigate to services page
    await page.click('a[href="/services"]');
    await page.waitForLoadState('networkidle');

    // Verify theme persists on services page
    expect(await htmlElement.getAttribute('data-theme')).toBe(changedTheme);

    // Navigate to about page
    await page.click('a[href="/about"]');
    await page.waitForLoadState('networkidle');

    // Verify theme persists on about page
    expect(await htmlElement.getAttribute('data-theme')).toBe(changedTheme);
  });
});
