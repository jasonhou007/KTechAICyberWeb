import { test, expect } from './fixtures/test-fixtures';
import { EXPECTED_HERO, EXPECTED_SERVICES, EXPECTED_HONORS, EXPECTED_CONTACT_ITEMS } from './fixtures/test-data';

/**
 * Homepage E2E Tests
 *
 * Tests for the homepage loading and content display
 * Priority: Smoke
 * @tags smoke regression
 */

test.describe('Homepage Loading', { tag: '@smoke' }, () => {
  test('should load homepage successfully', async ({ homePage }) => {
    await homePage.goto();

    // Verify URL
    expect(homePage.getUrl()).toContain('/');

    // Verify page title
    await expect(homePage.page).toHaveTitle(/开泰科技|KTech|KBight/);

    // Verify navbar is visible
    await expect(homePage.navbar).toBeVisible();

    // Verify hero section is visible
    await expect(homePage.heroSection).toBeVisible();
  });

  test('should display hero content correctly', async ({ homePage }) => {
    await homePage.goto();

    const title = await homePage.getHeroTitle();
    const subtitle = await homePage.getHeroSubtitle();

    // Verify main title contains expected text
    expect(title).toContain(EXPECTED_HERO.mainTitle);

    // Verify subtitle contains company description
    expect(subtitle).toContain(EXPECTED_HERO.subtitle);
  });

  test('should display hero statistics', async ({ homePage }) => {
    await homePage.goto();

    // Verify hero stats section is visible
    await expect(homePage.heroStats).toBeVisible();

    // Check for stat numbers
    const statNumbers = homePage.page.locator('.stat-number');
    const count = await statNumbers.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should hide loading spinner after page load', async ({ homePage }) => {
    await homePage.goto();

    // Wait for loading spinner to be hidden
    await expect(homePage.loadingSpinner).toHaveClass(/hidden/);
  });

  test('should have footer visible', async ({ homePage }) => {
    await homePage.goto();

    // Scroll to bottom
    await homePage.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify footer is visible
    await expect(homePage.footer).toBeVisible();
  });
});

test.describe('Homepage Content', () => {
  test('should display all service cards', async ({ homePage }) => {
    await homePage.goto();

    // Scroll to services section
    await homePage.scrollToSection('services');

    // Get service card count
    const cardCount = await homePage.getServiceCardCount();

    // Verify we have the expected number of service cards
    expect(cardCount).toBe(EXPECTED_SERVICES.length);

    // Verify each service card
    for (let i = 0; i < EXPECTED_SERVICES.length; i++) {
      const details = await homePage.getServiceCardDetails(i);
      expect(details.title).toBe(EXPECTED_SERVICES[i].title);
    }
  });

  test('should display all honor badges', async ({ homePage }) => {
    await homePage.goto();

    // Scroll to honors section
    await homePage.scrollToSection('honors');

    // Get honor badge count
    const badgeCount = await homePage.getHonorBadgeCount();

    // Verify we have honor badges
    expect(badgeCount).toBeGreaterThanOrEqual(EXPECTED_HONORS.length);
  });

  test('should display contact information', async ({ homePage }) => {
    await homePage.goto();

    // Scroll to contact section
    await homePage.scrollToSection('contact');

    // Get contact item count
    const itemCount = await homePage.page.locator('.contact-item').count();

    // Verify we have contact items
    expect(itemCount).toBe(EXPECTED_CONTACT_ITEMS.length);
  });
});

test.describe('Homepage Visual Elements', () => {
  test('should have cyberpunk styling elements', async ({ homePage }) => {
    await homePage.goto();

    // Check for scanlines
    const scanlines = homePage.page.locator('.scanlines');
    await expect(scanlines).toBeVisible();

    // Check for hero background
    const heroBg = homePage.page.locator('.hero-bg');
    await expect(heroBg).toBeVisible();
  });

  test('should display company logo in navigation', async ({ homePage }) => {
    await homePage.goto();

    // Verify nav logo contains expected text
    await expect(homePage.navLogo).toContainText('KAI');
    await expect(homePage.navLogo).toContainText('TECH');
  });
});
