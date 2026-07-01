import { test, expect } from '@playwright/test'

/**
 * #265 — Home page single-screen fit (live-DOM E2E).
 *
 * Drives the RUNNING app to prove the four facets of #265 land in the live DOM,
 * not just source-text:
 *   1. On 1920x1080 / 2560x1440 / 3840x2160 the above-the-fold flagship region
 *      (`.cyber-header` title -> `.hero`, which CONTAINS the Self-driving
 *      pipeline section per Home.vue) fits within one viewport height. We
 *      measure the `.hero` element's bottom because `.home` as a whole wraps
 *      the lazy-mounted below-the-fold modules (Neural Terminal, Neural Core,
 *      Solution Forge, Cyber Ops HUD, Settlement Stream) which are designed to
 *      be scrolled to — they are NOT part of the #265 "fit one screen" AC.
 *      App.vue's <Header>/<main>/<Footer> are siblings outside `.home`, so the
 *      hero is the right boundary of the flagship above-the-fold story.
 *   2. At 1920x1080 the Self-driving pipeline section is fully visible above
 *      the fold (top within viewport, bottom not clipped by `.home{overflow:hidden}`).
 *   3. The h1 is still visible (the size reduction didn't collapse it).
 *   4. No horizontal overflow on mobile (375x812) — the clamp floors didn't
 *      regress the narrow viewport.
 *
 * Run against a preview server to dodge the shared-repo port-3000 contention:
 *   build -> vite preview --port 4173 -> PLAYWRIGHT_BASE_URL=http://localhost:4173
 */

const ORIGIN = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const BASE = `${ORIGIN}/KTechAICyberWeb/`

const DESKTOP_VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 3840, height: 2160 },
]

test.describe('#265 Home single-screen fit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
  })

  for (const vp of DESKTOP_VIEWPORTS) {
    test(`flagship region (title + Self-driving + hero) fits one viewport @${vp.width}x${vp.height}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: vp })
      const page = await ctx.newPage()
      await page.goto(BASE)
      await page.waitForLoadState('networkidle')

      // Measure the .hero element's bottom: it is the last flagship above-the-
      // fold child of `.home .content`, after the cyber-header (title) and the
      // `.self-driving-section` (which Home.vue mounts IN-FLOW between header
      // and hero). The lazy-mounted modules come AFTER `.hero` and are designed
      // to be scrolled to, so they are out of the #265 "one screen" scope.
      // Measuring `.home` itself would be wrong: `.home` wraps those lazy
      // sections and extends to ~3x viewport height by design.
      const measured = await page.evaluate(() => {
        const hero = document.querySelector('.home .hero') as HTMLElement | null
        if (!hero) return { found: false, bottom: -1, innerHeight: window.innerHeight }
        const rect = hero.getBoundingClientRect()
        return {
          found: true,
          top: rect.top,
          bottom: rect.bottom,
          innerHeight: window.innerHeight,
        }
      })
      expect(measured.found, '.home .hero selector must resolve').toBe(true)
      // +2 absorbs sub-pixel rounding (fractional rect.bottom vs integer
      // innerHeight on device-pixel-ratio > 1 viewports).
      expect(measured.bottom).toBeLessThanOrEqual(measured.innerHeight + 2)
      await ctx.close()
    })
  }

  test('Self-driving section fully visible above the fold @1920x1080', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')

    // h1 is visible — the size reduction didn't collapse the title.
    const h1 = page.locator('.cyber-header h1')
    await expect(h1).toBeVisible()

    // The Self-driving section: prefer the explicit root attribute the
    // component emits, fall back to the section wrapper class.
    const section = page.locator('[data-selfdriving-root="true"]').or(
      page.locator('.self-driving-section'),
    )
    await expect(section.first()).toBeVisible()

    const rect = await section.first().evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, innerHeight: window.innerHeight }
    })
    // Section top is within the viewport (not pushed below the fold).
    expect(rect.top).toBeGreaterThanOrEqual(0)
    expect(rect.top).toBeLessThan(rect.innerHeight)
    // Whole section visible — not clipped by .home{overflow:hidden}.
    expect(rect.bottom).toBeLessThanOrEqual(rect.innerHeight + 2)

    await ctx.close()
  })

  test('no horizontal overflow @375x812 (mobile floor did not regress)', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
    })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    // +2 absorbs sub-pixel rounding.
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 2)

    await ctx.close()
  })
})
