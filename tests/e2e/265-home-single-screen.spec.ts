import { test, expect } from '@playwright/test'

/**
 * #265 — Home page single-screen fit (live-DOM E2E).
 *
 * Drives the RUNNING app to prove the four facets of #265 land in the live DOM,
 * not just source-text:
 *   1. On 1920x1080 / 2560x1440 / 3840x2160 the `.home` element (the Home view
 *      root — NOT body, because App.vue renders footer/nav outside `.home`)
 *      fits within one viewport height with no scroll.
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
    test(`.home fits one viewport @${vp.width}x${vp.height}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: vp })
      const page = await ctx.newPage()
      await page.goto(BASE)
      await page.waitForLoadState('networkidle')

      // Measure the .home element itself. App.vue renders <Header>, <main>,
      // <Footer> as siblings; .home is only the Home view root. The #265 AC is
      // "the Home page (incl. Self-driving pipeline) fits one screen" — that's
      // the .home box, not the whole document.
      const measured = await page.evaluate(() => {
        const home = document.querySelector('.home') as HTMLElement | null
        if (!home) return { found: false, bottom: -1, innerHeight: window.innerHeight }
        const rect = home.getBoundingClientRect()
        return {
          found: true,
          top: rect.top,
          bottom: rect.bottom,
          innerHeight: window.innerHeight,
        }
      })
      expect(measured.found, '.home selector must resolve').toBe(true)
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
