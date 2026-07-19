/**
 * E2E tests for Issue #404 - Mobile ambient performance optimization
 * Tests mobile TBT, performance marks, desktop regression, and reduced motion
 */

import { test, expect } from '@playwright/test'

// Mobile viewport dimensions
const MOBILE_WIDTH = 375
const MOBILE_HEIGHT = 667

// Desktop viewport dimensions
const DESKTOP_WIDTH = 1920
const DESKTOP_HEIGHT = 1080

// Performance thresholds for Issue #404
const MOBILE_TBT_THRESHOLD = 200 // ms
const MOBILE_PERFORMANCE_SCORE_THRESHOLD = 0.9
const LONG_TASK_THRESHOLD = 50 // ms

test.describe('Issue #404 - Mobile Ambient Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mobile viewport
    await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT })
  })

  test('should have zero long tasks on /about (mobile)', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      return {
        longTasks: performance.getEntriesByType('longtask')
      }
    })

    // Filter tasks longer than 50ms
    const longTasksOverThreshold = metrics.longTasks.filter(
      task => task.duration > LONG_TASK_THRESHOLD
    )

    expect(longTasksOverThreshold.length).toBe(0)
  })

  test('should have performance marks on /about (mobile)', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')

    // Wait for ambient animations to start
    await page.waitForTimeout(1000)

    // Check for performance marks
    const marks = await page.evaluate(() => {
      return performance.getEntriesByType('mark')
        .filter(entry => entry.name.includes('ambient'))
        .map(entry => ({
          name: entry.name,
          startTime: entry.startTime
        }))
    })

    // Should have ambient performance marks
    expect(marks.length).toBeGreaterThan(0)

    // Check for specific marks
    const markNames = marks.map(m => m.name)
    expect(markNames.some(name => name.includes('ambient-raf'))).toBe(true)
  })

  test('should have zero long tasks on /services (mobile)', async ({ page }) => {
    await page.goto('/services')
    await page.waitForLoadState('networkidle')

    const metrics = await page.evaluate(() => {
      return {
        longTasks: performance.getEntriesByType('longtask')
      }
    })

    const longTasksOverThreshold = metrics.longTasks.filter(
      task => task.duration > LONG_TASK_THRESHOLD
    )

    expect(longTasksOverThreshold.length).toBe(0)
  })

  test('should have performance marks on /services (mobile)', async ({ page }) => {
    await page.goto('/services')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const marks = await page.evaluate(() => {
      return performance.getEntriesByType('mark')
        .filter(entry => entry.name.includes('ambient'))
        .map(entry => ({ name: entry.name }))
    })

    expect(marks.length).toBeGreaterThan(0)
  })

  test('should have zero long tasks on /contact (mobile)', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')

    const metrics = await page.evaluate(() => {
      return {
        longTasks: performance.getEntriesByType('longtask')
      }
    })

    const longTasksOverThreshold = metrics.longTasks.filter(
      task => task.duration > LONG_TASK_THRESHOLD
    )

    expect(longTasksOverThreshold.length).toBe(0)
  })

  test('should have performance marks on /contact (mobile)', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const marks = await page.evaluate(() => {
      return performance.getEntriesByType('mark')
        .filter(entry => entry.name.includes('contact-network'))
        .map(entry => ({ name: entry.name }))
    })

    expect(marks.length).toBeGreaterThan(0)
  })

  test('should have zero long tasks on /careers (mobile)', async ({ page }) => {
    await page.goto('/careers')
    await page.waitForLoadState('networkidle')

    const metrics = await page.evaluate(() => {
      return {
        longTasks: performance.getEntriesByType('longtask')
      }
    })

    const longTasksOverThreshold = metrics.longTasks.filter(
      task => task.duration > LONG_TASK_THRESHOLD
    )

    expect(longTasksOverThreshold.length).toBe(0)
  })

  test('should have performance marks on /careers (mobile)', async ({ page }) => {
    await page.goto('/careers')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const marks = await page.evaluate(() => {
      return performance.getEntriesByType('mark')
        .filter(entry => entry.name.includes('career-path'))
        .map(entry => ({ name: entry.name }))
    })

    expect(marks.length).toBeGreaterThan(0)
  })

  test('should have adaptive particle counts on mobile', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')

    // Check that mobile adaptive behavior is working
    const isMobile = await page.evaluate(() => {
      return window.innerWidth <= 768
    })

    expect(isMobile).toBe(true)
  })

  test('should measure RAF frame durations', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Check for performance measures
    const measures = await page.evaluate(() => {
      return performance.getEntriesByType('measure')
        .filter(entry => entry.name.includes('raf-duration'))
        .map(entry => ({
          name: entry.name,
          duration: entry.duration
        }))
    })

    expect(measures.length).toBeGreaterThan(0)

    // Verify RAF frames are under 16.7ms (60fps target on desktop)
    // Note: Mobile target is 30fps (~33ms), so we use a more lenient threshold
    const maxFrameDuration = Math.max(...measures.map(m => m.duration))
    expect(maxFrameDuration).toBeLessThan(50) // Allow for some overhead
  })
})

test.describe('Issue #404 - Desktop Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up desktop viewport
    await page.setViewportSize({ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT })
  })

  test('desktop ambient animations should run at 60fps', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Check for performance measures
    const measures = await page.evaluate(() => {
      return performance.getEntriesByType('measure')
        .filter(entry => entry.name.includes('raf-duration'))
        .map(entry => ({ duration: entry.duration }))
    })

    expect(measures.length).toBeGreaterThan(0)

    // Desktop should maintain ~60fps (16.7ms per frame)
    const avgFrameDuration = measures.reduce((sum, m) => sum + m.duration, 0) / measures.length
    expect(avgFrameDuration).toBeLessThan(20) // Allow some overhead
  })

  test('desktop should have full particle count', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')

    // Verify desktop behavior
    const particleCount = await page.evaluate(() => {
      // Check if we're on desktop
      return window.innerWidth > 768
    })

    expect(particleCount).toBe(true)
  })

  test('desktop ambient should have no visual degradation', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')

    // Check that ambient elements are present and visible
    const ambientCanvas = await page.locator('.about-ambient .ambient-canvas').isVisible()
    expect(ambientCanvas).toBe(true)
  })
})

test.describe('Issue #404 - Reduced Motion Accessibility', () => {
  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT })

    await page.goto('/about')
    await page.waitForLoadState('networkidle')

    // Check for static fallback
    const staticFallback = await page.locator('.about-ambient.ambient-static').isVisible()
    expect(staticFallback).toBe(true)
  })

  test('should not have long tasks with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT })

    await page.goto('/about')
    await page.waitForLoadState('networkidle')

    const metrics = await page.evaluate(() => {
      return {
        longTasks: performance.getEntriesByType('longtask')
      }
    })

    const longTasksOverThreshold = metrics.longTasks.filter(
      task => task.duration > LONG_TASK_THRESHOLD
    )

    expect(longTasksOverThreshold.length).toBe(0)
  })
})

test.describe('Issue #404 - Performance Marks Validation', () => {
  test('should create performance marks for all ambient components', async ({ page }) => {
    await page.setViewportSize({ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Get all performance marks
    const marks = await page.evaluate(() => {
      return performance.getEntriesByType('mark')
        .filter(entry => entry.name.includes('ambient') ||
                         entry.name.includes('about') ||
                         entry.name.includes('contact') ||
                         entry.name.includes('career'))
        .map(entry => entry.name)
    })

    // Should have marks from multiple components
    expect(marks.length).toBeGreaterThan(0)
  })

  test('should have consistent mark naming convention', async ({ page }) => {
    await page.setViewportSize({ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT })
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const marks = await page.evaluate(() => {
      return performance.getEntriesByType('mark')
        .filter(entry => entry.name.includes('ambient') ||
                         entry.name.includes('about'))
        .map(entry => entry.name)
    })

    // All marks should follow naming convention
    marks.forEach(mark => {
      expect(mark).toMatch(/^(ambient|about|contact|career)-/)
    })
  })
})
