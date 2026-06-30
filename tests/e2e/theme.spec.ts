import { test, expect } from './fixtures/test-fixtures';

/**
 * Dark-Theme Lock E2E Tests (#239)
 *
 * The dark/light theme toggle was removed and the site is locked to the dark
 * theme unconditionally. App.vue sets <html data-theme="dark"> once on mount
 * and never flips it; there is no toggle in the DOM. This spec pins that
 * locked-dark contract end-to-end:
 *
 *  - data-theme is "dark" on first load (no localStorage).
 *  - .theme-toggle is ABSENT from the DOM on /, /about, /news.
 *  - --bg-primary resolves to #0a0a0a and stays there across reloads.
 *
 * @tags regression theme
 */

// Cross-browser E2E #222: firefox and chromium can serialize the same
// computed background-color differently (e.g. rgba vs rgb, or different
// whitespace). normalizeColor extracts the "r,g,b" triple from any
// rgb()/rgba() form so the assertion is engine-agnostic, while still
// asserting the EXACT intended color. DARK_BG = #0a0a0a.
function normalizeColor(color: string): string {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) return color;
  const parts = match[1].split(',').map((p) => p.trim());
  // Drop the alpha channel if present — dark bg is fully opaque.
  return parts.slice(0, 3).join(',');
}
const DARK_BG = '10,10,10';

// The app is served at the Vite base subpath /KTechAICyberWeb/. Playwright's
// baseURL is origin-only (http://localhost:3000), so page.goto('/') works
// (the server 302-redirects / to the subpath) BUT page.goto('/about') hits the
// origin's /about which 404s (no redirect for deep routes). Specs that
// deep-link must include the subpath explicitly.
const BASE = '/KTechAICyberWeb';

test.describe('Dark-theme lock (#239)', { tag: ['@regression', '@theme'] }, () => {
  test.beforeEach(async ({ homePage }) => {
    // Clear localStorage before each test to ensure clean state.
    await homePage.page.goto('/');
    await homePage.page.evaluate(() => {
      localStorage.clear();
    });
    await homePage.goto('/');
  });

  test('locks <html data-theme> to "dark" on first load (no localStorage)', async ({ homePage }) => {
    const htmlElement = homePage.page.locator('html');

    // With empty localStorage the store seeds theme from prefers-color-scheme,
    // but App.vue forces data-theme="dark" regardless. Web-first retry instead
    // of a fixed wait — the app sets the attribute on mount.
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
  });

  test('.theme-toggle is absent from the shipped DOM', async ({ homePage }) => {
    // #239: ThemeToggle.vue was deleted. The toggle button must NOT render.
    // Asserting absence (not just hidden) catches a re-introduction.
    const themeToggle = homePage.page.locator('.theme-toggle');
    await expect(themeToggle).toHaveCount(0);
  });

  test('.theme-toggle is absent on /about and /news too', async ({ page }) => {
    // The toggle would render in the App shell, so it would appear on every
    // routed page if re-introduced. Cover the non-home routes.
    for (const pagePath of [`${BASE}/about`, `${BASE}/news`]) {
      await page.goto(`${BASE}/`);
      await page.evaluate(() => localStorage.clear());
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.theme-toggle')).toHaveCount(0);
    }
  });

  test('resolves --bg-primary to #0a0a0a and keeps it across reloads', async ({ homePage }) => {
    const htmlElement = homePage.page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

    // Variable resolution has NO CSS transition (transitions affect properties
    // that consume the var, like body.backgroundColor, not the var itself), so
    // it settles the instant data-theme is set — deterministic on every engine.
    await expect.poll(
      async () => homePage.page.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim()
      ),
      { timeout: 3000, message: '--bg-primary must resolve to the dark-theme value' },
    ).toBe('#0a0a0a');

    // Reload: dark must persist (it is hardcoded, not persisted — but a stale
    // persisted 'light' must NOT leak into the DOM).
    await homePage.page.evaluate(() => {
      localStorage.setItem('ktech-preferences', JSON.stringify({ theme: 'light', language: 'en' }));
    });
    await homePage.page.reload();
    await homePage.page.waitForLoadState('networkidle');

    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
    await expect.poll(
      async () => homePage.page.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim()
      ),
      { timeout: 3000, message: '--bg-primary must stay dark after reload' },
    ).toBe('#0a0a0a');

    // Belt-and-braces: body.backgroundColor (consumes --bg-primary) must settle
    // to the exact dark value. normalizeColor runs in Node, not the page scope.
    await expect.poll(
      async () => normalizeColor(await homePage.page.evaluate(() => getComputedStyle(document.body).backgroundColor)),
      { timeout: 5000, message: 'body bg must settle to the dark-theme value' },
    ).toBe(DARK_BG);
  });
});
