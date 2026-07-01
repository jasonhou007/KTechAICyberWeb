import { test, expect, type Page } from '@playwright/test'
import { mountLazySection } from './fixtures/lazy-mount-helper'

/**
 * #258 — SettlementStream readouts overlapping the footer (LAYOUT bug).
 *
 * Root cause: `.ss-readouts` is `position:absolute; inset:0` inside
 * `.settlement-stream-section` (Home.vue), which has only `min-height:320px`,
 * no fixed height, and `overflow:visible`. The readouts also have
 * `overflow:visible`. When the readout content grows taller than the 320px box
 * (more block rows from the idle interval, a longer locale, larger font), the
 * content paints PAST the section box — bleeding downward onto
 * `.cyber-footer` (App.vue, normal flow, no raised z-index). With the current
 * sparse content it happens to fit, so the bug is LATENT; it reproduces under
 * denser content on BOTH mobile (stacked column) and desktop (the leftmost
 * block-list column grows downward). Additionally `.ss-bg` and `.ss-readouts`
 * have NO declared z-index — they paint in DOM order by accident.
 *
 * The fix is surgical CSS: z-index:0 on .ss-bg, z-index:1 + overflow:hidden on
 * .ss-readouts (SettlementStream.vue); isolation:isolate + overflow:hidden on
 * .settlement-stream-section, plus a mobile min-height override sized to the
 * measured stacked-readout natural height (Home.vue).
 *
 * Testing strategy (iter-35 lesson — assert the CAUSAL property, not a fragile
 * symptom): the geometric overlap is hard to assert reliably because
 * getBoundingClientRect of a descendant does NOT reflect an ancestor's
 * overflow:hidden clip (the layout rect reports where the row WOULD paint,
 * ignoring the clip). So these E2E tests assert the APPLIED COMPUTED CSS
 * invariants that CAUSE the containment (overflow:hidden on both layers,
 * isolation:isolate on the section, z-index ordering) plus a structural
 * no-horizontal-overflow guard. The unit test (258-settlement-overlap.spec.js)
 * asserts the same invariants at the CSS-source level. The screenshots provide
 * the visual proof.
 *
 * Mirrors 206-settlement-stream.spec.ts structure. Base URL resolves to the
 * Vite dev-server origin; the app is served at the /KTechAICyberWeb/ subpath.
 */
const ORIGIN = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const BASE = `${ORIGIN}/KTechAICyberWeb/`

/** Mount the section + scroll it into the live layout, with a small settle. */
async function mountAndScroll(page: Page): Promise<void> {
  await mountLazySection(page, 'lazy-settlement-stream', 'settlement-stream')
  await page
    .locator('[data-test="lazy-settlement-stream"]')
    .first()
    .evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(300)
}

test.describe('#258 SettlementStream overlap — causal geometry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
  })

  test('(desktop + mobile) computed z-index: .ss-bg < .ss-readouts', async ({ page }) => {
    // RED on origin/main: both .ss-bg and .ss-readouts have z-index:auto (no
    // declared stacking order — they paint in DOM order by accident). The fix
    // declares z-index:0 on .ss-bg and z-index:1 on .ss-readouts.
    await mountAndScroll(page)
    const z = await page.evaluate(() => {
      const bg = document.querySelector('.ss-bg') as HTMLElement | null
      const ro = document.querySelector('.ss-readouts') as HTMLElement | null
      if (!bg || !ro) return null
      return {
        bgZ: window.getComputedStyle(bg).zIndex,
        roZ: window.getComputedStyle(ro).zIndex,
      }
    })
    expect(z).not.toBeNull()
    // Both must be numeric (not 'auto') AND bg < readouts.
    const bgN = parseInt(z!.bgZ, 10)
    const roN = parseInt(z!.roZ, 10)
    expect(Number.isFinite(bgN) && Number.isFinite(roN), 'both z-index numeric').toBe(true)
    expect(bgN).toBeLessThan(roN)
  })

  test('(desktop + mobile) .ss-readouts has overflow:hidden (clip overflowing column)', async ({ page }) => {
    // RED on origin/main: .ss-readouts has overflow:visible. The fix adds
    // overflow:hidden so a column that overflows its grid track is clipped at
    // the readout surface rather than painting onto the footer.
    await mountAndScroll(page)
    const overflow = await page.evaluate(() => {
      const ro = document.querySelector('.ss-readouts') as HTMLElement | null
      if (!ro) return null
      return window.getComputedStyle(ro).overflow
    })
    expect(overflow).not.toBeNull()
    expect(overflow).toBe('hidden')
  })

  test('(desktop + mobile) .settlement-stream-section has isolation:isolate (fresh stacking context)', async ({ page }) => {
    // RED on origin/main: the section has no isolation. The fix adds
    // isolation:isolate so the stream's absolute children paint ONLY within
    // the section, never onto the footer or sibling sections. This is the
    // load-bearing containment primitive.
    await mountAndScroll(page)
    const isolation = await page.evaluate(() => {
      const sec = document.querySelector('.settlement-stream-section') as HTMLElement | null
      if (!sec) return null
      return window.getComputedStyle(sec).isolation
    })
    expect(isolation).not.toBeNull()
    expect(isolation).toBe('isolate')
  })

  test('(desktop + mobile) .settlement-stream-section has overflow:hidden (crop spillover backstop)', async ({ page }) => {
    // RED on origin/main: the section has overflow:visible. The fix adds
    // overflow:hidden as the containment backstop.
    await mountAndScroll(page)
    const overflow = await page.evaluate(() => {
      const sec = document.querySelector('.settlement-stream-section') as HTMLElement | null
      if (!sec) return null
      return window.getComputedStyle(sec).overflow
    })
    expect(overflow).not.toBeNull()
    expect(overflow).toBe('hidden')
  })

  test('(desktop + mobile) no horizontal page overflow', async ({ page }) => {
    await mountAndScroll(page)
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    // +1 tolerance for sub-pixel rounding.
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1)
  })

  test('(mobile) .settlement-stream-section min-height sized for stacked readouts', async (
    { page },
    testInfo,
  ) => {
    // RED on origin/main: the section's mobile min-height is 320px (the desktop
    // floor, inherited — there is no @media override). The fix sets a 480px
    // mobile override so the stacked single-column readouts have vertical room.
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'mobile-only min-height driver')
    await mountAndScroll(page)
    const minHeight = await page.evaluate(() => {
      const sec = document.querySelector('.settlement-stream-section') as HTMLElement | null
      if (!sec) return null
      return window.getComputedStyle(sec).minHeight
    })
    expect(minHeight).not.toBeNull()
    // 480px = measured 425px realistic max (6 block rows = composable cap) +
    // ~55px headroom. Assert the exact applied value.
    expect(minHeight).toBe('480px')
  })

  test('capture before/after screenshots of the section', async ({ page }, testInfo) => {
    const label = testInfo.project.name === 'Mobile Chrome' ? 'mobile' : 'desktop'
    // Before mount.
    await page.screenshot({
      path: `tickets/258/evidence/before-${label}.png`,
      fullPage: false,
    })
    await mountAndScroll(page)
    await page.waitForTimeout(200) // extra settle for the after-shot
    await page.screenshot({
      path: `tickets/258/evidence/after-${label}.png`,
      fullPage: false,
    })
    await expect(page.locator('[data-test="settlement-stream"]')).toHaveCount(1)
  })

  test('(mobile) MEASURE stacked-readout natural height for min-height derivation', async (
    { page },
    testInfo,
  ) => {
    // Diagnostic-only test used to DERIVE the mobile min-height value. Runs on
    // Mobile Chrome. The assertion is loose (height > 0) — the real value is
    // printed to the test log and recorded in IMPLEMENTATION_SUMMARY. Measures
    // the natural content height (6 block rows = composable's slice(0,6) cap)
    // so the chosen 480px value can be checked against it.
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'measurement runs on Mobile Chrome only')
    await mountAndScroll(page)
    // Top the block list up to the composable's 6-row cap (the realistic max).
    await page.evaluate(() => {
      const ul = document.querySelector('.ss-block-list') as HTMLElement | null
      if (!ul) return
      const have = ul.children.length
      for (let i = have; i < 6; i++) {
        const li = document.createElement('li')
        li.className = 'ss-block-row'
        li.innerHTML =
          '<span class="ss-block-row-height">#' +
          (19000000 + i) +
          '</span><span class="ss-block-row-tx">' +
          (10 + i) +
          ' tx</span>'
        ul.appendChild(li)
      }
    })
    await page.waitForTimeout(100)
    const measured = await page.evaluate(() => {
      const section = document.querySelector('.settlement-stream-section') as HTMLElement | null
      const readouts = document.querySelector('.ss-readouts') as HTMLElement | null
      if (!section || !readouts) return null
      return {
        sectionMinHeight: window.getComputedStyle(section).minHeight,
        readoutsScrollHeight: readouts.scrollHeight,
        blockRowCount: document.querySelectorAll('.ss-block-row').length,
      }
    })
    // eslint-disable-next-line no-console
    console.log(`[#258 measurement] ${JSON.stringify(measured)}`)
    expect(measured).not.toBeNull()
    expect(measured!.readoutsScrollHeight).toBeGreaterThan(0)
  })
})
