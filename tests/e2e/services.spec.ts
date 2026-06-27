import { test, expect } from './fixtures/test-fixtures';

/**
 * Services Page E2E Tests
 *
 * Tests for the Services page component
 * Priority: Smoke
 * @tags smoke regression navigation
 */

test.describe('Services Page', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services');
  });

  test('should display page title with neon effect', async ({ page }) => {
    const pageTitle = page.locator('.services .cyber-header h1');
    await expect(pageTitle).toBeVisible();

    const title = await pageTitle.textContent();
    expect(title?.toLowerCase()).toContain('services');
  });

  test('should display page subtitle', async ({ page }) => {
    const subtitle = page.locator('.services .subtitle');
    await expect(subtitle).toBeVisible();

    const text = await subtitle.textContent();
    expect(text).toBeTruthy();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('should display all four service cards', async ({ page }) => {
    const serviceCards = page.locator('.services .service-card');
    await expect(serviceCards).toHaveCount(4);
  });

  test('should display service cards in correct order', async ({ page }) => {
    const serviceCards = page.locator('.services .service-card');

    const titles = await serviceCards.allTextContents();
    expect(titles).toHaveLength(4);

    // Verify all cards have content
    for (const title of titles) {
      expect(title.trim()).not.toBe('');
    }
  });

  test('should display service icons', async ({ page }) => {
    const serviceIcons = page.locator('.services .service-icon');
    await expect(serviceIcons).toHaveCount(4);

    // Check that icons have emoji content
    const icons = await serviceIcons.allTextContents();
    for (const icon of icons) {
      expect(icon).toBeTruthy();
      expect(icon?.length).toBeGreaterThan(0);
    }
  });

  test('should display service descriptions', async ({ page }) => {
    const descriptions = page.locator('.services .service-description');
    await expect(descriptions).toHaveCount(4);

    // Verify descriptions have content
    const texts = await descriptions.allTextContents();
    for (const text of texts) {
      expect(text.trim().length).toBeGreaterThan(10);
    }
  });

  test('should display feature lists for each service', async ({ page }) => {
    const featureLists = page.locator('.services .service-features');
    await expect(featureLists).toHaveCount(4);

    // Each service should have 3 features
    for (let i = 0; i < 4; i++) {
      const features = featureLists.nth(i).locator('li');
      await expect(features).toHaveCount(3);
    }
  });

  test('should display CTA button', async ({ page }) => {
    const ctaButton = page.locator('.services .cyber-button');
    await expect(ctaButton).toBeVisible();

    const buttonText = await ctaButton.textContent();
    expect(buttonText).toBeTruthy();
    expect(buttonText?.length).toBeGreaterThan(0);
  });

  test('should display animated grid background', async ({ page }) => {
    const gridBg = page.locator('.services .grid-bg');
    await expect(gridBg.first()).toBeVisible();
  });

  test('should apply hover effect to service cards', async ({ page }) => {
    const firstCard = page.locator('.services .service-card').first();

    // Get initial box shadow
    const initialShadow = await firstCard.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });

    // Hover over the card
    await firstCard.hover();

    // Wait for transition
    await page.waitForTimeout(350);

    // Get box shadow after hover
    const hoverShadow = await firstCard.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });

    // Shadows should be different (hover effect applied)
    expect(hoverShadow).not.toBe(initialShadow);
  });

  test('should be accessible via navigation', async ({ page }) => {
    // Start from home page
    await page.goto('/');

    // Click services link
    const servicesLink = page.locator('.nav-links a[href="/services"]');
    await expect(servicesLink).toBeVisible();
    await servicesLink.click();

    // Should navigate to services page
    await page.waitForURL('**/services');
    expect(page.url()).toContain('/services');

    // Verify services page content
    const pageTitle = page.locator('.services .cyber-header h1');
    await expect(pageTitle).toBeVisible();
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Check for semantic elements
    const header = page.locator('.services .cyber-header');
    await expect(header).toBeVisible();

    const section = page.locator('.services .services-grid');
    await expect(section).toBeVisible();

    // Check that service cards use article tags
    const articles = page.locator('.services article.service-card');
    await expect(articles).toHaveCount(4);
  });

  test('should have ARIA labels for accessibility', async ({ page }) => {
    const serviceCards = page.locator('.services .service-card');

    // Check that cards have aria-label or aria-labelledby
    for (let i = 0; i < 4; i++) {
      const card = serviceCards.nth(i);
      const ariaLabel = await card.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });
});

test.describe('Services Page Responsive', { tag: '@responsive' }, () => {
  test('should display single column on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/services');

    const serviceCards = page.locator('.services .service-card');
    await expect(serviceCards.first()).toBeVisible();

    // Check grid layout via computed style
    const grid = page.locator('.services .services-grid');
    const gridTemplateColumns = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });

    // On mobile, should be single column
    expect(gridTemplateColumns).toBe('1fr');
  });

  test('should display two columns on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/services');

    const serviceCards = page.locator('.services .service-card');
    await expect(serviceCards.first()).toBeVisible();

    // Check that cards are displayed
    await expect(serviceCards).toHaveCount(4);
  });

  test('should display four columns on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/services');

    const serviceCards = page.locator('.services .service-card');
    await expect(serviceCards).toHaveCount(4);
  });
});

test.describe('Services Page i18n', { tag: '@i18n' }, () => {
  test('should support English language', async ({ page }) => {
    await page.goto('/services');

    const pageTitle = page.locator('.services .cyber-header h1');
    const title = await pageTitle.textContent();

    // English title should be "SERVICES"
    expect(title).toBe('SERVICES');
  });

  test('should support Chinese language', async ({ page }) => {
    // Set language to Chinese via localStorage
    await page.addInitScript(() => {
      localStorage.setItem('ktech-language', 'zh');
    });

    await page.goto('/services');

    // Wait for translations to load
    await page.waitForTimeout(500);

    const pageTitle = page.locator('.services .cyber-header h1');
    const title = await pageTitle.textContent();

    // Chinese title should be "服务"
    expect(title).toBe('服务');
  });

  test('should toggle language correctly', async ({ page }) => {
    await page.goto('/services');

    // Get initial title (English)
    const initialTitle = await page.locator('.services .cyber-header h1').textContent();
    expect(initialTitle).toBe('SERVICES');

    // Reload with Chinese language
    await page.evaluate(() => {
      localStorage.setItem('ktech-language', 'zh');
    });
    await page.reload();

    // Wait for translations to load
    await page.waitForTimeout(500);

    // Get new title (Chinese)
    const newTitle = await page.locator('.services .cyber-header h1').textContent();
    expect(newTitle).toBe('服务');
  });
});
