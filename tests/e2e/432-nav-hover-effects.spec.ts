import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Issue #432: Navigation Hover Effects
 *
 * Tests verify:
 * - AC1: Color change on hover (cyan glow on nav links)
 * - AC2: Transition duration is exactly 250ms
 * - AC3: All nav items covered (Header.vue + NavigationDropdown.vue)
 * - AC4: No glitches (will-change, reduced-motion support)
 */
test.describe('Navigation Hover Effects (#432)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  /**
   * AC1: Verify nav links change color on hover
   */
  test('should change color to cyan on hover for main nav links', async ({ page }) => {
    const navLinks = page.locator('.nav-links a').filter({ hasText: /^(About Us|News|Contact)$/ })

    const count = await navLinks.count()
    expect(count, 'Should have at least 3 main nav links').toBeGreaterThanOrEqual(3)

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i)

      // Check initial color (non-cyan)
      const initialColor = await link.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return styles.color
      })
      expect(initialColor).not.toBe('rgb(0, 255, 255)')

      // Hover and check cyan color
      await link.hover()
      await page.waitForTimeout(300) // Wait for 250ms transition + buffer

      const hoveredColor = await link.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return styles.color
      })
      expect(hoveredColor).toBe('rgb(0, 255, 255)')

      // Mouse out and verify color reverts
      await page.mouse.move(0, 0)
      await page.waitForTimeout(300)

      const finalColor = await link.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return styles.color
      })
      expect(finalColor).not.toBe('rgb(0, 255, 255)')
    }
  })

  /**
   * AC2: Verify transition duration is exactly 250ms
   */
  test('should have 250ms transition duration on nav links', async ({ page }) => {
    const navLink = page.locator('.nav-links a').first()

    const transitionDuration = await navLink.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.transitionDuration
    })

    expect(transitionDuration).toBe('0.25s')
  })

  /**
   * AC3: Verify dropdown items also have hover effects
   */
  test('should apply hover effects to dropdown menu items', async ({ page }) => {
    // Open the "Our Solutions" dropdown
    const solutionsTrigger = page.locator('.dropdown-trigger').filter({ hasText: 'Our Solutions' })
    await solutionsTrigger.click()
    await page.waitForTimeout(100)

    const dropdownItems = page.locator('.dropdown-item')

    const count = await dropdownItems.count()
    expect(count, 'Should have dropdown items').toBeGreaterThan(0)

    // Test first dropdown item hover
    const firstItem = dropdownItems.first()
    await firstItem.hover()
    await page.waitForTimeout(300)

    const hoveredColor = await firstItem.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.color
    })
    expect(hoveredColor).toBe('rgb(0, 255, 255)')
  })

  /**
   * AC2: Verify dropdown items also have 250ms transition
   */
  test('should have 250ms transition duration on dropdown items', async ({ page }) => {
    // Open the "Our Solutions" dropdown
    const solutionsTrigger = page.locator('.dropdown-trigger').filter({ hasText: 'Our Solutions' })
    await solutionsTrigger.click()
    await page.waitForTimeout(100)

    const dropdownItem = page.locator('.dropdown-item').first()

    const transitionDuration = await dropdownItem.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.transitionDuration
    })

    expect(transitionDuration).toBe('0.25s')
  })

  /**
   * AC4: Verify will-change is applied for GPU acceleration
   */
  test('should have will-change property on nav links', async ({ page }) => {
    const navLink = page.locator('.nav-links a').first()

    const willChange = await navLink.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.willChange
    })

    expect(willChange).toContain('transform')
    expect(willChange).toContain('color')
    expect(willChange).toMatch(/text-shadow|textshadow/i)
  })

  /**
   * AC4: Verify reduced-motion is respected
   */
  test('should respect prefers-reduced-motion for accessibility', async ({ page }) => {
    // Set reduced-motion preference
    await page.addInitScript(() => {
      window.matchMedia = (query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      })
    })

    await page.goto('/')

    const navLink = page.locator('.nav-links a').first()

    const transitionDuration = await navLink.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.transitionDuration
    })

    // When reduced-motion is preferred, transitions should be disabled (0s)
    expect(transitionDuration).toBe('0s')
  })

  /**
   * AC4: Verify no flickering on hover (glitch test)
   */
  test('should not flicker during hover transitions', async ({ page }) => {
    const navLink = page.locator('.nav-links a').first()

    // Rapid hover in/out to test for flickering
    for (let i = 0; i < 5; i++) {
      await navLink.hover()
      await page.waitForTimeout(50)
      await page.mouse.move(0, 0)
      await page.waitForTimeout(50)
    }

    // Final hover should still work correctly
    await navLink.hover()
    await page.waitForTimeout(300)

    const finalColor = await navLink.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.color
    })
    expect(finalColor).toBe('rgb(0, 255, 255)')
  })
})
