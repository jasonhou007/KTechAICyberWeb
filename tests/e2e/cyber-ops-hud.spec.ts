/**
 * @file cyber-ops-hud.spec.ts
 * @description Playwright E2E for the Cyber Ops HUD (#182).
 *
 * Verifies the shipped user flow on the real app:
 *  - the HUD renders on the shipped homepage (>=3 widgets, 4 filter tabs);
 *  - Pulse spikes metrics + appends a pulse event + raises the anomaly toast;
 *  - the event feed filter updates the rendered list live;
 *  - Investigate opens the drill-down; Dismiss closes the toast;
 *  - clicking a metric card expands the detail panel;
 *  - reduced-motion mode is safe (request-flow hidden, root has the class);
 *  - mobile viewport renders without throwing.
 *
 * Run: node_modules/.bin/playwright test cyber-ops-hud --project=chromium
 * (playwright.config.ts sets baseURL = http://localhost:3000; goto('/') resolves
 * to the /KTechAICyberWeb/ subpath.)
 *
 * @ticket #182
 */

import { test, expect } from '@playwright/test'
import { mountLazySection, forceClick } from './fixtures/lazy-mount-helper'

test.describe('#182 Cyber Ops HUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // #224: CyberOpsHud is lazy-mounted inside <LazySection>; scroll it into
    // view so the inner component mounts before any query. Behavior under test
    // is unchanged.
    await mountLazySection(page, 'lazy-cyber-ops-hud', 'cyber-ops-hud')
  })

  test('the HUD renders on the shipped homepage with >=3 widgets + 4 filter tabs', async ({ page }) => {
    const hud = page.locator('[data-test="cyber-ops-hud"]')
    await expect(hud).toBeVisible()

    const widgets = await page.locator('[data-test="ops-widget"]').count()
    expect(widgets).toBeGreaterThanOrEqual(3)

    const tabs = await page.locator('[data-test^="ops-tab-"]').count()
    expect(tabs).toBe(4)

    // The title is localized copy, not a raw key.
    const title = await page.locator('[data-test="cyber-ops-hud"] .ops-hud-title').textContent()
    expect(title ?? '').not.toContain('opsHud.')
  })

  test('Pulse spikes metrics + appends a pulse event + raises the anomaly toast', async ({ page }) => {
    const eventsBefore = await page.locator('[data-test="ops-event-list"] .ops-event-item').count()

    await page.locator('[data-test="ops-pulse-button"]').click()

    // A pulse event was appended to the feed.
    const eventsAfter = await page.locator('[data-test="ops-event-list"] .ops-event-item').count()
    expect(eventsAfter).toBeGreaterThan(eventsBefore)

    // The anomaly toast is raised deterministically after the pulse.
    await expect(page.locator('[data-test="ops-anomaly-toast"]')).toBeVisible({ timeout: 5000 })
  })

  test('the event feed filter updates the rendered list live', async ({ page }) => {
    // #244 webkit/Mobile Safari: on the webkit engine family, every click
    // target below times out at webkit's actionability stability check because
    // the sibling infinite HUD animated metrics (gauge/throughput tickers) keep
    // the layout unsettled. forceClick force-clicks (skipping the impossible
    // stability gate) AND retries until each click's effect lands.
    // On chromium/firefox/Mobile Chrome there was NEVER a stability issue (the
    // original plain click() worked for years), and forceClick's retry loop
    // introduced new flakiness there under CI load (firefox + Mobile Chrome CI
    // failures, runs 28456837229/28459517034). So we scope forceClick to the
    // webkit engine ONLY and use the original plain click() everywhere else.
    // Click semantics are unchanged on every engine.
    const isWebkit = (page.context().browser()?.browserType().name() ?? '') === 'webkit'

    // Pulse to add a security anomaly event to the feed.
    const pulseBtn = page.locator('[data-test="ops-pulse-button"]')
    await expect(pulseBtn).toBeVisible()
    if (isWebkit) {
      await forceClick(pulseBtn, async () =>
        (await page.locator('[data-test="ops-anomaly-toast"]').count()) === 1,
      )
    } else {
      await pulseBtn.click()
    }
    await expect(page.locator('[data-test="ops-anomaly-toast"]')).toBeVisible({ timeout: 5000 })
    // Dismiss the toast so it doesn't hold focus.
    const dismiss = page.locator('[data-test="ops-dismiss"]')
    await expect(dismiss).toBeVisible()
    if (isWebkit) {
      await forceClick(dismiss, async () =>
        (await page.locator('[data-test="ops-anomaly-toast"]').count()) === 0,
      )
    } else {
      await dismiss.click()
    }

    // Click the Security tab.
    const tabSecurity = page.locator('[data-test="ops-tab-security"]')
    await expect(tabSecurity).toBeVisible()
    if (isWebkit) {
      // nativeFallback:true because Mobile Safari does not deliver Playwright's
      // synthetic force-click to the tab's `@click.stop` Vue handler — a native
      // el.click() does (verified). The tab is a cheap emit→prop update, so the
      // native re-click is safe here.
      await forceClick(
        tabSecurity,
        async () =>
          (await tabSecurity.getAttribute('aria-selected')) === 'true' ||
          (await tabSecurity.evaluate((el) => el.classList.contains('active'))),
        4,
        700,
        true,
      )
    } else {
      await tabSecurity.click()
    }
    // Every visible event item is now category security (or the list is empty).
    const items = page.locator('[data-test="ops-event-list"] .ops-event-item')
    const count = await items.count()
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toHaveClass(/ops-cat-security/)
    }

    // Switching back to All restores a fuller list.
    const tabAll = page.locator('[data-test="ops-tab-all"]')
    await expect(tabAll).toBeVisible()
    if (isWebkit) {
      await forceClick(
        tabAll,
        async () =>
          (await tabAll.getAttribute('aria-selected')) === 'true' ||
          (await tabAll.evaluate((el) => el.classList.contains('active'))),
        4,
        700,
        true,
      )
    } else {
      await tabAll.click()
    }
    const allCount = await page.locator('[data-test="ops-event-list"] .ops-event-item').count()
    expect(allCount).toBeGreaterThanOrEqual(count)
  })

  test('Investigate opens the drill-down; Dismiss closes the toast', async ({ page }) => {
    await page.locator('[data-test="ops-pulse-button"]').click()
    await expect(page.locator('[data-test="ops-anomaly-toast"]')).toBeVisible({ timeout: 5000 })

    // Investigate -> drill-down state.
    await page.locator('[data-test="ops-investigate"]').click()
    await expect(page.locator('[data-test="ops-anomaly-toast"]')).toHaveClass(/ops-investigating/)

    // Dismiss -> toast gone.
    await page.locator('[data-test="ops-dismiss"]').click()
    await expect(page.locator('[data-test="ops-anomaly-toast"]')).toHaveCount(0)
  })

  test('clicking a metric card expands the detail panel; closing returns', async ({ page }) => {
    await expect(page.locator('[data-test="ops-detail-panel"]')).toHaveCount(0)
    await page.locator('[data-test="ops-widget"][data-key="gauge"]').click()
    await expect(page.locator('[data-test="ops-detail-panel"]')).toBeVisible()
    await page.locator('[data-test="ops-detail-close"]').click()
    await expect(page.locator('[data-test="ops-detail-panel"]')).toHaveCount(0)
  })

  test('reduced-motion mode is safe (request-flow hidden, root has the class, no strobe)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    // #224: re-navigation after beforeEach resets the page; re-trigger mount.
    await mountLazySection(page, 'lazy-cyber-ops-hud', 'cyber-ops-hud')
    const hud = page.locator('[data-test="cyber-ops-hud"]')
    await expect(hud).toBeVisible()
    await expect(hud).toHaveClass(/reduced-motion/)
    // The request-flow widget is hidden under reduced motion.
    await expect(page.locator('[data-test="ops-widget"][data-key="requestflow"]')).toHaveCount(0)
    // The scanline strip animation is disabled (animationName === 'none').
    const scanlines = page.locator('.ops-scanlines').first()
    const animationName = await scanlines.evaluate((el) => window.getComputedStyle(el).animationName)
    expect(animationName === 'none' || animationName === '').toBe(true)
  })

  test('mobile viewport renders without throwing', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'mobile viewport tested on chromium/webkit')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    // #224: re-navigation after beforeEach resets the page; re-trigger mount.
    await mountLazySection(page, 'lazy-cyber-ops-hud', 'cyber-ops-hud')
    const hud = page.locator('[data-test="cyber-ops-hud"]')
    await expect(hud).toBeVisible()
    // Pulse works on mobile.
    await page.locator('[data-test="ops-pulse-button"]').click()
    await expect(page.locator('[data-test="ops-anomaly-toast"]')).toBeVisible({ timeout: 5000 })
  })
})
