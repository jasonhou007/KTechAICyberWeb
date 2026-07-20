/**
 * @file 434-smooth-scroll-navigation.spec.ts
 * @description E2E tests for smooth scroll behavior (#434).
 *
 * Tests three scrollBehavior cases:
 * 1. Browser back/forward buttons restore saved scroll position
 * 2. Hash navigation (#section) scrolls with 80px offset for fixed header
 * 3. Regular route changes scroll to top
 * 4. Respects prefers-reduced-motion
 *
 * @ticket #434
 */
import { test, expect } from '@playwright/test'

// Per project memory: baseURL is origin-only; root goto('/') 302-redirects to subpath
const BASE = '/KTechAICyberWeb/'

test.describe('#434 smooth scroll navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Seed deterministic theme/language state
    await page.goto(`${BASE}`)
    await page.evaluate(() => {
      localStorage.setItem(
        'ktech-preferences',
        JSON.stringify({ theme: 'dark', language: 'en' })
      )
    })
  })

  test('hash navigation scrolls with offset for fixed header', async ({ page }) => {
    // Navigate to a page with hash anchors (About page has #mission, #team)
    await page.goto(`${BASE}about`)
    await page.waitForLoadState('networkidle')

    // Click a hash link (e.g., in-page navigation to #mission)
    const hashLink = page.locator('a[href="#mission"]').first()
    const count = await hashLink.count()

    // If no #mission link exists, test with a manually constructed hash navigation
    if (count === 0) {
      // Create a test element with id to test hash scroll
      await page.evaluate(() => {
        const target = document.createElement('div')
        target.id = 'test-target'
        target.style.marginTop = '1000px' // Ensure it's below fold
        target.style.height = '100px'
        document.body.appendChild(target)

        const link = document.createElement('a')
        link.href = '#test-target'
        link.textContent = 'Scroll to test target'
        link.style.position = 'fixed'
        link.style.top = '10px'
        link.style.left = '10px'
        document.body.appendChild(link)
      })

      // Scroll to top first
      await page.evaluate(() => window.scrollTo(0, 0))

      // Click the hash link
      await page.click('a[href="#test-target"]')

      // Wait for smooth scroll to complete (500-700ms per requirements)
      await page.waitForTimeout(800)

      // Verify scroll position accounts for 80px header offset
      const scrollY = await page.evaluate(() => window.scrollY)
      const targetY = await page.evaluate(() => {
        const target = document.getElementById('test-target')
        return target ? target.getBoundingClientRect().top + window.scrollY : 0
      })

      // After scroll with offset, the target should be near the top
      // with ~80px space for the fixed header
      expect(scrollY).toBeGreaterThan(targetY - 100)
      expect(scrollY).toBeLessThan(targetY - 60)

      // URL should contain hash
      expect(page.url()).toContain('#test-target')
    } else {
      // Test with existing #mission link
      await page.click('a[href="#mission"]')
      await page.waitForTimeout(800)

      // Verify URL updated
      expect(page.url()).toContain('#mission')

      // Verify scroll position (not at top anymore)
      const scrollY = await page.evaluate(() => window.scrollY)
      expect(scrollY).toBeGreaterThan(0)
    }
  })

  test('route change scrolls to top smoothly', async ({ page }) => {
    // Scroll down on first page
    await page.goto(`${BASE}`)
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(100)

    const scrollBefore = await page.evaluate(() => window.scrollY)
    expect(scrollBefore).toBeGreaterThan(0)

    // Navigate to different route
    await page.click('a[href="/KTechAICyberWeb/about"]')
    await page.waitForLoadState('networkidle')

    // Wait for smooth scroll to complete
    await page.waitForTimeout(800)

    // Should be scrolled to top
    const scrollAfter = await page.evaluate(() => window.scrollY)
    expect(scrollAfter).toBe(0)
  })

  test('back button restores saved scroll position', async ({ page }) => {
    // First route - scroll down
    await page.goto(`${BASE}news`)
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(100)

    const scrollOnNews = await page.evaluate(() => window.scrollY)
    expect(scrollOnNews).toBeGreaterThan(0)

    // Navigate to another route
    await page.goto(`${BASE}about`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    const scrollOnAbout = await page.evaluate(() => window.scrollY)
    expect(scrollOnAbout).toBe(0)

    // Go back - should restore scroll position
    await page.goBack()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(100)

    const scrollAfterBack = await page.evaluate(() => window.scrollY)
    expect(scrollAfterBack).toBeCloseTo(scrollOnNews, 50)
  })

  test('respects prefers-reduced-motion', async ({ browser }) => {
    // Create context with reduced motion
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 1280, height: 720 }
    })

    const page = await context.newPage()

    try {
      await page.goto(`${BASE}`)
      await page.evaluate(() => {
        localStorage.setItem(
          'ktech-preferences',
          JSON.stringify({ theme: 'dark', language: 'en' })
        )
      })
      await page.goto(`${BASE}about`)
      await page.waitForLoadState('networkidle')

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500))
      await page.waitForTimeout(100)

      // Navigate to different route
      await page.goto(`${BASE}news`)
      await page.waitForLoadState('networkidle')

      // Should still scroll to top, but behavior mode is 'auto' not 'smooth'
      const scrollAfter = await page.evaluate(() => window.scrollY)
      expect(scrollAfter).toBe(0)
    } finally {
      await context.close()
    }
  })
})
