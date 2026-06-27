/**
 * @file 71-culture-content.spec.ts
 * @description E2E tests for Culture component content rendering
 * @ticket #71 - TEST-016: Culture Component Unit Tests - TDD with Vitest
 *
 * This E2E test supplements the unit tests by verifying actual content rendering,
 * which cannot be tested in unit tests due to Vue reactivity mocking limitations.
 */

import { test, expect, Page } from '@playwright/test'

/**
 * Helper class for Culture component E2E interactions
 */
class CulturePage {
  constructor(private page: Page) {}

  /**
   * Navigate to the home page
   */
  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Scroll to Culture section
   */
  async scrollToCulture() {
    const cultureSection = this.page.locator('section#culture')
    await cultureSection.scrollIntoViewIfNeeded()
    await this.page.waitForTimeout(500) // Wait for any animations
  }

  /**
   * Get the Culture section
   */
  getCultureSection() {
    return this.page.locator('section#culture')
  }

  /**
   * Get section title
   */
  getSectionTitle() {
    return this.page.locator('section#culture .section-title')
  }

  /**
   * Get section subtitle
   */
  getSectionSubtitle() {
    return this.page.locator('section#culture .section-subtitle')
  }

  /**
   * Get all culture cards
   */
  getCultureCards() {
    return this.page.locator('section#culture .card')
  }

  /**
   * Get card icons
   */
  getCardIcons() {
    return this.page.locator('section#culture .card-icon')
  }

  /**
   * Get card titles
   */
  getCardTitles() {
    return this.page.locator('section#culture .card h3')
  }

  /**
   * Get card descriptions
   */
  getCardDescriptions() {
    return this.page.locator('section#culture .card p')
  }
}

test.describe('Culture Component - E2E Content Rendering', () => {
  let culturePage: CulturePage
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    culturePage = new CulturePage(page)
    await culturePage.goto()
    await culturePage.scrollToCulture()
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('should render Culture section', async () => {
    const section = culturePage.getCultureSection()
    await expect(section).toBeVisible()
    await expect(section).toHaveAttribute('id', 'culture')
  })

  test('should render section title', async () => {
    const title = culturePage.getSectionTitle()
    await expect(title).toBeVisible()
    const titleText = await title.textContent()
    expect(titleText).toBe('企业文化')
  })

  test('should render section subtitle', async () => {
    const subtitle = culturePage.getSectionSubtitle()
    await expect(subtitle).toBeVisible()
    const subtitleText = await subtitle.textContent()
    expect(subtitleText).toBe('创新驱动 · 科技引领 · 服务至上')
  })

  test('should render three culture cards', async () => {
    const cards = culturePage.getCultureCards()
    await expect(cards).toHaveCount(3)
  })

  test('should render card icons', async () => {
    const icons = culturePage.getCardIcons()
    await expect(icons).toHaveCount(3)

    const iconTexts = await icons.allTextContents()
    expect(iconTexts).toContain('🚀')
    expect(iconTexts).toContain('🎯')
    expect(iconTexts).toContain('💡')
  })

  test('should render Innovation card title', async () => {
    const titles = culturePage.getCardTitles()
    await expect(titles.first()).toBeVisible()

    const firstTitle = await titles.nth(0).textContent()
    expect(firstTitle).toBe('创新驱动')
  })

  test('should render Customer Focus card title', async () => {
    const titles = culturePage.getCardTitles()
    const secondTitle = await titles.nth(1).textContent()
    expect(secondTitle).toBe('客户至上')
  })

  test('should render Excellence card title', async () => {
    const titles = culturePage.getCardTitles()
    const thirdTitle = await titles.nth(2).textContent()
    expect(thirdTitle).toBe('追求卓越')
  })

  test('should render Innovation card description', async () => {
    const descriptions = culturePage.getCardDescriptions()
    const firstDescription = await descriptions.nth(0).textContent()
    expect(firstDescription).toBe('拥抱变化，持续创新，以技术突破推动金融变革')
  })

  test('should render Customer Focus card description', async () => {
    const descriptions = culturePage.getCardDescriptions()
    const secondDescription = await descriptions.nth(1).textContent()
    expect(secondDescription).toBe('深入理解客户需求，提供超越期望的专业服务')
  })

  test('should render Excellence card description', async () => {
    const descriptions = culturePage.getCardDescriptions()
    const thirdDescription = await descriptions.nth(2).textContent()
    expect(thirdDescription).toBe('精益求精，追求卓越品质，打造行业标杆')
  })

  test('should verify content wrapper visibility', async () => {
    const section = culturePage.getCultureSection()
    const contentWrapper = section.locator('.fade-in')
    await expect(contentWrapper).toBeVisible()
  })

  test('should verify grid layout', async () => {
    const section = culturePage.getCultureSection()
    const grid = section.locator('.grid')
    await expect(grid).toBeVisible()
    await expect(grid).toHaveCSS('display', 'grid')
  })

  test('should display Chinese language content', async () => {
    const title = culturePage.getSectionTitle()
    const subtitle = culturePage.getSectionSubtitle()

    await expect(title).toContainText('企业文化')
    await expect(subtitle).toContainText('创新驱动')
  })

  test('should have proper card structure', async () => {
    const firstCard = culturePage.getCultureCards().first()

    // Check card has icon
    const icon = firstCard.locator('.card-icon')
    await expect(icon).toBeVisible()

    // Check card has title
    const title = firstCard.locator('h3')
    await expect(title).toBeVisible()

    // Check card has description
    const description = firstCard.locator('p')
    await expect(description).toBeVisible()
  })

  test('should support hover interactions', async () => {
    const firstCard = culturePage.getCultureCards().first()

    // Hover over the card
    await firstCard.hover()
    await page.waitForTimeout(300) // Wait for transition

    // Card should still be visible after hover
    await expect(firstCard).toBeVisible()
  })

  test('should maintain accessibility attributes', async () => {
    const icons = culturePage.getCardIcons()
    const count = await icons.count()

    for (let i = 0; i < count; i++) {
      await expect(icons.nth(i)).toHaveAttribute('aria-hidden', 'true')
    }
  })

  test('should handle responsive layout on mobile', async () => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)

    const section = culturePage.getCultureSection()
    await expect(section).toBeVisible()

    const grid = section.locator('.grid')
    await expect(grid).toBeVisible()
  })

  test('should have stagger animation class', async () => {
    const cards = culturePage.getCultureCards()
    const count = await cards.count()

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toHaveClass(/stagger/)
    }
  })
})

test.describe('Culture Component - Integration Tests', () => {
  let culturePage: CulturePage
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    culturePage = new CulturePage(page)
    await culturePage.goto()
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('should handle scroll to Culture section', async () => {
    // Start at top
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    // Scroll to culture section
    await culturePage.scrollToCulture()

    // Verify section is in viewport
    const section = culturePage.getCultureSection()
    await expect(section).toBeInViewport()
  })

  test('should render after lazy loading', async () => {
    // Scroll slowly to trigger intersection observer
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await page.waitForTimeout(1000)

    const section = culturePage.getCultureSection()
    await expect(section).toBeVisible()

    const cards = culturePage.getCultureCards()
    await expect(cards).toHaveCount(3)
  })

  test('should verify all card data integrity', async () => {
    await culturePage.scrollToCulture()

    const expectedData = [
      { icon: '🚀', title: '创新驱动', description: '拥抱变化，持续创新，以技术突破推动金融变革' },
      { icon: '🎯', title: '客户至上', description: '深入理解客户需求，提供超越期望的专业服务' },
      { icon: '💡', title: '追求卓越', description: '精益求精，追求卓越品质，打造行业标杆' }
    ]

    const icons = culturePage.getCardIcons()
    const titles = culturePage.getCardTitles()
    const descriptions = culturePage.getCardDescriptions()

    for (let i = 0; i < expectedData.length; i++) {
      const iconText = await icons.nth(i).textContent()
      const titleText = await titles.nth(i).textContent()
      const descriptionText = await descriptions.nth(i).textContent()

      expect(iconText).toBe(expectedData[i].icon)
      expect(titleText).toBe(expectedData[i].title)
      expect(descriptionText).toBe(expectedData[i].description)
    }
  })
})
