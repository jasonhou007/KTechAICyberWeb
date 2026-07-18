import { test, expect } from '@playwright/test'

/**
 * Issue #385: About page content layout adjustment
 * Root cause: After #383 removed culture-icon.png, there's ~8rem total gap between
 * ambient-section and who-we-are section (4rem ambient bottom margin + 4rem who-we-are top padding).
 *
 * Solution: Reduce .section.who-we-are top padding from 4rem→2rem (desktop) and 3rem→1.5rem (mobile).
 *
 * AC1: Desktop (1920x1080): who-we-are section top-padding is 2rem (32px), not 4rem (64px)
 * AC2: Tablet (768x1024): who-we-are section top-padding is 2rem (32px)
 * AC3: Mobile (375x667): who-we-are section top-padding is 1.5rem (24px), not 3rem (48px)
 * AC4: Visual gap between ambient-section and who-we-are is reduced by ~50%
 * AC5: No negative impact on other sections (achievements, vision-mission, service-provider, stats)
 * AC6: Responsive layout maintained at all breakpoints
 */

test.describe('#385 About page content layout adjustment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/KTechAICyberWeb/about')
  })

  test('AC1: Desktop (1920x1080) - who-we-are top-padding is 2rem (32px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    // Wait for the who-we-are section to be rendered
    const whoWeAreSection = page.locator('.who-we-are').first()
    await expect(whoWeAreSection).toBeVisible()

    // Get the computed padding-top value
    const paddingTop = await whoWeAreSection.evaluate((el) => {
      return window.getComputedStyle(el).paddingTop
    })

    // Parse the pixel value and verify it's 32px (2rem), not 64px (4rem)
    const paddingPx = parseFloat(paddingTop)
    expect(paddingPx).toBe(32)
    expect(paddingPx).not.toBe(64)
  })

  test('AC2: Tablet (768x1024) - who-we-are top-padding is 2rem (32px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    const whoWeAreSection = page.locator('.who-we-are').first()
    await expect(whoWeAreSection).toBeVisible()

    const paddingTop = await whoWeAreSection.evaluate((el) => {
      return window.getComputedStyle(el).paddingTop
    })

    const paddingPx = parseFloat(paddingTop)
    expect(paddingPx).toBe(32)
  })

  test('AC3: Mobile (375x667) - who-we-are top-padding is 1.5rem (24px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const whoWeAreSection = page.locator('.who-we-are').first()
    await expect(whoWeAreSection).toBeVisible()

    const paddingTop = await whoWeAreSection.evaluate((el) => {
      return window.getComputedStyle(el).paddingTop
    })

    const paddingPx = parseFloat(paddingTop)
    expect(paddingPx).toBe(24)
    expect(paddingPx).not.toBe(48)
  })

  test('AC4: Visual gap between ambient-section and who-we-are is reduced by ~50%', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    // Wait for both sections to be visible
    const ambientSection = page.locator('.ambient-section').first()
    const whoWeAreSection = page.locator('.who-we-are').first()

    await expect(ambientSection).toBeVisible()
    await expect(whoWeAreSection).toBeVisible()

    // Measure the vertical gap between the bottom of ambient-section and top of who-we-are
    const gap = await page.evaluate(() => {
      const ambient = document.querySelector('.ambient-section')
      const whoWeAre = document.querySelector('.who-we-are')

      if (!ambient || !whoWeAre) return -1

      const ambientRect = ambient.getBoundingClientRect()
      const whoWeAreRect = whoWeAre.getBoundingClientRect()

      // Gap = whoWeAre top - ambient bottom
      return whoWeAreRect.top - ambientRect.bottom
    })

    // After the fix, the gap should be approximately 2rem (32px)
    // Before the fix, it would have been ~4rem (64px) + ambient margin
    // We expect it to be significantly less than the pre-fix gap of ~8rem
    expect(gap).toBeGreaterThan(0)
    expect(gap).toBeLessThan(100) // Should be much less than the original ~128px gap
  })

  test('AC5: No negative impact on other sections padding', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    // Check that other .section elements still have the default 4rem padding
    const achievementsSection = page.locator('.achievements').first()
    await expect(achievementsSection).toBeVisible()

    const achievementsPadding = await achievementsSection.evaluate((el) => {
      return window.getComputedStyle(el).paddingTop
    })

    // Other sections should still have 4rem (64px) padding
    expect(parseFloat(achievementsPadding)).toBe(64)

    // Verify vision-mission section
    const visionSection = page.locator('.vision-mission').first()
    await expect(visionSection).toBeVisible()

    const visionPadding = await visionSection.evaluate((el) => {
      return window.getComputedStyle(el).paddingTop
    })

    expect(parseFloat(visionPadding)).toBe(64)

    // Verify service-provider section
    const serviceSection = page.locator('.service-provider').first()
    await expect(serviceSection).toBeVisible()

    const servicePadding = await serviceSection.evaluate((el) => {
      return window.getComputedStyle(el).paddingTop
    })

    expect(parseFloat(servicePadding)).toBe(64)

    // Verify stats-section
    const statsSection = page.locator('.stats-section').first()
    await expect(statsSection).toBeVisible()

    const statsPadding = await statsSection.evaluate((el) => {
      return window.getComputedStyle(el).paddingTop
    })

    expect(parseFloat(statsPadding)).toBe(64)
  })

  test('AC6: Responsive layout maintained at all breakpoints', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const mobileWhoWeAre = page.locator('.who-we-are').first()
    await expect(mobileWhoWeAre).toBeVisible()

    const mobilePadding = await mobileWhoWeAre.evaluate((el) => {
      return window.getComputedStyle(el).paddingTop
    })

    expect(parseFloat(mobilePadding)).toBe(24)

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    const tabletWhoWeAre = page.locator('.who-we-are').first()
    await expect(tabletWhoWeAre).toBeVisible()

    const tabletPadding = await tabletWhoWeAre.evaluate((el) => {
      return window.getComputedStyle(el).paddingTop
    })

    expect(parseFloat(tabletPadding)).toBe(32)

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })

    const desktopWhoWeAre = page.locator('.who-we-are').first()
    await expect(desktopWhoWeAre).toBeVisible()

    const desktopPadding = await desktopWhoWeAre.evaluate((el) => {
      return window.getComputedStyle(el).paddingTop
    })

    expect(parseFloat(desktopPadding)).toBe(32)

    // Verify the section is still visible and properly positioned at all sizes
    await mobileWhoWeAre.scrollIntoViewIfNeeded()
    await expect(mobileWhoWeAre).toBeInViewport()

    await page.setViewportSize({ width: 768, height: 1024 })
    await tabletWhoWeAre.scrollIntoViewIfNeeded()
    await expect(tabletWhoWeAre).toBeInViewport()

    await page.setViewportSize({ width: 1920, height: 1080 })
    await desktopWhoWeAre.scrollIntoViewIfNeeded()
    await expect(desktopWhoWeAre).toBeInViewport()
  })
})
