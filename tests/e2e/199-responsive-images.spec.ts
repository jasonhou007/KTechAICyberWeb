import { test, expect } from '@playwright/test'

/**
 * Responsive image variants — AC #199 (AC3: mobile loads a smaller variant)
 *
 * Verifies the CyberImage srcset/sizes wiring on the About hero actually
 * selects a smaller source on a mobile viewport than on desktop. The
 * load-bearing signal is the <img>'s currentSrc: on desktop (1920x1080) the
 * browser picks the 800w variant / original 800px file; on mobile (375x667)
 * it picks the 400w variant. We assert currentSrc names the chosen variant
 * file, and the strict mobile-naturalWidth < desktop-naturalWidth comparison
 * as the AC3 contract — both would FAIL if srcset/sizes were absent (every
 * viewport would load the same 800px `src`).
 *
 * Note on naturalWidth: chromium reports the decoded naturalWidth as the
 * source's intrinsic width for these WebPs, which differs between variants
 * (400w file vs 800w file), so the strict ordering is meaningful. The
 * currentSrc assertion is the deterministic, dimension-independent proof.
 *
 * Note on deviceScaleFactor (DPR): the AC tests the LOGIC of "smaller viewport
 * => smaller source file". A real Pixel 5 has DPR 2.75, so at 375 CSS-px the
 * browser needs ~1031 device px and correctly picks the larger source — that
 * is correct real-device behavior, NOT a bug. To test the srcset LOGIC itself
 * deterministically across the Desktop Chrome and Mobile Chrome CI projects
 * (which apply different device contexts: Desktop=1x, Pixel 5=2.75x), every
 * viewport here pins deviceScaleFactor: 1 explicitly. This isolates the AC3
 * contract (viewport-driven variant selection) from the separate,
 * device-dependent question of high-DPR up-sampling. With DPR pinned to 1,
 * 100vw at 375px = 375 device px => the 400w variant is the smallest source
 * that satisfies it, and the assertion holds in BOTH CI projects.
 *
 * Lives in tests/e2e/ (the collected testDir — see playwright.config.ts); the
 * top-level e2e/ dir is NOT collected. Paths use the Vite base subpath
 * (/KTechAICyberWeb/) per the existing 165-about-news-images.spec.ts pattern.
 *
 * Tags: @regression @perf @assets
 */

const BASE = '/KTechAICyberWeb/'
const HERO_IMG_SELECTOR = '.about-hero figure.cyber-image img'

interface HeroImgInfo {
  currentSrc: string
  naturalWidth: number
}

/** Read the currentSrc + naturalWidth of the hero <img>, waiting until the
 * image has actually decoded (complete + naturalWidth > 0) so the values
 * reflect the chosen source, not a not-yet-loaded placeholder. */
async function heroImgInfo(page: import('@playwright/test').Page): Promise<HeroImgInfo> {
  const img = page.locator(HERO_IMG_SELECTOR).first()
  await expect(img).toBeVisible()
  await expect.poll(
    async () =>
      img.evaluate((el: HTMLImageElement) =>
        el.complete ? el.naturalWidth : 0,
      ),
    { timeout: 10000, message: 'About hero image should decode (naturalWidth > 0)' },
  ).toBeGreaterThan(0)
  return img.evaluate((el: HTMLImageElement) => ({
    currentSrc: el.currentSrc,
    naturalWidth: el.naturalWidth,
  }))
}

test.describe('Responsive images (AC #199)', () => {
  test.describe('desktop viewport (1920x1080)', () => {
    // Pin DPR=1 so the test verifies viewport-driven selection deterministically
    // under BOTH the Desktop Chrome (1x) and Mobile Chrome (Pixel 5, 2.75x) CI
    // projects — see the header note on deviceScaleFactor.
    test.use({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })

    test('About hero selects the 800w source (not the 400w mobile variant)', async ({ page }) => {
      await page.goto(`${BASE}about`)
      await page.waitForLoadState('networkidle')
      const { currentSrc } = await heroImgInfo(page)
      // Desktop must NOT load the 400w mobile variant. It picks the 800w
      // variant (or the original 800px file the 1200w descriptor points at).
      expect(currentSrc).not.toMatch(/about-who-we-are-400w\.webp/)
      expect(currentSrc).toMatch(/about-who-we-are(-800w)?\.webp/)
    })
  })

  test.describe('mobile viewport (375x667)', () => {
    // Pin DPR=1 — see the desktop block comment + header note. Without this,
    // the Mobile Chrome CI project (Pixel 5, DPR 2.75) would correctly pick
    // the larger source (375 CSS-px * 2.75 ≈ 1031 device px), which is right
    // for a real device but obscures the srcset/sizes LOGIC under test.
    test.use({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 1 })

    test('About hero selects the 400w variant', async ({ page }) => {
      await page.goto(`${BASE}about`)
      await page.waitForLoadState('networkidle')
      const { currentSrc } = await heroImgInfo(page)
      // sizes="(max-width: 600px) 100vw, 50vw" + the 375px viewport => the
      // browser picks the 400w variant (smallest source >= 100vw=375px).
      expect(currentSrc).toMatch(/about-who-we-are-400w\.webp/)
    })
  })

  test('mobile loads a strictly smaller source than desktop (AC3)', async ({ browser }) => {
    // Drive both viewports from the same browser instance and assert the
    // mobile naturalWidth is strictly less than the desktop one. This is the
    // core AC3 contract: a smaller viewport loads a smaller variant. Both
    // viewports also pick different currentSrc files (400w vs 800w).
    const desktopCtx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    })
    const mobileCtx = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 1,
    })
    const desktopPage = await desktopCtx.newPage()
    const mobilePage = await mobileCtx.newPage()
    try {
      await desktopPage.goto(`${BASE}about`)
      await desktopPage.waitForLoadState('networkidle')
      const desktop = await heroImgInfo(desktopPage)

      await mobilePage.goto(`${BASE}about`)
      await mobilePage.waitForLoadState('networkidle')
      const mobile = await heroImgInfo(mobilePage)

      // The two viewports select DIFFERENT source files.
      expect(mobile.currentSrc).not.toBe(desktop.currentSrc)
      // And the mobile source's naturalWidth is strictly smaller.
      expect(mobile.naturalWidth).toBeLessThan(desktop.naturalWidth)
    } finally {
      await desktopCtx.close()
      await mobileCtx.close()
    }
  })
})
