import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to home page', async ({ page }) => {
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('KTech AI');
  });

  test('should navigate to about page', async ({ page }) => {
    await page.click('text=About');
    await expect(page).toHaveURL('/about');
    await expect(page.locator('h1, h2')).toContainText(/about|KTech AI/i);
  });

  test('should navigate back to home from about', async ({ page }) => {
    await page.click('text=About');
    await expect(page).toHaveURL('/about');

    await page.click('text=Home');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('KTech AI');
  });

  test('should have working navigation links', async ({ page }) => {
    const navLinks = page.locator('.nav-links a');
    await expect(navLinks).toHaveCount(2);

    const homeLink = page.locator('.nav-links a').first();
    await expect(homeLink).toHaveAttribute('href', '/');

    const aboutLink = page.locator('.nav-links a').nth(1);
    await expect(aboutLink).toHaveAttribute('href', '/about');
  });

  test('should highlight active navigation link', async ({ page }) => {
    const homeLink = page.locator('.nav-links a').first();
    await expect(homeLink).toHaveClass(/router-link-active/);

    await page.click('text=About');
    const aboutLink = page.locator('.nav-links a').nth(1);
    await expect(aboutLink).toHaveClass(/router-link-active/);
  });

  test('should navigate using browser back button', async ({ page }) => {
    await page.click('text=About');
    await expect(page).toHaveURL('/about');

    await page.goBack();
    await expect(page).toHaveURL('/');

    await page.goForward();
    await expect(page).toHaveURL('/about');
  });
});
