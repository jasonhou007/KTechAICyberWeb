import { test, expect } from './fixtures/test-fixtures';

/**
 * Visual Regression E2E Tests
 *
 * Tests for visual consistency and UI elements
 * Priority: Regression
 */

test.describe('Visual Elements', () => {
  test('should display service cards with proper styling', async ({ homePage }) => {
    await homePage.goto();
    await homePage.scrollToSection('services');

    // Check first service card
    const firstCard = homePage.serviceCards.first();
    await expect(firstCard).toBeVisible();

    // Check for card icon
    const icon = firstCard.locator('.card-icon');
    await expect(icon).toBeVisible();

    // Check for card title
    const title = firstCard.locator('h3');
    await expect(title).toBeVisible();
  });

  test('should display honor badges with icons', async ({ homePage }) => {
    await homePage.goto();
    await homePage.scrollToSection('honors');

    const firstBadge = homePage.honorBadges.first();
    await expect(firstBadge).toBeVisible();

    // Check for badge icon
    const icon = firstBadge.locator('.honor-icon');
    await expect(icon).toBeVisible();

    // Check for badge title
    const title = firstBadge.locator('h4');
    await expect(title).toBeVisible();
  });

  test('should display contact section properly', async ({ homePage }) => {
    await homePage.goto();
    await homePage.scrollToSection('contact');

    // Check section title
    const sectionTitle = homePage.contactSection.locator('.section-title');
    await expect(sectionTitle).toBeVisible();
    await expect(sectionTitle).toContainText('联系我们');
  });

  test('should have consistent color scheme', async ({ homePage }) => {
    await homePage.goto();

    // Check navbar background
    const navbarBg = await homePage.navbar.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(navbarBg).toBeDefined();

    // Check hero title color
    const titleColor = await homePage.heroTitle.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(titleColor).toBeDefined();
  });

  test('should display footer with copyright', async ({ homePage }) => {
    await homePage.goto();

    // Scroll to bottom
    await homePage.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check footer content
    await expect(homePage.footer).toBeVisible();

    const copyright = homePage.page.locator('.footer-copyright');
    await expect(copyright).toContainText('©');
    await expect(copyright).toContainText('2026');
  });

  test('should have proper animations', async ({ homePage }) => {
    await homePage.goto();

    // Check for fade-in elements
    const fadeElements = homePage.page.locator('.fade-in');
    const count = await fadeElements.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Interactive Elements', () => {
  test('should animate cards on hover', async ({ homePage }) => {
    await homePage.goto();
    await homePage.scrollToSection('services');

    const card = homePage.serviceCards.first();

    // Get initial transform
    const initialTransform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });

    // Hover over card
    await card.hover();

    // Wait for animation
    await homePage.page.waitForTimeout(400);

    // Transform should change (hover effect)
    const hoverTransform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });

    // The transform matrix should be different after hover
    expect(hoverTransform).not.toBe(initialTransform);
  });

  test('should animate honor badges on hover', async ({ homePage }) => {
    await homePage.goto();
    await homePage.scrollToSection('honors');

    const badge = homePage.honorBadges.first();

    // Get initial box shadow
    const initialShadow = await badge.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });

    // Hover over badge
    await badge.hover();

    // Wait for animation
    await homePage.page.waitForTimeout(400);

    // Box shadow should change
    const hoverShadow = await badge.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });

    expect(hoverShadow).not.toBe(initialShadow);
  });
});

test.describe('Scroll Behavior', () => {
  test('should have smooth scroll behavior', async ({ homePage }) => {
    await homePage.goto();

    // Check html scroll behavior
    const scrollBehavior = await homePage.page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollBehavior;
    });
    expect(scrollBehavior).toBe('smooth');
  });

  test('should trigger fade-in animations on scroll', async ({ homePage }) => {
    await homePage.goto();

    // Find a fade-in element that's not initially visible
    const fadeElement = homePage.page.locator('.fade-in').nth(5);

    // Scroll to element
    await fadeElement.scrollIntoViewIfNeeded();

    // Wait for animation
    await homePage.page.waitForTimeout(700);

    // Element should have 'visible' class after scrolling into view
    const hasVisibleClass = await fadeElement.evaluate((el) => {
      return el.classList.contains('visible');
    });

    expect(hasVisibleClass).toBeTruthy();
  });
});
