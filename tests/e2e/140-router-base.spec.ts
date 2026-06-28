import { test, expect } from '@playwright/test';

/**
 * Router base prefix regression tests — #140
 *
 * The app is deployed at the GitHub Pages subpath /KTechAICyberWeb/. Before
 * the fix the router used createWebHistory() with no base, so the SPA matched
 * no route under the subpath and the production site rendered BLANK. The dev
 * server (vite) serves the app at the same base (see `base` in vite.config.js),
 * so Playwright's `page.goto('/KTechAICyberWeb/...')` exercises the real base.
 *
 * These tests guard against the regression ever coming back:
 *   - home renders real content under the base path (not blank)
 *   - a known deep sub-route renders its content under the base path
 *   - an unknown route renders the NotFound view (not blank)
 *
 * Tags: @regression @routing
 */

// All paths are relative to Playwright's baseURL (http://localhost:3000).
// Because vite serves at base '/KTechAICyberWeb/', the full URL becomes
// http://localhost:3000/KTechAICyberWeb/...
const BASE = '/KTechAICyberWeb/';

test.describe('Router base prefix (#140)', () => {
  test('home page renders real content under the base path', async ({ page }) => {
    await page.goto(BASE);

    // The navbar is rendered for every route by Header.vue (mounted in App.vue
    // via <Header />, #164 nav overhaul) — if the router failed to mount under
    // the base, even this would be missing (blank page).
    await expect(page.locator('nav#navbar')).toBeVisible();

    // Home-specific content: the hero <h1> only exists when the Home view
    // mounts. Before the #140 fix the router matched no route under the
    // subpath, so <router-view> rendered nothing — no h1, no footer. Asserting
    // the h1 element is present+visible is the regression signal. We do NOT
    // assert translated copy because i18n loads asynchronously (and the dev
    // server's locale fetch has a pre-existing base-path quirk); a blank page
    // has no h1 element at all, which is what we are guarding against.
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    // And the footer (also App-level) — confirms the whole shell rendered.
    await expect(page.locator('.cyber-footer')).toBeVisible();
  });

  test('deep sub-route renders under the base path (not blank)', async ({ page }) => {
    await page.goto(`${BASE}about`);

    await expect(page.locator('nav#navbar')).toBeVisible();
    // About view must mount and render a heading. We don't pin exact text
    // (i18n may be EN or ZH), but a blank page has no h1/h2 at all.
    await expect(page.locator('h1, h2').first()).toBeVisible();
    // URL keeps the base prefix (history mode with the correct base).
    await expect(page).toHaveURL(/\/KTechAICyberWeb\/about/);
  });

  test('unknown route renders NotFound (not blank)', async ({ page }) => {
    await page.goto(`${BASE}this-route-does-not-exist-140`);

    await expect(page.locator('nav#navbar')).toBeVisible();
    // NotFound view must render its landmark. The 404 message is i18n-driven;
    // assert the dedicated container exists rather than blankness.
    await expect(page.locator('.not-found')).toBeVisible();
    // And it offers a way home.
    await expect(page.locator('.not-found a, .not-found button').first()).toBeVisible();
  });
});
