import { test, expect } from '@playwright/test'

/**
 * #313 — Home above-the-fold rhythm tightening (live-DOM E2E, source of truth).
 *
 * This is the LIVE-DOM measurement that proves the #313 visual AC lands in the
 * real rendered page (the unit spec tests/source-text contracts only). It
 * supersedes the 1080p-only partial-win assertion in 265-home-single-screen.spec.ts
 * by tightening the .whatwedo/.cta rhythm so the full eager flagship stack FLIPS
 * from fail to pass @2560x1440.
 *
 * REVISED AC (the literal #265 AC1 — entire Home fits @1920x1080 — is
 * geometrically impossible without breaking #203's SelfDrivingDemo IN-FLOW
 * flagship; live-DOM measured 2026-07-02):
 *   - @3840x2160: full eager stack (.cta last) fits one viewport (was UNDER by 493).
 *   - @2560x1440: full eager stack (.cta last) fits one viewport AFTER tightening
 *     (was OVER by 128 — this is the NEW pass this ticket delivers).
 *   - @1920x1080: header + Self-driving + hero fit above the fold (hero.bottom
 *     <= innerHeight), AND the full .whatwedo+.cta is reachable within one
 *     screen-height of scroll (cta.bottom <= 2 * innerHeight — honest wording).
 *
 * Pattern: copy of tests/e2e/265-home-single-screen.spec.ts — browser.newContext
 * with explicit viewport + deviceScaleFactor:1, getBoundingClientRect().bottom,
 * waitForLoadState('networkidle'). Run against a preview server on 4173 to
 * dodge the shared-repo port-3000 contention:
 *   build -> vite preview --port 4173 -> PLAYWRIGHT_BASE_URL=http://localhost:4173
 */

const ORIGIN = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const BASE = `${ORIGIN}/KTechAICyberWeb/`

// +2 absorbs sub-pixel rounding (fractional rect.bottom vs integer innerHeight
// on device-pixel-ratio > 1 viewports). Matches the 265 spec tolerance.
const TOLERANCE = 2

// The eager flagship stack: header -> self-driving -> hero -> .whatwedo (6
// cards) -> .cta. .cta is the LAST eagerly-rendered child of .home .content
// (the lazy modules come after and are designed to be scrolled to).
async function measureStackBottom(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const cta = document.querySelector('.home .cta') as HTMLElement | null
    const hero = document.querySelector('.home .hero') as HTMLElement | null
    if (!cta || !hero) {
      return { found: false as const, innerHeight: window.innerHeight }
    }
    return {
      found: true as const,
      ctaBottom: cta.getBoundingClientRect().bottom,
      heroBottom: hero.getBoundingClientRect().bottom,
      innerHeight: window.innerHeight,
    }
  })
}

test.describe('#313 Home above-the-fold rhythm tightening', () => {
  test.describe.configure({ mode: 'serial' })

  test('full eager stack (.cta) fits one viewport @3840x2160 (was UNDER by 493)', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 3840, height: 2160 },
      deviceScaleFactor: 1,
    })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')

    const m = await measureStackBottom(page)
    expect(m.found, '.home .cta + .home .hero selectors must resolve').toBe(true)
    if (!m.found) {
      await ctx.close()
      return
    }
    // Full stack fits — must REMAIN fitting (was already under by 493px; the
    // rhythm tightening must not regress 4K).
    expect(m.ctaBottom).toBeLessThanOrEqual(m.innerHeight + TOLERANCE)

    await ctx.close()
  })

  test('full eager stack (.cta) fits one viewport @2560x1440 (NEW pass — was OVER by 128)', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 2560, height: 1440 },
      deviceScaleFactor: 1,
    })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')

    const m = await measureStackBottom(page)
    expect(m.found, '.home .cta + .home .hero selectors must resolve').toBe(true)
    if (!m.found) {
      await ctx.close()
      return
    }
    // This is the load-bearing NEW-pass assertion: was 128px OVER (cta.bottom=1568,
    // innerHeight=1440). The rhythm tightening must bring cta.bottom <= 1442.
    expect(m.ctaBottom).toBeLessThanOrEqual(m.innerHeight + TOLERANCE)

    await ctx.close()
  })

  test('header + Self-driving + hero above the fold @1920x1080; whatwedo+cta within one screen-height', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')

    const m = await measureStackBottom(page)
    expect(m.found, '.home .cta + .home .hero selectors must resolve').toBe(true)
    if (!m.found) {
      await ctx.close()
      return
    }
    // (a) header + Self-driving + hero fit ABOVE the fold (hero.bottom <= 1080).
    // Was hero.bottom=1014 at baseline; the rhythm tightening must not regress it.
    expect(m.heroBottom).toBeLessThanOrEqual(m.innerHeight + TOLERANCE)
    // (b) Honest revised wording: the full .whatwedo+.cta is reachable within
    // ONE screen-height of scroll (cta.bottom <= 2 * innerHeight = 2160). Was
    // cta.bottom=1482 at baseline (well within 2160); the tightening holds this.
    expect(m.ctaBottom).toBeLessThanOrEqual(2 * m.innerHeight)

    await ctx.close()
  })
})
