import { test, expect } from '@playwright/test'

/**
 * Issue #380: Fix CLS regression on /about page caused by AboutAmbient.vue layout shift
 *
 * Root cause: .ambient-section had fixed min-height: 620px, which didn't account for
 * the responsive heights in AboutAmbient.vue (600px desktop → 400px mobile) combined
 * with content-visibility: auto causing layout shifts.
 *
 * Solution: Apply responsive min-height + aspect-ratio following #335's pattern:
 * - Base: aspect-ratio: 16/5, min-height: 420px (mobile 400px + 20px margin)
 * - Desktop (≥769px): min-height: 620px (desktop 600px + 20px margin)
 * - Mobile (≤768px): min-height: 420px (mobile 400px + 20px margin)
 *
 * AC1: Ambient section has stable aspect-ratio reservation
 * AC2: Desktop min-height is 620px
 * AC3: Mobile min-height is 420px
 * AC4: Layout shift is eliminated (CLS ≤ 0.1)
 */

test.describe('#380 About page CLS fix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/KTechAICyberWeb/about')
  })

  test('AC1: Ambient section has stable aspect-ratio reservation', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    const ambientSection = page.locator('.ambient-section').first()
    await expect(ambientSection).toBeVisible()

    // Verify aspect-ratio is applied
    const aspectRatio = await ambientSection.evaluate((el) => {
      return window.getComputedStyle(el).aspectRatio
    })

    expect(aspectRatio).toBe('16 / 5')
  })

  test('AC2: Desktop min-height is 620px', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    const ambientSection = page.locator('.ambient-section').first()
    await expect(ambientSection).toBeVisible()

    // Get the computed min-height value
    const minHeight = await ambientSection.evaluate((el) => {
      return window.getComputedStyle(el).minHeight
    })

    // Verify it's 620px for desktop
    const heightPx = parseFloat(minHeight)
    expect(heightPx).toBe(620)
  })

  test('AC3: Mobile min-height is 420px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

    const ambientSection = page.locator('.ambient-section').first()
    await expect(ambientSection).toBeVisible()

    // Get the computed min-height value
    const minHeight = await ambientSection.evaluate((el) => {
      return window.getComputedStyle(el).minHeight
    })

    // Verify it's 420px for mobile
    const heightPx = parseFloat(minHeight)
    expect(heightPx).toBe(420)
  })

  test('AC4: Layout shift is eliminated - ambient section dimensions are stable', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    const ambientSection = page.locator('.ambient-section').first()
    await expect(ambientSection).toBeVisible()

    // Measure initial dimensions
    const initialDimensions = await ambientSection.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
      }
    })

    // Wait for any async content to load (AboutAmbient component)
    await page.waitForTimeout(500)

    // Measure dimensions again
    const finalDimensions = await ambientSection.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
      }
    })

    // Dimensions should be stable (no layout shift)
    expect(finalDimensions.width).toBe(initialDimensions.width)
    expect(finalDimensions.height).toBe(initialDimensions.height)

    // Height should be at least the min-height
    expect(finalDimensions.height).toBeGreaterThanOrEqual(620)
  })

  test('AC4: Mobile layout shift is eliminated', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

    const ambientSection = page.locator('.ambient-section').first()
    await expect(ambientSection).toBeVisible()

    // Measure initial dimensions
    const initialDimensions = await ambientSection.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
      }
    })

    // Wait for any async content to load
    await page.waitForTimeout(500)

    // Measure dimensions again
    const finalDimensions = await ambientSection.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
      }
    })

    // Dimensions should be stable (no layout shift)
    expect(finalDimensions.width).toBe(initialDimensions.width)
    expect(finalDimensions.height).toBe(initialDimensions.height)

    // Height should be at least the mobile min-height
    expect(finalDimensions.height).toBeGreaterThanOrEqual(420)
  })
})
