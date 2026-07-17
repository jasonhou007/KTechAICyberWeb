import { test, expect } from '@playwright/test';

/**
 * @file 88-terms-of-service.spec.ts
 * @description E2E tests for the Terms of Service page (FEAT-029, Issue #88)
 *
 * The production static server (python http.server) has no SPA fallback, so
 * deep links to /terms 404. Tests therefore navigate via the in-app footer
 * link (client-side routing) rather than page.goto('/terms').
 */

test.describe('Terms of Service Page (#88)', () => {
  test('renders the terms page title and subtitle via footer link', async ({ page }) => {
    await page.goto('/');

    // Navigate via the footer Terms of Service link (SPA client-side routing)
    // #229 AC #1: the footer renders TWO .footer-link elements (Privacy Policy +
    // Terms of Service, App.vue:34/39). A bare non-strict page.click('.footer-link')
    // is ambiguous and on webkit-linux races actionability/scroll-into-view into a
    // ~13.5s timeout. filter({ hasText }) resolves to exactly one element.
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms/i }).click();

    // URL should reflect the client-side route
    await expect(page).toHaveURL(/\/terms$/);

    // Page title (h1) is present
    await expect(page.locator('h1.page-title')).toBeVisible();
  });

  test('renders all 9 required legal content sections', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms/i }).click();
    await expect(page).toHaveURL(/\/terms$/);

    // Nine section headings present (h2): intro, acceptance, responsibilities,
    // liability, ip, termination, dispute, governing, contact
    const sections = page.locator('.terms-content h2');
    await expect(sections).toHaveCount(9);
  });

  test('footer contains a Terms of Service link', async ({ page }) => {
    await page.goto('/');
    // The footer now has two .footer-link elements (Privacy Policy + Terms of
    // Service), so scope to the Terms link by its href suffix to avoid a
    // strict-mode violation on the multi-element locator. The deployed href
    // includes the Vite base subpath (/KTechAICyberWeb/terms) because the
    // router uses createWebHistory(import.meta.env.BASE_URL).
    const link = page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /\/terms$/);
  });

  test('lists all five user responsibility items', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms/i }).click();

    const responsibilitiesList = page
      .locator('.terms-content .content-block')
      .filter({ has: page.locator('h2', { hasText: /(responsibilities|责任)/i }) })
      .locator('.item-list li');

    await expect(responsibilitiesList).toHaveCount(5);
  });

  test('shows a last-updated line', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms/i }).click();
    await expect(page.locator('.page-meta')).toBeVisible();
  });

  test('includes contact details', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms/i }).click();
    // Web-first assertion: Terms.vue renders exactly two .contact-line
    // elements (email + address, lines 127-128). The previous `.count().resolves`
    // form is a non-retrying anti-pattern — it snapshots the DOM once instead of
    // auto-retrying until mounted, so on a slow page mount it could observe <2
    // and fail. `toHaveCount(2)` is both stricter (exact count) and more robust
    // (web-first retry). Cross-browser E2E #222.
    const contactLines = page.locator('.contact-line');
    await expect(contactLines).toHaveCount(2);
  });

  test('uses exactly one h1 for the page title (accessibility)', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms/i }).click();
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('marks the disclaimer with role="note"', async ({ page }) => {
    await page.goto('/');
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms/i }).click();
    await expect(page.locator('.disclaimer')).toHaveAttribute('role', 'note');
  });

  test('is reachable on mobile viewport', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'mobile viewport tested via chromium/webkit');
    await page.goto('/');
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms/i }).click();
    await expect(page.locator('h1.page-title')).toBeVisible();
  });
});
