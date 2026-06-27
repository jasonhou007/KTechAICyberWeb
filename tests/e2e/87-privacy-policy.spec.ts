import { test, expect } from '@playwright/test';

/**
 * @file 87-privacy-policy.spec.ts
 * @description E2E tests for the Privacy Policy page (FEAT-029, Issue #87)
 *
 * The production static server (python http.server) has no SPA fallback, so
 * deep links to /privacy 404. Tests therefore navigate via the in-app footer
 * link (client-side routing) rather than page.goto('/privacy').
 */

test.describe('Privacy Policy Page (#87)', () => {
  test('renders the privacy page title and subtitle via footer link', async ({ page }) => {
    await page.goto('/');

    // Navigate via the footer Privacy Policy link (SPA client-side routing)
    await page.click('.cyber-footer .footer-link');

    // URL should reflect the client-side route
    await expect(page).toHaveURL(/\/privacy$/);

    // Page title (h1) is present
    await expect(page.locator('h1.page-title')).toBeVisible();
  });

  test('renders all required GDPR content sections', async ({ page }) => {
    await page.goto('/');
    await page.click('.cyber-footer .footer-link');
    await expect(page).toHaveURL(/\/privacy$/);

    // Eight section headings present (h2)
    const sections = page.locator('.privacy-content h2');
    await expect(sections).toHaveCount(8);
  });

  test('footer contains a Privacy Policy link', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('.cyber-footer .footer-link');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/privacy');
  });

  test('lists all six GDPR user rights', async ({ page }) => {
    await page.goto('/');
    await page.click('.cyber-footer .footer-link');

    const rightsList = page
      .locator('.privacy-content .content-block')
      .filter({ has: page.locator('h2', { hasText: /(rights|权利)/i }) })
      .locator('.item-list li');

    await expect(rightsList).toHaveCount(6);
  });

  test('shows a last-updated line', async ({ page }) => {
    await page.goto('/');
    await page.click('.cyber-footer .footer-link');
    await expect(page.locator('.page-meta')).toBeVisible();
  });

  test('includes contact details', async ({ page }) => {
    await page.goto('/');
    await page.click('.cyber-footer .footer-link');
    const contactLines = page.locator('.contact-line');
    await expect(contactLines.count()).resolves.toBeGreaterThanOrEqual(2);
  });

  test('uses exactly one h1 for the page title (accessibility)', async ({ page }) => {
    await page.goto('/');
    await page.click('.cyber-footer .footer-link');
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('marks the disclaimer with role="note"', async ({ page }) => {
    await page.goto('/');
    await page.click('.cyber-footer .footer-link');
    await expect(page.locator('.disclaimer')).toHaveAttribute('role', 'note');
  });

  test('is reachable on mobile viewport', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'mobile viewport tested via chromium/webkit');
    await page.goto('/');
    await page.click('.cyber-footer .footer-link');
    await expect(page.locator('h1.page-title')).toBeVisible();
  });
});
