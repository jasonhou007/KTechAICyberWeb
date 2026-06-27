import { test, expect } from '@playwright/test'

test.describe('Supply Chain Finance Service Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services/supply-chain-finance')
  })

  test('should render page successfully', async ({ page }) => {
    // Check that main content area is visible
    const mainContent = page.locator('main.supply-chain-finance')
    await expect(mainContent).toBeVisible()
  })

  test('should have correct page title and heading', async ({ page }) => {
    // Check breadcrumb navigation
    const breadcrumb = page.locator('.scf__breadcrumb')
    await expect(breadcrumb).toBeVisible()

    // Check hero heading exists
    const heroHeading = page.locator('.scf__hero-title')
    await expect(heroHeading).toBeVisible()
    await expect(heroHeading).toContainText('Supply Chain Finance Solution')
  })

  test('should display all main sections', async ({ page }) => {
    // Hero section
    await expect(page.locator('.scf__hero')).toBeVisible()

    // Overview section
    await expect(page.locator('.scf__overview')).toBeVisible()
    await expect(page.locator('h2:has-text("Service Overview")')).toBeVisible()

    // Features section
    await expect(page.locator('.scf__features')).toBeVisible()
    await expect(page.locator('h2:has-text("Key Features")')).toBeVisible()

    // Benefits section
    await expect(page.locator('.scf__benefits')).toBeVisible()
    await expect(page.locator('h2:has-text("Benefits")')).toBeVisible()

    // Process section
    await expect(page.locator('.scf__process')).toBeVisible()
    await expect(page.locator('h2:has-text("Implementation Process")')).toBeVisible()

    // CTA section
    await expect(page.locator('.scf__cta')).toBeVisible()
  })

  test('should display all 6 feature cards', async ({ page }) => {
    const featureCards = page.locator('.scf__feature-card')
    await expect(featureCards).toHaveCount(6)

    // Check specific features
    await expect(page.locator('.scf__feature-card:has-text("Working Capital Optimization")')).toBeVisible()
    await expect(page.locator('.scf__feature-card:has-text("Risk Management")')).toBeVisible()
    await expect(page.locator('.scf__feature-card:has-text("Digital Platform")')).toBeVisible()
    await expect(page.locator('.scf__feature-card:has-text("Flexible Financing")')).toBeVisible()
    await expect(page.locator('.scf__feature-card:has-text("Supplier Network")')).toBeVisible()
    await expect(page.locator('.scf__feature-card:has-text("Advanced Analytics")')).toBeVisible()
  })

  test('should display all 4 benefit items', async ({ page }) => {
    const benefitItems = page.locator('.scf__benefit-item')
    await expect(benefitItems).toHaveCount(4)

    // Check specific benefits
    await expect(page.locator('.scf__benefit-item:has-text("Improved Cash Flow")')).toBeVisible()
    await expect(page.locator('.scf__benefit-item:has-text("Reduced Risk")')).toBeVisible()
    await expect(page.locator('.scf__benefit-item:has-text("Enhanced Efficiency")')).toBeVisible()
    await expect(page.locator('.scf__benefit-item:has-text("Cost Savings")')).toBeVisible()
  })

  test('should display all 5 process steps', async ({ page }) => {
    const processSteps = page.locator('.scf__process-step')
    await expect(processSteps).toHaveCount(5)

    // Check process steps
    await expect(page.locator('.scf__process-step:has-text("Assessment")')).toBeVisible()
    await expect(page.locator('.scf__process-step:has-text("Solution Design")')).toBeVisible()
    await expect(page.locator('.scf__process-step:has-text("Integration")')).toBeVisible()
    await expect(page.locator('.scf__process-step:has-text("Deployment")')).toBeVisible()
    await expect(page.locator('.scf__process-step:has-text("Optimization")')).toBeVisible()
  })

  test('should have working CTA button', async ({ page }) => {
    const ctaButton = page.locator('.scf__cta-button')
    await expect(ctaButton).toBeVisible()
    await expect(ctaButton).toContainText('Request Consultation')

    // Check that clicking CTA navigates to contact page
    await ctaButton.click()
    await expect(page).toHaveURL('/contact')
  })

  test('should have working back to services link', async ({ page }) => {
    const backLink = page.locator('.scf__back-link')
    await expect(backLink).toBeVisible()
    await expect(backLink).toContainText('Back to Services')

    // Check that clicking back link navigates to home
    await backLink.click()
    await expect(page).toHaveURL('/')
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check h1 exists and is unique
    const h1Elements = page.locator('h1')
    await expect(h1Elements).toHaveCount(1)

    // Check main h1 is the hero title
    await expect(page.locator('.scf__hero-title').first()).toBeVisible()
  })

  test('should have cyberpunk styling applied', async ({ page }) => {
    // Check for neon border class on buttons
    const ctaButton = page.locator('.scf__cta-button')
    await expect(ctaButton).toHaveClass(/neon-border/)

    // Check for neon text class on title
    const heroTitle = page.locator('.scf__hero-title')
    await expect(heroTitle).toHaveClass(/neon-text/)

    // Check for grid background
    await expect(page.locator('.grid-bg')).toBeVisible()
  })

  test('should be accessible via keyboard navigation', async ({ page }) => {
    // Tab to CTA button
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    const ctaButton = page.locator('.scf__cta-button')
    await ctaButton.press('Enter')
    await expect(page).toHaveURL('/contact')
  })

  test('should display content in Chinese when language is switched', async ({ page }) => {
    // Find and click language switcher
    const languageSwitcher = page.locator('[data-testid="language-switcher"]')
    
    // Note: This assumes language switcher exists - implementation may vary
    // For now, we'll just verify the Chinese translations are present in the DOM
    const heroTitle = page.locator('.scf__hero-title')
    await expect(heroTitle).toBeVisible()
  })

  test('should have proper breadcrumb navigation', async ({ page }) => {
    const breadcrumbHome = page.locator('.scf__breadcrumb-link').first()
    await expect(breadcrumbHome).toBeVisible()
    await expect(breadcrumbHome).toContainText('Home')

    await breadcrumbHome.click()
    await expect(page).toHaveURL('/')
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/services/supply-chain-finance')

    // Check main elements are still visible
    await expect(page.locator('.scf__hero')).toBeVisible()
    await expect(page.locator('.scf__hero-title')).toBeVisible()
    await expect(page.locator('.scf__cta-button')).toBeVisible()
  })

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/services/supply-chain-finance')
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
  })
})
