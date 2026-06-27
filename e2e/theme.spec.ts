import { test, expect } from '@playwright/test';

test.describe('Theme and Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display cyberpunk styling on home page', async ({ page }) => {
    // Check for neon text effect
    const h1 = page.locator('h1');
    await expect(h1).toContainText('KTech AI');

    // Check for cyber card
    const cyberCard = page.locator('.cyber-card');
    await expect(cyberCard).toBeVisible();
    await expect(cyberCard).toContainText('Next Generation AI');
  });

  test('should display footer with status', async ({ page }) => {
    const footer = page.locator('.cyber-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('All systems operational');

    const statusDot = page.locator('.status-dot');
    await expect(statusDot).toBeVisible();
    await expect(statusDot).toHaveCSS('background', /rgb\(0,\s*240,\s*255\)|#00f0ff/i);
  });

  test('should display feature cards', async ({ page }) => {
    const featureCards = page.locator('.feature-card');
    await expect(featureCards).toHaveCount(3);

    // Check AI Models feature
    await expect(featureCards.nth(0)).toContainText('AI Models');
    await expect(featureCards.nth(0)).toContainText('Advanced neural networks');

    // Check Real-time feature
    await expect(featureCards.nth(1)).toContainText('Real-time');
    await expect(featureCards.nth(1)).toContainText('Lightning-fast');

    // Check Secure feature
    await expect(featureCards.nth(2)).toContainText('Secure');
    await expect(featureCards.nth(2)).toContainText('Enterprise-grade');
  });

  test('should display stats section', async ({ page }) => {
    const stats = page.locator('.stats');
    await expect(stats).toBeVisible();

    const statValues = page.locator('.stat-value');
    await expect(statValues).toHaveCount(3);

    await expect(statValues.nth(0)).toContainText('99.9%');
    await expect(statValues.nth(1)).toContainText('1M+');
    await expect(statValues.nth(2)).toContainText('50ms');
  });

  test('should have working CTA button', async ({ page }) => {
    const button = page.locator('.cyber-button');
    await expect(button).toBeVisible();
    await expect(button).toContainText('Get Started');

    // Check button has hover effects
    await button.hover();
    await expect(button).toHaveCSS('cursor', 'pointer');
  });

  test('should display animated background grid', async ({ page }) => {
    const gridBg = page.locator('.grid-bg');
    await expect(gridBg).toHaveCount(2);
  });

  test('should have proper meta tags', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/KTech/);

    // Check viewport meta
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Check for main content
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Check for nav
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Check for footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});
