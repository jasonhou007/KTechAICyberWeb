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
// Cross-browser E2E #222: firefox and chromium can serialize the same
// computed background-color differently (e.g. rgba vs rgb, or different
// whitespace). normalizeColor extracts the "r,g,b" triple from any
// rgb()/rgba() form so the assertion is engine-agnostic, while still
// asserting the EXACT intended color. DARK_BG = #0a0a0a, LIGHT_BG = #f5f7fa.
function normalizeColor(color: string): string {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) return color;
  const parts = match[1].split(',').map((p) => p.trim());
  // Drop the alpha channel if present — both themes use fully-opaque bg.
  return parts.slice(0, 3).join(',');
}
const DARK_BG = '10,10,10';
const LIGHT_BG = '245,247,250';

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

    // Wait for the app to mount and set data-theme (beforeEach clears
    // localStorage, so the app sets it on mount — reading too early returns
    // null). Web-first retry instead of a fixed waitForTimeout.
    await expect(htmlElement).toHaveAttribute('data-theme', /^(dark|light)$/);

    // Ensure dark theme is active
    const currentTheme = await htmlElement.getAttribute('data-theme');
    if (currentTheme !== 'dark') {
      await themeToggle.click();
    }

    // Verify theme is now dark (web-first retry; no fixed wait).
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

    // Assert the resolved --bg-primary variable directly off <html>. Variable
    // resolution has NO CSS transition (transitions affect properties that
    // consume the var, like body.backgroundColor, not the var itself), so it
    // settles the instant data-theme flips — deterministic on every engine.
    // This replaces the prior waitForTimeout(400) + one-shot getComputedStyle
    // pattern that flaked under firefox CI load (the 300ms bg transition was
    // still interpolating after 400ms). Sibling of the 188-css-purge harden.
    // Cross-browser E2E #222.
    await expect.poll(
      async () => homePage.page.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim()
      ),
      { timeout: 3000, message: '--bg-primary must resolve to the dark-theme value' },
    ).toBe('#0a0a0a');

    // Belt-and-braces: body.backgroundColor (consumes --bg-primary) must settle
    // to the exact dark value once the 300ms transition completes. normalizeColor
    // runs in Node (not the page.evaluate browser scope) — apply it outside.
    await expect.poll(
      async () => normalizeColor(await homePage.page.evaluate(() => getComputedStyle(document.body).backgroundColor)),
      { timeout: 5000, message: 'body bg must settle to the dark-theme value' },
    ).toBe(DARK_BG);
  });

  test('should apply correct CSS variables for light theme', async ({ homePage }) => {
    const themeToggle = homePage.page.locator('.theme-toggle');
    const htmlElement = homePage.page.locator('html');

    // Wait for the app to mount and set data-theme (see dark-theme test).
    await expect(htmlElement).toHaveAttribute('data-theme', /^(dark|light)$/);

    // Toggle to light theme if not already
    const currentTheme = await htmlElement.getAttribute('data-theme');
    if (currentTheme !== 'light') {
      await themeToggle.click();
    }

    // Verify theme is now light (web-first retry; no fixed wait).
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');

    // Assert the resolved --bg-primary variable directly (see dark-theme test
    // for rationale). Cross-browser E2E #222.
    await expect.poll(
      async () => homePage.page.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim()
      ),
      { timeout: 3000, message: '--bg-primary must resolve to the light-theme value' },
    ).toBe('#f5f7fa');

    // Belt-and-braces: body.backgroundColor must settle to the exact light value.
    await expect.poll(
      async () => normalizeColor(await homePage.page.evaluate(() => getComputedStyle(document.body).backgroundColor)),
      { timeout: 5000, message: 'body bg must settle to the light-theme value' },
    ).toBe(LIGHT_BG);
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

    // Measure responsiveness as the time from the click to the theme attr
    // actually flipping — the real signal that the DOM updated. Previously
    // this measured wall-clock after a fixed waitForTimeout(50), which flaked
    // under firefox CI load. Polling for the data-theme change gives the true
    // responsiveness figure. Cross-browser E2E #222 (firefox CI timing flake).
    const htmlBefore = await homePage.page.locator('html').getAttribute('data-theme');
    const startTime = Date.now();
    await themeToggle.click();
    await expect.poll(
      async () => homePage.page.locator('html').getAttribute('data-theme'),
      { timeout: 3000, intervals: [10], message: 'data-theme must flip after toggle click' },
    ).not.toBe(htmlBefore);
    const endTime = Date.now();

    // Toggle should be responsive. The threshold is intentionally loose: this
    // is a responsiveness sanity check (catches a true hang / broken toggle),
    // not a perf SLA. Firefox under CI load genuinely takes ~600ms for the
    // click -> reactive update -> data-theme flip cycle (measured: 612ms on
    // run 28384355815), so a sub-500ms threshold flakes on real firefox CI
    // latency even though the toggle works correctly. 2000ms still catches a
    // genuinely-unresponsive toggle (the actionTimeout is 10s) while not
    // flaking on normal firefox CI latency. Cross-browser E2E #222.
    expect(endTime - startTime, 'toggle DOM update should land within 2000ms (CI-realistic)').toBeLessThan(2000);
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
