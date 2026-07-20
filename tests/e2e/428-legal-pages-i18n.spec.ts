/**
 * @file 428-legal-pages-i18n.spec.ts
 * @description E2E i18n tests for legal pages (Privacy Policy, Terms of Service) - Issue #428
 *
 * Tests verify:
 * - Privacy page renders in Chinese locale
 * - Terms page renders in Chinese locale
 * - Language toggle switches legal page content
 * - Footer links work in both locales
 */

import { test, expect } from '@playwright/test';

/**
 * BASE URL override for worktree E2E.
 *
 * Playwright's baseURL is origin-only (http://localhost:3001). Direct goto('/privacy')
 * 404s because the router expects the base subpath prefix. Inline BASE='/KTechAICyberWeb/'
 * in test names to construct full URLs. See memory: [[kttech-e2e-baseurl-subpath]].
 */
const BASE = '/KTechAICyberWeb/';

test.describe('Issue #428 - Legal Pages i18n E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start at home page for navigation tests
    await page.goto(`http://localhost:3001${BASE}`);
  });

  test('Privacy page renders in Chinese locale', async ({ page }) => {
    // Switch to Chinese
    const switcher = page.locator('.language-switcher');
    await expect(switcher).toBeVisible();
    await switcher.click();
    await expect(switcher).toContainText('中');

    // Navigate to Privacy Policy
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /Privacy|隐私/i }).click();
    await expect(page).toHaveURL(new RegExp(`privacy$`));

    // Verify Chinese content is rendered (not raw i18n keys)
    const title = page.locator('h1.page-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();

    // Should contain Chinese characters, not raw 'privacy.title' keys
    expect(titleText).toMatch(/[一-龥]/);
    expect(titleText).not.toContain('privacy.title');
    expect(titleText).not.toContain('Privacy');
  });

  test('Terms page renders in Chinese locale', async ({ page }) => {
    // Switch to Chinese
    const switcher = page.locator('.language-switcher');
    await expect(switcher).toBeVisible();
    await switcher.click();
    await expect(switcher).toContainText('中');

    // Navigate to Terms of Service
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms|条款/i }).click();
    await expect(page).toHaveURL(new RegExp(`terms$`));

    // Verify Chinese content is rendered
    const title = page.locator('h1.page-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();

    // Should contain Chinese characters
    expect(titleText).toMatch(/[一-龥]/);
    expect(titleText).not.toContain('terms.title');
    expect(titleText).not.toContain('Terms');
  });

  test('Language toggle switches Privacy page content', async ({ page }) => {
    // Navigate to Privacy Policy in English
    const privacyLink = page.locator('.cyber-footer .footer-link').filter({ hasText: /Privacy/i });
    await privacyLink.click();
    await expect(page).toHaveURL(new RegExp(`privacy$`));

    // Get English title
    const titleEn = page.locator('h1.page-title');
    await expect(titleEn).toBeVisible();
    const titleTextEn = await titleEn.textContent();
    expect(titleTextEn).toContain('Privacy');

    // Switch to Chinese
    const switcher = page.locator('.language-switcher');
    await expect(switcher).toBeVisible();
    await switcher.click();
    await expect(switcher).toContainText('中');

    // Get Chinese title - should be different
    const titleZh = page.locator('h1.page-title');
    await expect(titleZh).toBeVisible();
    const titleTextZh = await titleZh.textContent();

    expect(titleTextZh).not.toBe(titleTextEn);
    expect(titleTextZh).toMatch(/[一-龥]/);
  });

  test('Language toggle switches Terms page content', async ({ page }) => {
    // Navigate to Terms of Service in English
    const termsLink = page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms/i });
    await termsLink.click();
    await expect(page).toHaveURL(new RegExp(`terms$`));

    // Get English title
    const titleEn = page.locator('h1.page-title');
    await expect(titleEn).toBeVisible();
    const titleTextEn = await titleEn.textContent();
    expect(titleTextEn).toContain('Terms');

    // Switch to Chinese
    const switcher = page.locator('.language-switcher');
    await expect(switcher).toBeVisible();
    await switcher.click();
    await expect(switcher).toContainText('中');

    // Get Chinese title - should be different
    const titleZh = page.locator('h1.page-title');
    await expect(titleZh).toBeVisible();
    const titleTextZh = await titleZh.textContent();

    expect(titleTextZh).not.toBe(titleTextEn);
    expect(titleTextZh).toMatch(/[一-龥]/);
  });

  test('Footer links work in English locale', async ({ page }) => {
    // Verify language is English
    const switcher = page.locator('.language-switcher');
    await expect(switcher).toBeVisible();
    await expect(switcher).toContainText('EN');

    // Test Privacy link
    const privacyLink = page.locator('.cyber-footer .footer-link').filter({ hasText: /Privacy/i });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', new RegExp(`${BASE}privacy$`));

    // Test Terms link
    const termsLink = page.locator('.cyber-footer .footer-link').filter({ hasText: /Terms/i });
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', new RegExp(`${BASE}terms$`));
  });

  test('Footer links work in Chinese locale', async ({ page }) => {
    // Switch to Chinese
    const switcher = page.locator('.language-switcher');
    await expect(switcher).toBeVisible();
    await switcher.click();
    await expect(switcher).toContainText('中');

    // Test Privacy link (隐私政策)
    const privacyLink = page.locator('.cyber-footer .footer-link').filter({ hasText: /隐私政策/i });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', new RegExp(`${BASE}privacy$`));

    // Test Terms link (服务条款)
    const termsLink = page.locator('.cyber-footer .footer-link').filter({ hasText: /服务条款/i });
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', new RegExp(`${BASE}terms$`));
  });

  test('Chinese disclaimer renders correctly on Privacy page', async ({ page }) => {
    // Switch to Chinese
    const switcher = page.locator('.language-switcher');
    await expect(switcher).toBeVisible();
    await switcher.click();
    await expect(switcher).toContainText('中');

    // Navigate to Privacy Policy
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /隐私政策|Privacy Policy/i }).click();
    await expect(page).toHaveURL(new RegExp(`privacy$`));

    // Verify disclaimer contains Chinese
    const disclaimer = page.locator('.disclaimer[role="note"]');
    await expect(disclaimer).toBeVisible();
    const disclaimerText = await disclaimer.textContent();

    expect(disclaimerText).toMatch(/[一-龥]/);
    expect(disclaimerText).not.toContain('disclaimer');
  });

  test('Chinese disclaimer renders correctly on Terms page', async ({ page }) => {
    // Switch to Chinese
    const switcher = page.locator('.language-switcher');
    await expect(switcher).toBeVisible();
    await switcher.click();
    await expect(switcher).toContainText('中');

    // Navigate to Terms of Service
    await page.locator('.cyber-footer .footer-link').filter({ hasText: /服务条款|Terms of Service/i }).click();
    await expect(page).toHaveURL(new RegExp(`terms$`));

    // Verify disclaimer contains Chinese
    const disclaimer = page.locator('.disclaimer[role="note"]');
    await expect(disclaimer).toBeVisible();
    const disclaimerText = await disclaimer.textContent();

    expect(disclaimerText).toMatch(/[一-龥]/);
    expect(disclaimerText).not.toContain('disclaimer');
  });
});
