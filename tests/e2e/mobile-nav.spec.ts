import { test, expect } from '@playwright/test';
import { VIEWPORTS } from './fixtures/test-data';

/**
 * Mobile Navigation E2E Tests
 *
 * Tests the responsive hamburger menu, slide-in panel, and accessibility
 * behaviors at mobile viewport (375x667).
 * Priority: P0
 * @tags mobile navigation responsive accessibility
 */

test.describe('Mobile Navigation', () => {
  test.use({ viewport: VIEWPORTS.mobile });

  test('shows hamburger and hides desktop nav links on mobile', async ({ page }) => {
    await page.goto('/');

    // Hamburger button is visible
    await expect(page.locator('.hamburger')).toBeVisible();

    // Desktop nav links are hidden on mobile
    await expect(page.locator('.nav-links')).toBeHidden();
  });

  test('opens the menu on hamburger click and shows the three links', async ({ page }) => {
    await page.goto('/');

    // Initially closed
    await expect(page.locator('.mobile-menu')).toHaveCount(0);

    await page.locator('.hamburger').click();

    // Menu appears with three links
    await expect(page.locator('.mobile-menu')).toBeVisible();
    const links = page.locator('.mobile-menu .menu-link');
    await expect(links).toHaveCount(3);
  });

  test('clicking a menu link navigates and closes the menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hamburger').click();
    await expect(page.locator('.mobile-menu')).toBeVisible();

    // Click the Services link
    await page.locator('.mobile-menu .menu-link').nth(1).click();

    // Menu closed after navigation
    await expect(page.locator('.mobile-menu')).toHaveCount(0);
    await expect(page).toHaveURL(/\/services/);
  });

  test('clicking the backdrop closes the menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hamburger').click();
    await expect(page.locator('.mobile-menu')).toBeVisible();

    // Click the backdrop at the far-left corner where only the backdrop is present
    await page.locator('.menu-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('.mobile-menu')).toHaveCount(0);
  });

  test('pressing Escape closes an open menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hamburger').click();
    await expect(page.locator('.mobile-menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.mobile-menu')).toHaveCount(0);
  });

  test('locks body scroll while the menu is open', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');

    await page.locator('.hamburger').click();
    await expect(page.locator('.mobile-menu')).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    // Close via Escape (the hamburger is occluded by the open panel)
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });

  test('hamburger has correct aria attributes', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.locator('.hamburger');

    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(hamburger).toHaveAttribute('aria-controls', 'mobile-menu');

    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  });

  test('menu panel has dialog semantics when open', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hamburger').click();

    const menu = page.locator('.mobile-menu');
    await expect(menu).toHaveAttribute('role', 'dialog');
    await expect(menu).toHaveAttribute('aria-modal', 'true');
    await expect(menu).toHaveAttribute('aria-label', /.+/);
  });

  test('touch targets are at least 44px tall', async ({ page }) => {
    await page.goto('/');
    await page.locator('.hamburger').click();

    const hamburgerHeight = await page.locator('.hamburger').evaluate(
      (el) => parseFloat(window.getComputedStyle(el).minHeight)
    );
    expect(hamburgerHeight).toBeGreaterThanOrEqual(44);

    const linkHeight = await page.locator('.mobile-menu .menu-link').first().evaluate(
      (el) => parseFloat(window.getComputedStyle(el).minHeight)
    );
    expect(linkHeight).toBeGreaterThanOrEqual(44);
  });

  test('does not produce horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/');
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });
});

test.describe('Desktop Navigation (no hamburger)', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('hamburger is hidden on desktop', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hamburger')).toBeHidden();
    await expect(page.locator('.nav-links')).toBeVisible();
  });
});
