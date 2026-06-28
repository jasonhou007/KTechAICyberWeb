import { test, expect } from '@playwright/test'

/**
 * About & News section images — AC #165
 *
 * Verifies the official-site imagery extracted for AC #165 actually renders
 * in the shipped app (live DOM, real <img> elements with naturalWidth > 0),
 * that the alt text is non-empty, and that the CyberImage figures are present
 * on both desktop and mobile viewports.
 *
 * Paths use the Vite base subpath (/KTechAICyberWeb/) — see playwright.config.ts.
 *
 * Tags: @regression @assets @a11y
 */

const BASE = '/KTechAICyberWeb/'

test.describe('About & News images (AC #165)', () => {
  test.describe('desktop viewport', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('About hero image renders with non-zero naturalWidth and non-empty alt', async ({ page }) => {
      await page.goto(`${BASE}about`)

      const heroImg = page.locator('.about-hero figure.cyber-image img').first()
      await expect(heroImg).toBeVisible()
      // Wait for the image to actually load (naturalWidth > 0 proves a real
      // decoded image, not a broken/empty src).
      const naturalWidth = await heroImg.evaluate(
        (el: HTMLImageElement) => el.naturalWidth,
      )
      expect(naturalWidth).toBeGreaterThan(0)

      const alt = await heroImg.getAttribute('alt')
      expect(alt && alt.trim().length).toBeGreaterThan(0)
      // No raw dotted key leaks into the alt
      expect(alt).not.toMatch(/^about\./)
    })

    test('About awards-strip renders multiple award CyberImages', async ({ page }) => {
      await page.goto(`${BASE}about`)

      const awardFigs = page.locator('.awards-strip figure.cyber-image')
      await expect(awardFigs.first()).toBeVisible()
      const count = await awardFigs.count()
      expect(count).toBeGreaterThanOrEqual(3)

      // Every award image actually loaded
      for (let i = 0; i < count; i++) {
        const img = awardFigs.nth(i).locator('img')
        const naturalWidth = await img.evaluate(
          (el: HTMLImageElement) => el.naturalWidth,
        )
        expect(naturalWidth).toBeGreaterThan(0)
      }
    })

    test('About who-we-are feature image and culture image render', async ({ page }) => {
      await page.goto(`${BASE}about`)

      const feature = page.locator('.who-we-are figure.cyber-image img').first()
      await expect(feature).toBeVisible()
      const featW = await feature.evaluate((el: HTMLImageElement) => el.naturalWidth)
      expect(featW).toBeGreaterThan(0)

      const culture = page.locator('.vision-mission figure.cyber-image img').first()
      await expect(culture).toBeVisible()
      const cultW = await culture.evaluate((el: HTMLImageElement) => el.naturalWidth)
      expect(cultW).toBeGreaterThan(0)
    })

    test('News card images render inside CyberImage figures', async ({ page }) => {
      await page.goto(`${BASE}news`)

      const cardFigs = page.locator('.news-card__image-wrapper figure.cyber-image')
      await expect(cardFigs.first()).toBeVisible()
      const count = await cardFigs.count()
      expect(count).toBeGreaterThanOrEqual(1)

      const img = cardFigs.first().locator('img')
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth,
      )
      expect(naturalWidth).toBeGreaterThan(0)

      const alt = await img.getAttribute('alt')
      expect(alt && alt.trim().length).toBeGreaterThan(0)
      expect(alt).not.toMatch(/^news\./)
    })

    test('News detail featured image renders inside CyberImage figure', async ({ page }) => {
      await page.goto(`${BASE}news/ktech-achieves-iso27001-certification`)

      // The article loads after a 200ms onMounted setTimeout; wait for the
      // featured CyberImage figure to appear.
      const fig = page.locator('.news-detail__figure figure.cyber-image').first()
      await expect(fig).toBeVisible({ timeout: 10000 })

      const img = fig.locator('img')
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth,
      )
      expect(naturalWidth).toBeGreaterThan(0)

      const alt = await img.getAttribute('alt')
      expect(alt && alt.trim().length).toBeGreaterThan(0)
    })
  })

  test.describe('mobile viewport', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('About hero and awards render on mobile', async ({ page }) => {
      await page.goto(`${BASE}about`)

      const heroImg = page.locator('.about-hero figure.cyber-image img').first()
      await expect(heroImg).toBeVisible()
      const naturalWidth = await heroImg.evaluate(
        (el: HTMLImageElement) => el.naturalWidth,
      )
      expect(naturalWidth).toBeGreaterThan(0)

      const awardFigs = page.locator('.awards-strip figure.cyber-image')
      const count = await awardFigs.count()
      expect(count).toBeGreaterThanOrEqual(3)
    })

    test('News card image renders on mobile', async ({ page }) => {
      await page.goto(`${BASE}news`)

      const fig = page.locator('.news-card__image-wrapper figure.cyber-image').first()
      await expect(fig).toBeVisible()
      const naturalWidth = await fig
        .locator('img')
        .evaluate((el: HTMLImageElement) => el.naturalWidth)
      expect(naturalWidth).toBeGreaterThan(0)
    })
  })
})
