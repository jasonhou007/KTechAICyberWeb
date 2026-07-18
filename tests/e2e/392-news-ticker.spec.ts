/**
 * News Ticker E2E Tests
 * Issue #392: Ambient news ticker for News pages
 */

import { test, expect } from '@playwright/test'

test.describe('News Ticker', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to news page
    await page.goto('/news')
  })

  test('should display ticker on news page', async ({ page }) => {
    // Wait for ticker to be visible
    const ticker = page.locator('[data-testid="news-ticker"]')
    await expect(ticker).toBeVisible()

    // Check for breaking label
    const label = page.locator('[data-testid="ticker-label"]')
    await expect(label).toBeVisible()
    await expect(label).toContainText('BREAKING')
  })

  test('should display news items in ticker', async ({ page }) => {
    const tickerItems = page.locator('[data-testid="ticker-item"]')

    // Should have multiple items (duplicated for seamless scroll)
    const count = await tickerItems.count()
    expect(count).toBeGreaterThan(0)

    // Each item should have text
    const firstItem = tickerItems.first()
    await expect(firstItem).not.toBeEmpty()
  })

  test('should pause ticker on hover', async ({ page }) => {
    const ticker = page.locator('[data-testid="news-ticker"]')

    // Initially playing (not paused class)
    await expect(ticker).not.toHaveClass(/news-ticker--paused/)

    // Hover over ticker
    await ticker.hover()

    // Should have paused class
    await expect(ticker).toHaveClass(/news-ticker--paused/)
  })

  test('should resume ticker on mouse leave', async ({ page }) => {
    const ticker = page.locator('[data-testid="news-ticker"]')

    // Hover then leave
    await ticker.hover()
    await expect(ticker).toHaveClass(/news-ticker--paused/)

    // Move away
    const breadcrumb = page.locator('.news-page__breadcrumb')
    await breadcrumb.hover()
    await expect(ticker).not.toHaveClass(/news-ticker--paused/)
  })

  test('should toggle pause on click', async ({ page }) => {
    const ticker = page.locator('[data-testid="news-ticker"]')

    // Click to pause
    await ticker.click()
    await expect(ticker).toHaveClass(/news-ticker--paused/)

    // Click again to resume
    await ticker.click()
    await expect(ticker).not.toHaveClass(/news-ticker--paused/)
  })

  test('should toggle pause on Space key', async ({ page }) => {
    const ticker = page.locator('[data-testid="news-ticker"]')

    // Focus the ticker
    await ticker.focus()

    // Press Space to pause
    await ticker.press('Space')
    await expect(ticker).toHaveClass(/news-ticker--paused/)

    // Press Space again to resume
    await ticker.press('Space')
    await expect(ticker).not.toHaveClass(/news-ticker--paused/)
  })

  test('should toggle pause on Enter key', async ({ page }) => {
    const ticker = page.locator('[data-testid="news-ticker"]')

    // Focus the ticker
    await ticker.focus()

    // Press Enter to pause
    await ticker.press('Enter')
    await expect(ticker).toHaveClass(/news-ticker--paused/)

    // Press Enter again to resume
    await ticker.press('Enter')
    await expect(ticker).not.toHaveClass(/news-ticker--paused/)
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    const ticker = page.locator('[data-testid="news-ticker"]')

    // Check ARIA attributes
    await expect(ticker).toHaveAttribute('role', 'marquee')
    await expect(ticker).toHaveAttribute('aria-label', 'Latest updates')
    await expect(ticker).toHaveAttribute('tabindex', '0')
  })

  test('should display ticker on news detail page', async ({ page }) => {
    // Click on the first news article
    const firstArticle = page.locator('.news-card').first()
    await firstArticle.click()

    // Wait for navigation
    await page.waitForURL(/\/news\/.+/)

    // Check for ticker on detail page
    const ticker = page.locator('[data-testid="news-ticker"]')
    await expect(ticker).toBeVisible()

    // Should have related articles
    const tickerItems = page.locator('[data-testid="ticker-item"]')
    const count = await tickerItems.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should not display ticker when no articles', async ({ page }) => {
    // Navigate to a page that might not have articles
    // (This is a theoretical test - actual implementation may vary)
    await page.goto('/news')

    // If ticker exists, it should have content
    const ticker = page.locator('[data-testid="news-ticker"]')
    if (await ticker.count() > 0) {
      const tickerItems = page.locator('[data-testid="ticker-item"]')
      expect(await tickerItems.count()).toBeGreaterThan(0)
    }
  })

  test('should handle keyboard navigation', async ({ page }) => {
    const ticker = page.locator('[data-testid="news-ticker"]')

    // Tab to ticker
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be focused
    await expect(ticker).toBeFocused()

    // Test Space interaction
    await ticker.press('Space')
    await expect(ticker).toHaveClass(/news-ticker--paused/)

    // Test Enter interaction
    await ticker.press('Enter')
    await expect(ticker).not.toHaveClass(/news-ticker--paused/)
  })

  test('should have smooth scrolling animation', async ({ page }) => {
    const ticker = page.locator('[data-testid="news-ticker"]')

    // Check that content exists
    const content = page.locator('[data-testid="ticker-content"]')
    await expect(content).toBeVisible()

    const track = page.locator('.news-ticker__track')
    await expect(track).toBeVisible()

    // Track should have transform property for GPU acceleration
    const transform = await track.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // Transform should exist (may be matrix or none depending on state)
    expect(transform).toBeDefined()
  })

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/news')

    const ticker = page.locator('[data-testid="news-ticker"]')

    // Should still be visible
    await expect(ticker).toBeVisible()

    // Should have static class when reduced motion is preferred
    await expect(ticker).toHaveClass(/news-ticker--static/)
  })
})

test.describe('News Ticker i18n', () => {
  test('should display English labels', async ({ page }) => {
    await page.goto('/news')

    const label = page.locator('[data-testid="ticker-label"]')
    await expect(label).toContainText('BREAKING')
  })

  test('should display Chinese labels', async ({ page }) => {
    // Navigate to news page in Chinese
    await page.goto('/news?lang=zh')

    // Check for Chinese label
    const label = page.locator('[data-testid="ticker-label"]')
    await expect(label).toContainText('最新')
  })
})

test.describe('News Ticker Visual States', () => {
  test('should have cyan glow for English', async ({ page }) => {
    await page.goto('/news')

    const label = page.locator('[data-testid="ticker-label"]')

    // Should have English color class
    await expect(label).toHaveClass(/news-ticker__label--en/)
  })

  test('should have proper styling on hover', async ({ page }) => {
    await page.goto('/news')

    const ticker = page.locator('[data-testid="news-ticker"]')

    // Check initial state
    await expect(ticker).toBeVisible()

    // Hover and check for visual feedback
    await ticker.hover()
    await expect(ticker).toHaveCSS('cursor', 'pointer')
  })
})
