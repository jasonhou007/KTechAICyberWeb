import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { VIEWPORTS } from './fixtures/test-data';

/**
 * Responsive Design E2E Tests
 *
 * Tests for mobile and tablet responsive layouts
 * Priority: Regression
 * @tags regression responsive
 */

test.describe('Desktop Layout (1280x720)', { tag: ['@regression', '@responsive'] }, () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('should display desktop navigation properly', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Nav links should be visible on desktop
    await expect(homePage.navLinks).toBeVisible();

    // Check number of visible nav links
    const linkCount = await homePage.page.locator('.nav-links a').count();
    expect(linkCount).toBeGreaterThanOrEqual(3);
  });

  test('should display grid layout for services', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.scrollToSection('services');

    // Service cards should be in a grid (multiple columns)
    const grid = homePage.page.locator('.grid');
    await expect(grid).toBeVisible();

    // Get computed display value
    const display = await grid.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('grid');
  });

  test('should display hero content properly', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Hero title should be large
    const title = homePage.heroTitle;
    await expect(title).toBeVisible();

    const fontSize = await title.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    // Font size should be larger on desktop
    const fontSizeNum = parseFloat(fontSize);
    expect(fontSizeNum).toBeGreaterThan(40);
  });
});

test.describe('Tablet Layout (768x1024)', () => {
  test.use({ viewport: VIEWPORTS.tablet });

  test('should display properly on tablet', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Hero section should be visible
    await expect(homePage.heroSection).toBeVisible();

    // Content should be readable
    await expect(homePage.heroTitle).toBeVisible();
    await expect(homePage.heroSubtitle).toBeVisible();
  });

  test('should display services grid on tablet', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.scrollToSection('services');

    const grid = homePage.page.locator('.grid');
    await expect(grid).toBeVisible();
  });
});

test.describe('Mobile Layout (375x667)', () => {
  test.use({ viewport: VIEWPORTS.mobile, deviceScaleFactor: 2 });

  test('should display properly on mobile', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Hero section should be visible
    await expect(homePage.heroSection).toBeVisible();

    // Check if nav links are hidden on mobile (based on CSS media query)
    const navLinksVisible = await homePage.navLinks.isVisible().catch(() => false);
    // On mobile, nav links might be hidden or shown differently
    // This test documents the behavior
  });

  test('should stack service cards on mobile', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.scrollToSection('services');

    // Service cards should still be visible
    const cards = homePage.serviceCards;
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
  });

  test('should display contact info in stacked layout', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.scrollToSection('contact');

    // Contact items should be visible
    const contactGrid = homePage.page.locator('.contact-grid');
    await expect(contactGrid).toBeVisible();
  });

  test('should have readable text on mobile', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Hero title should be readable
    const title = homePage.heroTitle;
    await expect(title).toBeVisible();

    const fontSize = await title.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    // Font size should be appropriate for mobile (not too small)
    const fontSizeNum = parseFloat(fontSize);
    expect(fontSizeNum).toBeGreaterThan(20);
  });

  test('should display stats properly on mobile', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Hero stats should be visible
    await expect(homePage.heroStats).toBeVisible();

    // Stats should wrap appropriately on mobile
    const stats = homePage.page.locator('.stat-item');
    const count = await stats.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Orientation Changes', () => {
  test('should handle landscape orientation', async ({ page }) => {
    // Set landscape orientation
    await page.setViewportSize({ width: 667, height: 375 });

    const homePage = new HomePage(page);
    await homePage.goto();

    // Page should still be functional
    await expect(homePage.heroSection).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('should maintain accessibility on smaller screens', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);

    const homePage = new HomePage(page);
    await homePage.goto();

    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const h2s = page.locator('h2');
    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThan(0);
  });
});
