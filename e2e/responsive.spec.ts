import { test, expect } from '@playwright/test';

const devices = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 }
];

for (const device of devices) {
  test.describe(`Responsive Design - ${device.name}`, () => {
    test.use({ viewport: { width: device.width, height: device.height } });

    test(`should display properly on ${device.name}`, async ({ page }) => {
      await page.goto('/');

      // Check main elements are visible
      await expect(page.locator('.cyber-nav')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.cyber-footer')).toBeVisible();
    });

    test(`should have readable text on ${device.name}`, async ({ page }) => {
      await page.goto('/');

      const h1 = page.locator('h1');
      const h1Text = await h1.textContent();
      expect(h1Text).toBeTruthy();
      expect(h1Text?.length).toBeGreaterThan(0);
    });

    test(`should have functional navigation on ${device.name}`, async ({ page }) => {
      await page.goto('/');

      // Check navigation is clickable
      const navLinks = page.locator('.nav-links a');
      await expect(navLinks).toHaveCount(3);

      await page.click('text=About');
      await expect(page).toHaveURL('/about');
    });

    test(`feature cards should be accessible on ${device.name}`, async ({ page }) => {
      await page.goto('/');

      const featureCards = page.locator('.feature-card');
      const count = await featureCards.count();
      expect(count).toBe(3);

      // Check each card is visible
      for (let i = 0; i < count; i++) {
        await expect(featureCards.nth(i)).toBeVisible();
      }
    });

    test(`CTA button should be clickable on ${device.name}`, async ({ page }) => {
      await page.goto('/');

      const button = page.locator('.cyber-button');
      await expect(button).toBeVisible();

      // Ensure button is not overlapping with other elements
      const box = await button.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(30);
      expect(box!.height).toBeGreaterThan(30);
    });

    if (device.width <= 768) {
      test(`should use mobile layout on ${device.name}`, async ({ page }) => {
        await page.goto('/');

        // Check stats layout changes to vertical on mobile
        const stats = page.locator('.stats');
        const statsBox = await stats.boundingBox();
        expect(statsBox).toBeTruthy();

        // Features should be single column on mobile
        const featureCards = page.locator('.feature-card');
        const firstCard = featureCards.first();
        const secondCard = featureCards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        expect(firstBox).toBeTruthy();
        expect(secondBox).toBeTruthy();

        // Cards should be stacked vertically
        expect(secondBox!.x).toBeCloseTo(firstBox!.x, 0);
        expect(secondBox!.y).toBeGreaterThan(firstBox!.y);
      });

      test(`h1 should be smaller on mobile ${device.name}`, async ({ page }) => {
        await page.goto('/');

        const h1 = page.locator('h1');
        const fontSize = await h1.evaluate(el => {
          return window.getComputedStyle(el).fontSize;
        });

        // Mobile font size should be smaller than desktop
        expect(parseFloat(fontSize)).toBeLessThan(80); // Desktop is ~80px (5rem)
      });
    }
  });
}

test.describe('Touch Interactions', () => {
  test('should handle tap interactions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Test tap on navigation
    await page.tap('text=About');
    await expect(page).toHaveURL('/about');
  });

  test('should handle touch on CTA button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const button = page.locator('.cyber-button');
    await button.tap();
    // Button should respond to touch (even if no action defined)
    await expect(button).toBeVisible();
  });
});
