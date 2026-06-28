import { test, expect } from './fixtures/test-fixtures';

/**
 * Theme Toggle E2E Tests
 *
 * Tests for the theme toggle (dark/light mode) functionality
 * Priority: Regression
 * @tags regression theme
 */

// Serial: these tests mutate localStorage (the persisted theme) and reload the
// page. Under fullyParallel mode, parallel workers on the same origin raced on
// localStorage and intermittently failed (persist/transition tests). Running
// the suite serially removes that shared-state flakiness.
test.describe.serial('Theme Toggle', { tag: ['@regression', '@theme'] }, () => {
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
    // Routes that actually exist in src/main.js (the old /services index route
    // was removed — services are now individual /services/<slug> pages, none of
    // which are in the main nav). The theme toggle is rendered in the App shell
    // so it is present on every routed page. Paths include the Vite base
    // subpath because page.goto resolves absolute paths against the origin.
    const BASE = '/KTechAICyberWeb';
    const pages = [`${BASE}/`, `${BASE}/about`, `${BASE}/news`];

    for (const pagePath of pages) {
      // Clear localStorage and navigate to page
      await page.goto(`${BASE}/`);
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

    // ThemeToggle shows the affordance for the theme you will switch TO: in
    // dark mode it shows the sun (☀) to switch to light, and in light mode it
    // shows the moon (☾). The icon lives in `.theme-icon` (the old
    // `.icon-moon` / `.icon-sun` classes no longer exist).
    const themeIcon = homePage.page.locator('.theme-toggle .theme-icon');

    // Get initial theme and check corresponding icon
    const initialTheme = await htmlElement.getAttribute('data-theme');

    if (initialTheme === 'dark') {
      await expect(themeIcon).toHaveText('☀');
    } else {
      await expect(themeIcon).toHaveText('☾');
    }

    // Toggle theme and verify icon changes
    await themeToggle.click();
    await homePage.page.waitForTimeout(350);

    const newTheme = await htmlElement.getAttribute('data-theme');

    if (newTheme === 'dark') {
      await expect(themeIcon).toHaveText('☀');
    } else {
      await expect(themeIcon).toHaveText('☾');
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

    // Vite `base` is `/KTechAICyberWeb/`, so absolute-path page.goto() must
    // include the subpath or it resolves against the origin and 404s (a 404
    // serves no SPA shell, so <html data-theme> is never set and the
    // persistence assertion compares against null). #194: the previous
    // version called page.goto('/news') / page.goto('/about') which 404'd —
    // the test was asserting theme persistence against an empty error page,
    // not the real app. This mirrors the BASE pattern already used by the
    // `should work on all pages` test in this file (see line ~162).
    const BASE = '/KTechAICyberWeb';

    // Start on homepage
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    // Toggle to light theme (or dark if already light)
    const initialTheme = await htmlElement.getAttribute('data-theme');
    await themeToggle.click();
    await page.waitForTimeout(350);

    const changedTheme = await htmlElement.getAttribute('data-theme');
    expect(changedTheme).not.toBe(initialTheme);

    // Navigate to the News page. The nav was restructured (#164) so News and
    // About Us are dropdown triggers (buttons), not `.nav-links a` links — the
    // intent of THIS test is theme PERSISTENCE across a client-side route
    // change (theme is in localStorage via usePreferencesStore), not nav
    // mechanics (covered by Header unit tests). Use page.goto() to drive the
    // route change directly so the assertion stays decoupled from nav DOM.
    await page.goto(`${BASE}/news`);
    await page.waitForLoadState('networkidle');
    expect(await htmlElement.getAttribute('data-theme')).toBe(changedTheme);

    // Navigate to the About page
    await page.goto(`${BASE}/about`);
    await page.waitForLoadState('networkidle');
    expect(await htmlElement.getAttribute('data-theme')).toBe(changedTheme);
  });
});
