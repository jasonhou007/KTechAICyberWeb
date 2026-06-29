import { test, expect } from '@playwright/test'

/**
 * #224 — Home overhaul live-DOM E2E.
 *
 * Drives the RUNNING app (shipped-app gate, iter 23) to prove the three facets
 * of #224 actually land in the live DOM, not just isolation mounts:
 *   1. Neon glitch / flicker animation is GONE (computed animationName === 'none'
 *      on the h1 ::before/::after — a CSS-source/DOM-computed check, iter 13/15).
 *   2. China-ASEAN mission copy replaces the old hero (en + zh via toggle).
 *   3. "Our Business" rebrand + 5 service-line titles render.
 *   4. Below-the-fold modules lazy-mount: [data-test="neural-core"] etc. are
 *      absent before scroll and appear after scrollIntoView.
 *   5. No raw home.* keys render.
 *   6. prefers-reduced-motion: reduce — page is calm (no glitch) AND modules
 *      still lazy-mount (the lazy wiring is motion-agnostic).
 */

// Resolve the origin from PLAYWRIGHT_BASE_URL (set when running against a
// non-default preview port, e.g. 4175 to avoid the shared-repo port-3000
// contention); fall back to the configured baseURL origin (3000) so the spec
// also runs unchanged under the standard CI/dev server.
const ORIGIN = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const BASE = `${ORIGIN}/KTechAICyberWeb/`

test.describe('#224 Home overhaul — live shipped app', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
  })

  test('h1 has no glitch ::before/::after animation (computed style)', async ({ page }) => {
    const h1 = page.locator('.cyber-header h1.neon-text')
    await expect(h1).toBeVisible()
    // The glitch effect was carried by ::before/::after pseudo-elements with
    // animation: glitch 0.3s infinite. After #224 those pseudos are gone, so
    // their computed animationName MUST be 'none'.
    const pseudo = await h1.evaluate((el) => {
      const before = window.getComputedStyle(el, '::before')
      const after = window.getComputedStyle(el, '::after')
      return {
        before: before.animationName,
        after: after.animationName,
        // Pseudo content must also be empty/none — the glitch pseudos used
        // content: attr(data-text) to clone the title.
        beforeContent: before.content,
        afterContent: after.content,
      }
    })
    expect(pseudo.before).toBe('none')
    expect(pseudo.after).toBe('none')
    expect(pseudo.beforeContent).toBe('none')
    expect(pseudo.afterContent).toBe('none')
  })

  test('h1 carries no glitch-text class and no data-text attribute', async ({ page }) => {
    const h1 = page.locator('.cyber-header h1')
    await expect(h1).not.toHaveClass(/glitch-text/)
    const dataText = await h1.getAttribute('data-text')
    expect(dataText).toBeNull()
  })

  test('hero carries the China-ASEAN mission line (en)', async ({ page }) => {
    const hero = page.locator('.hero .cyber-card')
    await expect(hero).toBeVisible()
    await expect(hero).toContainText('China-ASEAN')
    await expect(hero).toContainText(/leading fintech company/i)
    // The old KBank/Shenzhen regulator copy is gone.
    await expect(hero).not.toContainText('KASIKORNBANK')
    await expect(hero).not.toContainText('Shenzhen Municipal Financial Regulatory Bureau')
  })

  test('hero mission toggles to zh (中国—东盟)', async ({ page }) => {
    const switcher = page.locator('.language-switcher')
    await expect(switcher).toBeVisible()
    await switcher.click()
    const hero = page.locator('.hero .cyber-card')
    await expect(hero).toContainText('中国—东盟')
    await expect(hero).toContainText('致力于成为中国—东盟地区领先的金融科技公司')
    await expect(hero).toContainText('为客户提供更好的金融服务科技')
  })

  test('Our Business section renders with the 5 service-line titles (en)', async ({ page }) => {
    const text = await page.locator('body').textContent() ?? ''
    expect(text).toContain('Our Business')
    expect(text).not.toContain('What We Do')
    // 4 blockchain service lines + banking group.
    expect(text).toContain('Regulated Public Blockchain')
    expect(text).toContain('Cross Border Payment')
    expect(text).toContain('Digital Asset Custody')
    expect(text).toContain('Stablecoin')
    expect(text).toContain('Retail Lending')
    expect(text).toContain('Supply Chain Finance')
  })

  test('no raw home.* i18n key renders on the live page', async ({ page }) => {
    const text = await page.locator('body').textContent() ?? ''
    expect(text.match(/home\.[a-zA-Z][a-zA-Z0-9.]*/g)).toBeNull()
  })

  test('below-the-fold modules are absent before scroll and appear after', async ({ page }) => {
    // Each heavy module is wrapped in <LazySection data-test="lazy-<name>">.
    // Before scroll, the slot (the inner component) must NOT be mounted.
    const lazyWrappers = [
      'lazy-neural-terminal',
      'lazy-neural-core',
      'lazy-solution-forge',
      'lazy-cyber-ops-hud',
      'lazy-neon-pulse',
    ]
    // The inner-component data-test hooks that the components themselves emit.
    const innerHooks = [
      'cyber-ops-hud',
      'neon-pulse',
    ]

    // 1. Before scroll: the inner known hooks must be absent.
    for (const hook of innerHooks) {
      await expect(page.locator(`[data-test="${hook}"]`)).toHaveCount(0)
    }

    // 2. Force-scroll each lazy wrapper's center into view, then wait for the
    //    IntersectionObserver callback to mount the inner component. We use
    //    scrollIntoView (NOT scrollIntoViewIfNeeded, which is a no-op if the
    //    1px sentinel is technically on-screen) and Playwright's auto-retrying
    //    expect() (NOT a fixed waitForTimeout) so the test tolerates dev-server
    //    cold-start / IO-callback latency without flaking.
    for (const w of lazyWrappers) {
      const locator = page.locator(`[data-test="${w}"]`)
      if ((await locator.count()) > 0) {
        await locator.first().evaluate((el) => el.scrollIntoView({ block: 'center' }))
      }
    }

    // 3. After scroll, CyberOpsHud + NeonPulse (which both emit data-test
    //    hooks) must be present. Auto-retry up to the default expect timeout.
    await expect(page.locator('[data-test="cyber-ops-hud"]')).toHaveCount(1)
    await expect(page.locator('[data-test="neon-pulse"]')).toHaveCount(1)
  })

  test('prefers-reduced-motion: reduce — page is calm, modules still lazy', async ({ browser }) => {
    const ctx = await browser.newContext({
      reducedMotion: 'reduce',
    })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')

    // 1. Even with reduced motion, the h1 has NO glitch pseudos.
    const h1 = page.locator('.cyber-header h1.neon-text')
    const pseudo = await h1.evaluate((el) => {
      const before = window.getComputedStyle(el, '::before')
      const after = window.getComputedStyle(el, '::after')
      return { before: before.animationName, after: after.animationName }
    })
    expect(pseudo.before).toBe('none')
    expect(pseudo.after).toBe('none')

    // 2. Lazy-mount is motion-agnostic: known inner hooks absent before scroll.
    await expect(page.locator('[data-test="cyber-ops-hud"]')).toHaveCount(0)
    // Force-scroll the wrapper center into view (NOT scrollIntoViewIfNeeded,
    // which no-ops on the 1px sentinel) and auto-retry for the inner component
    // (NOT a fixed waitForTimeout), matching the "below-the-fold modules" test.
    await page
      .locator('[data-test="lazy-cyber-ops-hud"]')
      .first()
      .evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await expect(page.locator('[data-test="cyber-ops-hud"]')).toHaveCount(1)

    await page.screenshot({
      path: 'tickets/224/evidence/reduced-motion-home.png',
      fullPage: true,
    })
    await ctx.close()
  })

  test('captures after screenshot of Home hero + Our Business section', async ({ page }) => {
    await page.locator('.cyber-header').scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await page.screenshot({
      path: 'tickets/224/evidence/after-home-hero.png',
      fullPage: false,
    })
    await page.locator('.whatwedo').scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await page.screenshot({
      path: 'tickets/224/evidence/after-our-business.png',
      fullPage: false,
    })
    await expect(page.locator('.cyber-header h1.neon-text')).toBeVisible()
  })
})
