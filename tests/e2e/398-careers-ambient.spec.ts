/**
 * @file 398-careers-ambient.spec.ts
 * @description E2E tests for CareerPathAmbient component on Careers page
 * @ticket #398 - Add ambient career-path visualization to Careers page
 *
 * This test suite verifies:
 * - CareerPathAmbient component renders on /careers page
 * - Canvas is visible and properly sized
 * - ARIA labels are present for accessibility
 * - Reduced motion fallback works
 * - Component is responsive on mobile/desktop
 */

import { test, expect } from '@playwright/test'

test.describe('#398 CareerPathAmbient on Careers page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/careers')
  })

  test('should render CareerPathAmbient component', async ({ page }) => {
    const ambientSection = page.locator('.career-path-ambient')
    await expect(ambientSection).toBeVisible()
  })

  test('should render canvas element', async ({ page }) => {
    const canvas = page.locator('.career-path-canvas')
    await expect(canvas).toBeVisible()
  })

  test('should have proper ARIA attributes for accessibility', async ({ page }) => {
    const ambientSection = page.locator('.career-path-ambient')
    await expect(ambientSection).toHaveAttribute('role', 'img')
    await expect(ambientSection).toHaveAttribute('aria-label')
  })

  test('should have appropriate dimensions', async ({ page }) => {
    const canvas = page.locator('.career-path-canvas')
    const box = await canvas.boundingBox()

    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)
  })

  test('should respect reduced motion preference', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/careers')

    const ambientSection = page.locator('.career-path-ambient')
    await expect(ambientSection).toBeVisible()

    // Component should still render, just without animation
    const canvas = page.locator('.career-path-canvas')
    await expect(canvas).toBeVisible()
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/careers')

    const ambientSection = page.locator('.career-path-ambient')
    await expect(ambientSection).toBeVisible()

    // Check it fits within viewport
    const box = await ambientSection.boundingBox()
    expect(box!.width).toBeLessThanOrEqual(375)
  })

  test('should be responsive on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/careers')

    const ambientSection = page.locator('.career-path-ambient')
    await expect(ambientSection).toBeVisible()

    // Component should utilize available width
    const box = await ambientSection.boundingBox()
    expect(box!.width).toBeGreaterThan(0)
  })
})
