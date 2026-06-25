import { test, expect } from '@playwright/test';

test.describe('KTech Cyber Homepage - TDD Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/KTech|开泰科技/);
  });

  test('should display hero section with KBIGHT logo', async ({ page }) => {
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
    
    const title = page.locator('.hero-title');
    await expect(title).toContainText('开泰科技');
  });

  test('should have navigation with logo', async ({ page }) => {
    const nav = page.locator('.nav');
    await expect(nav).toBeVisible();
    
    const logo = page.locator('.nav-logo');
    await expect(logo).toBeVisible();
  });

  test('should display core services section', async ({ page }) => {
    const services = page.locator('#services');
    await expect(services).toBeVisible();
    
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(6);
  });

  test('should have honors section with badges', async ({ page }) => {
    const honors = page.locator('#honors');
    await expect(honors).toBeVisible();
    
    const badges = page.locator('.honor-badge');
    await expect(badges).toHaveCount(8);
  });

  test('should have contact section', async ({ page }) => {
    const contact = page.locator('#contact');
    await expect(contact).toBeVisible();
  });

  test('should have particle animations', async ({ page }) => {
    const particles = page.locator('.particle');
    await expect(particles).toHaveCount(30);
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    const nav = page.locator('.nav');
    await expect(nav).toBeVisible();
  });

  test('should have fade-in animations on scroll', async ({ page }) => {
    const fadeElements = page.locator('.fade-in');
    await expect(fadeElements.first()).toBeVisible();
    
    // Scroll and check if elements become visible
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
  });

  test('should have proper SEO meta tags', async ({ page }) => {
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /开泰远景信息科技有限公司/);
    
    const keywords = page.locator('meta[name="keywords"]');
    await expect(keywords).toHaveAttribute('content', /开泰科技|KBIGHT/);
  });
});
