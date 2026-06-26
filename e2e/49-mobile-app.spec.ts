import { test, expect } from '@playwright/test'

test.describe('Mobile App Service Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services/mobile-app')
  })

  test('should render page with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/.*Mobile App.*/)
  })

  test('should display breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.locator('.breadcrumb')
    await expect(breadcrumb).toBeVisible()
    
    const homeLink = page.locator('.breadcrumb a').first()
    await expect(homeLink).toHaveText('Home')
    
    const separator = page.locator('.separator')
    await expect(separator).toHaveText('/')
  })

  test('should display hero section with title and tags', async ({ page }) => {
    const heroTitle = page.locator('.hero-title')
    await expect(heroTitle).toBeVisible()
    await expect(heroTitle).toContainText('Mobile')
    
    const accent = page.locator('.hero-title .accent')
    await expect(accent).toHaveText('Application')
    
    const tags = page.locator('.tag')
    await expect(tags).toHaveCount(3)
    await expect(tags.nth(0)).toContainText('iOS')
    await expect(tags.nth(1)).toContainText('Secure')
    await expect(tags.nth(2)).toContainText('User')
  })

  test('should display overview section with cards', async ({ page }) => {
    const overviewSection = page.locator('.overview')
    await expect(overviewSection).toBeVisible()
    
    const sectionTitle = page.locator('.overview .section-title')
    await expect(sectionTitle).toBeVisible()
    
    const cards = page.locator('.overview-card')
    await expect(cards).toHaveCount(3)
    
    await expect(cards.nth(0)).toContainText('Cross-Platform')
  })

  test('should display features section', async ({ page }) => {
    const featuresSection = page.locator('.features')
    await expect(featuresSection).toBeVisible()
    
    const featureItems = page.locator('.feature-item')
    await expect(featureItems).toHaveCount(6)
    
    await expect(featureItems.nth(0)).toContainText('Secure Authentication')
  })

  test('should display benefits section', async ({ page }) => {
    const benefitsSection = page.locator('.benefits')
    await expect(benefitsSection).toBeVisible()
    
    const benefitItems = page.locator('.benefit-item')
    await expect(benefitItems).toHaveCount(6)
    
    const checks = page.locator('.benefit-check')
    await expect(checks).toHaveCount(6)
  })

  test('should display CTA section', async ({ page }) => {
    const ctaSection = page.locator('.cta')
    await expect(ctaSection).toBeVisible()
    
    const ctaButton = page.locator('.cta-button')
    await expect(ctaButton).toBeVisible()
    await expect(ctaButton).toContainText('Get Started')
  })

  test('should display related services section', async ({ page }) => {
    const relatedSection = page.locator('.related-services')
    await expect(relatedSection).toBeVisible()
    
    const relatedCards = page.locator('.related-card')
    await expect(relatedCards).toHaveCount(3)
  })

  test('CTA button should navigate to contact section', async ({ page }) => {
    const ctaButton = page.locator('.cta-button')
    await ctaButton.click()
    
    await expect(page).toHaveURL('/#contact')
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)
    
    const h2s = page.locator('h2')
    await expect(h2s).toHaveCount(5)
  })

  test('should be keyboard navigable', async ({ page }) => {
    const ctaButton = page.locator('.cta-button')
    await ctaButton.focus()
    
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent)
    expect(focusedElement).toContain('Get Started')
  })

  test('should display properly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/services/mobile-app')
    
    const heroTitle = page.locator('.hero-title')
    await expect(heroTitle).toBeVisible()
    
    const tags = page.locator('.tag')
    await expect(tags.first()).toBeVisible()
  })
})
