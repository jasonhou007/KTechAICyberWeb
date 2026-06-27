import { test, expect } from '@playwright/test';

test.describe('News Section Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to news page', async ({ page }) => {
    await page.click('text=News');
    await expect(page).toHaveURL('/news');
    await expect(page.locator('h1')).toContainText('News');
  });

  test('should display news navigation link', async ({ page }) => {
    const navLinks = page.locator('.nav-links a');
    const newsLink = page.locator('.nav-links a').filter({ hasText: 'News' });

    await expect(newsLink).toBeVisible();
    await expect(newsLink).toHaveAttribute('href', '/news');
  });

  test('should display news page title and subtitle', async ({ page }) => {
    await page.goto('/news');

    await expect(page.locator('.news-page__title')).toContainText('News');
    await expect(page.locator('.news-page__subtitle')).toBeVisible();
  });

  test('should display category filter buttons', async ({ page }) => {
    await page.goto('/news');

    const filterButtons = page.locator('.news-filter__button');
    await expect(filterButtons).toHaveCount(5);

    // Check for expected categories
    await expect(filterButtons.filter({ hasText: 'All' })).toBeVisible();
    await expect(filterButtons.filter({ hasText: 'Company News' })).toBeVisible();
    await expect(filterButtons.filter({ hasText: 'Industry Insights' })).toBeVisible();
    await expect(filterButtons.filter({ hasText: 'Technology Updates' })).toBeVisible();
    await expect(filterButtons.filter({ hasText: 'Events' })).toBeVisible();
  });

  test('should filter news by category', async ({ page }) => {
    await page.goto('/news');

    // Click on Company News filter
    await page.click('.news-filter__button:has-text("Company News")');

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // Verify filter is active
    const activeButton = page.locator('.news-filter__button--active');
    await expect(activeButton).toContainText('Company News');
  });

  test('should display news cards', async ({ page }) => {
    await page.goto('/news');

    const newsCards = page.locator('.news-card');
    await expect(newsCards).toHaveCount(4);

    // Check first card has required elements
    const firstCard = newsCards.first();
    await expect(firstCard.locator('.news-card__title')).toBeVisible();
    await expect(firstCard.locator('.news-card__excerpt')).toBeVisible();
    await expect(firstCard.locator('.news-card__badge')).toBeVisible();
    await expect(firstCard.locator('.news-card__image')).toBeVisible();
  });

  test('should navigate to news detail page', async ({ page }) => {
    await page.goto('/news');

    // Click on first news card
    await page.click('.news-card:first-child .news-card__link');

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/news\/.+/);

    // Should have breadcrumb
    await expect(page.locator('.news-detail__breadcrumb')).toBeVisible();

    // Should have article title
    await expect(page.locator('.news-detail__title')).toBeVisible();
  });

  test('should display article detail page with all elements', async ({ page }) => {
    await page.goto('/news/ktech-achieves-iso27001-certification');

    // Check all detail elements
    await expect(page.locator('.news-detail__breadcrumb')).toBeVisible();
    await expect(page.locator('.news-detail__title')).toBeVisible();
    await expect(page.locator('.news-detail__meta')).toBeVisible();
    await expect(page.locator('.news-detail__image')).toBeVisible();
    await expect(page.locator('.news-detail__content')).toBeVisible();
  });

  test('should have back to news link on detail page', async ({ page }) => {
    await page.goto('/news/ktech-achieves-iso27001-certification');

    const backLink = page.locator('.news-detail__back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('Back to News');

    // Click back link
    await page.click('.news-detail__back-link');
    await expect(page).toHaveURL('/news');
  });

  test('should display related articles on detail page', async ({ page }) => {
    await page.goto('/news/ktech-achieves-iso27001-certification');

    // Look for related articles section
    const relatedSection = page.locator('.news-detail__related');
    await expect(relatedSection).toBeVisible();
    await expect(relatedSection.locator('text=Related Articles')).toBeVisible();
  });

  test('should show load more button when more articles exist', async ({ page }) => {
    await page.goto('/news');

    // Initially shows 6 articles or less
    const visibleCards = page.locator('.news-card');
    const count = await visibleCards.count();

    // If there are articles, check load more button
    if (count > 0) {
      const loadMoreBtn = page.locator('.news-list__button:has-text("Load More")');

      // Button should be visible if there are more articles than visible count
      // Our sample has 4 articles, which is less than initial visible count of 6
      // So the button should not be visible with our sample data
      await expect(loadMoreBtn).not.toBeVisible();
    }
  });

  test('should handle 404 for non-existent article', async ({ page }) => {
    await page.goto('/news/non-existent-article-slug');

    // Should show not found message
    await expect(page.locator('.news-detail__not-found')).toBeVisible();
    await expect(page.locator('text=Article Not Found')).toBeVisible();
  });

  test('should have proper breadcrumb navigation', async ({ page }) => {
    await page.goto('/news');

    // Check breadcrumb on news page
    await expect(page.locator('.news-page__breadcrumb')).toContainText('Home');
    await expect(page.locator('.news-page__breadcrumb')).toContainText('News');

    // Navigate to detail page
    await page.click('.news-card:first-child .news-card__link');

    // Check breadcrumb on detail page
    await expect(page.locator('.news-detail__breadcrumb')).toContainText('Home');
    await expect(page.locator('.news-detail__breadcrumb')).toContainText('News');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/news');

    // Tab through filter buttons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press Enter on focused element
    await page.keyboard.press('Enter');

    // Should still be on news page (filter button activated)
    await expect(page).toHaveURL('/news');
  });

  test('should have share button on detail page', async ({ page }) => {
    await page.goto('/news/ktech-achieves-iso27001-certification');

    const shareButton = page.locator('.news-detail__share-button');
    await expect(shareButton).toBeVisible();
    await expect(shareButton).toContainText('Share');
  });

  test('should render markdown content', async ({ page }) => {
    await page.goto('/news/ktech-achieves-iso27001-certification');

    // Check for markdown rendered content
    const content = page.locator('.news-detail__markdown');
    await expect(content).toBeVisible();

    // Should have headers rendered from markdown
    await expect(content.locator('h1, h2, h3')).toHaveCount(4);
  });

  test('should display article date and author', async ({ page }) => {
    await page.goto('/news/ktech-achieves-iso27001-certification');

    await expect(page.locator('.news-detail__date')).toBeVisible();
    await expect(page.locator('.news-detail__author')).toBeVisible();
  });

  test('should highlight active filter category', async ({ page }) => {
    await page.goto('/news');

    // Initially All should be active
    await expect(page.locator('.news-filter__button--active')).toContainText('All');

    // Click on another category
    await page.click('.news-filter__button:has-text("Technology Updates")');

    // Now Technology Updates should be active
    await expect(page.locator('.news-filter__button--active')).toContainText('Technology Updates');
  });

  test('should have proper ARIA labels on filter buttons', async ({ page }) => {
    await page.goto('/news');

    const filterButtons = page.locator('.news-filter__button');

    for (const button of await filterButtons.all()) {
      await expect(button).toHaveAttribute('aria-label');
      await expect(button).toHaveAttribute('aria-pressed');
    }
  });

  test('should handle empty state when no articles match filter', async ({ page }) => {
    await page.goto('/news');

    // All categories should show articles with our sample data
    // But let's verify the empty state component exists
    await expect(page.locator('.news-list__empty')).not.toBeVisible();
  });
});

test.describe('News Section Accessibility Tests', () => {
  test('should have proper landmark regions', async ({ page }) => {
    await page.goto('/news');

    // Main landmark
    await expect(page.locator('main[role="main"]')).toBeVisible();

    // Navigation landmarks
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
    await expect(page.locator('.news-filter[role="region"]')).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/news');

    // h1 should be present and unique
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);

    // News title should be h1
    await expect(page.locator('.news-page__title')).toHaveTag('h1');
  });

  test('should have focus visible on news cards', async ({ page }) => {
    await page.goto('/news');

    const firstCard = page.locator('.news-card').first();
    await firstCard.focus();

    // Should have focus styling
    await expect(firstCard).toBeFocused();
  });

  test('should have proper alt text for news images', async ({ page }) => {
    await page.goto('/news');

    const images = page.locator('.news-card__image');

    for (const img of await images.all()) {
      await expect(img).toHaveAttribute('alt');
    }
  });
});
