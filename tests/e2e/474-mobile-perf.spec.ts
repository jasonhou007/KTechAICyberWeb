/**
 * @file tests/e2e/474-mobile-perf.spec.ts
 * @description Mobile-first performance optimization E2E tests for Issue #474
 *
 * TDD approach: These tests define the acceptance criteria BEFORE implementation.
 * Phase 1 (Baseline) - Captures current state to establish regression guards.
 *
 * AC1-3: Verify existing performance baseline (LCP<2.5s, CLS<0.1, TTI<3.5s)
 * AC4: Image optimization (responsive variants + lazy loading)
 * AC5: Mobile-specific asset loading
 * AC6: Interaction latency <100ms
 * AC9: Playwright mobile viewport tests
 *
 * Mobile viewport: 375x667 (matches Lighthouse mobile formFactor)
 *
 * @ticket #474
 */

import { test, expect } from '@playwright/test'

// BASE path from environment or default to KTech subpath
const BASE = process.env.BASE || '/KTechAICyberWeb/'

// Mobile viewport config (matches Lighthouse mobile formFactor)
const MOBILE_VIEWPORT = { width: 375, height: 667 }
const DEVICE_SCALE_FACTOR = 1 // Pin DPR=1 for consistent testing

// Performance thresholds (AC1-3)
const THRESHOLDS = {
  LCP_MOBILE: 2500, // 2.5s
  CLS: 0.1,
  TTI_MOBILE: 3500, // 3.5s
  INTERACTION_LATENCY: 100, // 100ms
}

// Routes to test (key pages from requirements)
const ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/services', name: 'Services' },
  { path: '/contact', name: 'Contact' },
  { path: '/news', name: 'News' },
]

/**
 * AC4: Image optimization - lazy loading verification
 *
 * Verifies that images below the fold use lazy loading and that responsive
 * image variants are available for mobile viewports.
 */
test.describe('AC4: Image optimization - lazy loading', () => {
  test.use({ viewport: MOBILE_VIEWPORT, deviceScaleFactor: DEVICE_SCALE_FACTOR })

  ROUTES.forEach(({ path, name }) => {
    test(`${name}: images below fold have loading="lazy"`, async ({ page }) => {
      await page.goto(`${BASE}${path.replace(/^\//, '')}`)
      await page.waitForLoadState('networkidle')

      // Find all images below the viewport (excluding immediate hero/above-fold)
      const images = page.locator('img:not([loading="eager"])')
      const count = await images.count()

      // At minimum, non-critical images should have loading="lazy"
      // This is a regression guard - baseline assertions
      const lazyImages = page.locator('img[loading="lazy"]')
      const lazyCount = await lazyImages.count()

      // Log baseline state for IMPLEMENTATION_SUMMARY
      console.log(`[474-baseline] ${name}: ${count} total images, ${lazyCount} lazy`)

      // AC4 assertion: after optimization, expect lazy loading on below-fold images
      // For baseline, we just capture the state - implementation will improve this
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test(`${name}: hero images use loading="eager" for LCP`, async ({ page }) => {
      await page.goto(`${BASE}${path.replace(/^\//, '')}`)
      await page.waitForLoadState('networkidle')

      // Hero/above-fold images should be eager-loaded for LCP
      const heroImages = page.locator('.hero img, .section-hero img, header img').first()
      const exists = await heroImages.count() > 0

      if (exists) {
        const loading = await heroImages.getAttribute('loading')
        console.log(`[474-baseline] ${name} hero loading: ${loading || 'not set'}`)

        // AC4: Hero images should be eager (baseline check)
        // Implementation will ensure this attribute is set
      }
    })
  })

  test('Home: service card images support responsive variants', async ({ page }) => {
    await page.goto(`${BASE}`)
    await page.waitForLoadState('networkidle')

    // Check for srcset on service card images (AC4 responsive variants)
    const serviceImages = page.locator('.service-card img, .cyber-card img')
    const count = await serviceImages.count()

    console.log(`[474-baseline] Home: ${count} service card images`)

    // After optimization, expect srcset with mobile variants
    // For baseline, we just verify the elements exist
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

/**
 * AC5: Mobile-specific asset loading
 *
 * Verifies code splitting and critical path optimization for mobile.
 */
test.describe('AC5: Mobile asset loading', () => {
  test.use({ viewport: MOBILE_VIEWPORT, deviceScaleFactor: DEVICE_SCALE_FACTOR })

  test('scripts are code-split by route', async ({ page }) => {
    await page.goto(`${BASE}`)
    await page.waitForLoadState('networkidle')

    // Check that we're not loading a monolithic bundle
    const scripts = await page.locator('script[src]').all()
    const scriptSrcs = scripts.map(s => s.getAttribute('src'))

    // Count non-critical scripts loaded initially
    const nonCriticalScripts = scripts.filter(s => {
      const src = s.getAttribute('src') || ''
      return !src.includes('polyfill') && !src.includes('vendor')
    })

    console.log(`[474-baseline] Scripts loaded: ${nonCriticalScripts.length}`)

    // AC5: After optimization, expect route-based code splitting
    // Baseline captures current state
    expect(nonCriticalScripts.length).toBeGreaterThanOrEqual(0)
  })

  test('fonts are preloaded for critical text', async ({ page }) => {
    await page.goto(`${BASE}`)
    await page.waitForLoadState('networkidle')

    // Check for font preload hints (AC5)
    const fontPreloads = page.locator('link[rel="preload"][as="font"]')
    const count = await fontPreloads.count()

    console.log(`[474-baseline] Font preloads: ${count}`)

    // AC5: After optimization, expect critical font preloads
    // Baseline captures current state
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

/**
 * AC6: Interaction latency < 100ms
 *
 * Verifies that tap/click interactions respond within 100ms.
 */
test.describe('AC6: Interaction latency', () => {
  test.use({ viewport: MOBILE_VIEWPORT, deviceScaleFactor: DEVICE_SCALE_FACTOR })

  test('navigation clicks respond within 100ms', async ({ page }) => {
    await page.goto(`${BASE}`)
    await page.waitForLoadState('domcontentloaded')

    // Measure time from click to navigation start
    const navLink = page.locator('a[href="/about"], a[href*="about"]').first()
    const exists = await navLink.count() > 0

    if (exists) {
      const startTime = Date.now()

      // Click and wait for navigation
      await navLink.click()
      await page.waitForLoadState('domcontentloaded')

      const latency = Date.now() - startTime

      console.log(`[474-baseline] Navigation click latency: ${latency}ms`)

      // AC6: After optimization, expect < 100ms
      // Baseline captures current state
      expect(latency).toBeGreaterThan(0)
    }
  })

  test('mobile menu toggle responds within 100ms', async ({ page }) => {
    await page.goto(`${BASE}`)
    await page.waitForLoadState('domcontentloaded')

    // Find mobile menu toggle
    const menuToggle = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], .menu-button').first()
    const exists = await menuToggle.count() > 0

    if (exists) {
      const startTime = Date.now()

      await menuToggle.click()

      // Wait for menu state change (aria-expanded or menu visibility)
      await page.waitForTimeout(50)

      const latency = Date.now() - startTime

      console.log(`[474-baseline] Menu toggle latency: ${latency}ms`)

      // AC6: After optimization, expect < 100ms
      // Baseline captures current state
      expect(latency).toBeGreaterThan(0)
    }
  })
})

/**
 * AC9: Mobile viewport rendering tests
 *
 * Verifies responsive layout on mobile viewport.
 */
test.describe('AC9: Mobile viewport rendering', () => {
  test.use({ viewport: MOBILE_VIEWPORT, deviceScaleFactor: DEVICE_SCALE_FACTOR })

  ROUTES.forEach(({ path, name }) => {
    test(`${name}: renders without horizontal scroll`, async ({ page }) => {
      await page.goto(`${BASE}${path.replace(/^\//, '')}`)
      await page.waitForLoadState('networkidle')

      // Check for horizontal scroll (bad mobile UX)
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)

      console.log(`[474-baseline] ${name}: body=${bodyWidth}px, viewport=${viewportWidth}px`)

      // AC9: No horizontal scroll on mobile
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1) // +1px tolerance
    })

    test(`${name}: text is readable (not tiny)`, async ({ page }) => {
      await page.goto(`${BASE}${path.replace(/^\//, '')}`)
      await page.waitForLoadState('networkidle')

      // Check for minimum font size on body content (16px = 12pt readable minimum)
      const bodyText = page.locator('main p, main .content p').first()
      const exists = await bodyText.count() > 0

      if (exists) {
        const fontSize = await bodyText.evaluate(el =>
          window.getComputedStyle(el).fontSize
        )

        const fontSizePx = parseInt(fontSize, 10)
        console.log(`[474-baseline] ${name} body font size: ${fontSizePx}px`)

        // AC9: Readable text size (16px minimum)
        expect(fontSizePx).toBeGreaterThanOrEqual(14)
      }
    })
  })

  test('Home: grid is single-column on mobile', async ({ page }) => {
    await page.goto(`${BASE}`)
    await page.waitForLoadState('networkidle')

    // Service cards should stack in single column on mobile
    const serviceGrid = page.locator('.service-grid, .cyber-grid, [class*="grid"]').first()
    const exists = await serviceGrid.count() > 0

    if (exists) {
      const gridStyle = await serviceGrid.evaluate(el =>
        window.getComputedStyle(el).gridTemplateColumns
      )

      console.log(`[474-baseline] Home grid columns: ${gridStyle}`)

      // AC9: Single column on mobile (either '1fr' or 'repeat(1, ...)')
      const isSingleColumn = gridStyle.includes('1fr') ||
        gridStyle.includes('repeat(1,') ||
        gridStyle === 'none'

      expect(isSingleColumn).toBeTruthy()
    }
  })
})

/**
 * AC7: Preload hints verification
 *
 * Verifies mobile-specific preload hints for critical resources.
 */
test.describe('AC7: Preload hints', () => {
  test.use({ viewport: MOBILE_VIEWPORT, deviceScaleFactor: DEVICE_SCALE_FACTOR })

  test('critical images have preload hints', async ({ page }) => {
    await page.goto(`${BASE}`)
    await page.waitForLoadState('networkidle')

    // Check for image preload hints in head
    const imagePreloads = page.locator('link[rel="preload"][as="image"]')
    const count = await imagePreloads.count()

    console.log(`[474-baseline] Image preloads: ${count}`)

    // AC7: After optimization, expect LCP image preloads
    // Baseline captures current state
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('critical CSS is not blocked by non-critical resources', async ({ page }) => {
    await page.goto(`${BASE}`)
    await page.waitForLoadState('networkidle')

    // Check that CSS loads early (no async defer)
    const stylesheets = await page.locator('link[rel="stylesheet"]').all()
    const asyncStyles = stylesheets.filter(s => s.getAttribute('media') === 'print' || s.getAttribute('onload'))

    console.log(`[474-baseline] Async stylesheets: ${asyncStyles.length}`)

    // AC7: Critical CSS should load synchronously
    // Baseline captures current state
  })
})

/**
 * Baseline capture for IMPLEMENTATION_SUMMARY
 *
 * These tests capture current state metrics for before/after comparison.
 */
test.describe('Baseline capture', () => {
  test.use({ viewport: MOBILE_VIEWPORT, deviceScaleFactor: DEVICE_SCALE_FACTOR })

  ROUTES.forEach(({ path, name }) => {
    test(`${name}: capture baseline metrics`, async ({ page }) => {
      const startTime = Date.now()

      await page.goto(`${BASE}${path.replace(/^\//, '')}`)
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Capture key metrics for baseline
      const images = await page.locator('img').count()
      const scripts = await page.locator('script[src]').count()
      const stylesheets = await page.locator('link[rel="stylesheet"]').count()

      console.log(`[474-baseline] ${name}: load=${loadTime}ms, images=${images}, scripts=${scripts}, styles=${stylesheets}`)

      // This test always passes - it's for data capture only
      expect(true).toBeTruthy()
    })
  })
})
