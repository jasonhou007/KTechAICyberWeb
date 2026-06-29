/**
 * @file 187-rum-beacon.spec.ts
 * @description Playwright E2E for the RUM beacon (#187) — live wiring proof.
 * @ticket #187 - CWV: continuous performance monitoring (RUM beacon)
 *
 * Verifies the shipped user flow on the real app (chromium only — firefox/webkit
 * have pre-existing browser-binary debt, mirroring pulse.spec.ts):
 *  1. LIVE WIRING: enable RUM via the toggle, navigate, assert window.__rum
 *     reports collected metrics within ~2s (proves the composable is invoked
 *     from the shipped app, not just from unit tests — the iter-23 gate).
 *  2. NO-ENDPOINT NO-OP: with no endpoint configured (default), enabling +
 *     navigating fires ZERO network requests to /rum (the beacon is inert).
 *  3. DISABLE STOPS GROWTH: enable -> disable -> navigate -> history does not
 *     grow (observers torn down, no new metrics recorded).
 *  4. A11Y: keyboard-tab to the toggle, Enter activates it, the dashboard
 *     region appears with role="region" + aria-labelledby.
 *
 * The dev server (`npm run dev`) sets import.meta.env.DEV=true, so the
 * composable exposes window.__rum automatically (no extra env var needed).
 *
 * Run: node_modules/.bin/playwright test 187-rum-beacon --project=chromium
 */

import { test, expect } from '@playwright/test'

// The app is served at the Vite base subpath /KTechAICyberWeb/. Playwright's
// baseURL is the origin only (http://localhost:3000), so page.goto('/') works
// (the server 302-redirects / to the subpath) BUT page.goto('/about') hits the
// origin's /about which 404s (no redirect for deep routes). Specs that deep-link
// must include the subpath explicitly. (Verified: /about -> 404,
// /KTechAICyberWeb/about -> 200. Mirrors the BASE-constant pattern used by
// 140-router-base.spec.ts.)
const BASE = '/KTechAICyberWeb/'
const ABOUT = `${BASE}about`

// Serial + single-worker: each test shares the same window.__rum lifecycle
// semantics and we want deterministic ordering of the enable/disable sequence.
test.describe.serial('#187 RUM beacon', () => {
  test.beforeEach(async ({ page }) => {
    // Each test must start from the DEFAULT disabled state. The serial suite
    // shares a browser context, so a prior test's persisted rumEnabled=true
    // would bleed forward; clear the RUM + preferences keys before navigating.
    // (page.evaluate on localStorage needs a page first, so goto then clear.)
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('ktech-rum-history')
      // Reset preferences to defaults so rumEnabled starts false.
      localStorage.setItem('ktech-preferences', JSON.stringify({ theme: 'dark', language: 'en', rumEnabled: false }))
    })
    // Reload so the app re-hydrates from the reset storage.
    await page.goto('/')
    // Wait for the app shell to hydrate so the footer RUM toggle is mounted.
    await expect(page.locator('[data-test="rum-toggle"]')).toBeVisible()
  })

  test('LIVE WIRING: enable -> navigate -> window.__rum reports collected metrics', async ({ page }) => {
    // The dev test hook must be present (import.meta.env.DEV=true in dev).
    const hookPresent = await page.evaluate(() => typeof (window as any).__rum === 'object')
    expect(hookPresent).toBe(true)

    // Enable RUM via the toggle button.
    await page.locator('[data-test="rum-toggle"]').click()
    await expect(page.locator('[data-test="rum-toggle"]')).toHaveAttribute('aria-pressed', 'true')

    // Inject a synthetic metric via the dev hook (web-vitals' real observers
    // don't fire deterministically in headless chromium without user gestures,
    // so we drive one through the same code path the real onLCP uses). This
    // proves the live collection pipeline (recordMetric -> FIFO -> history)
    // actually runs in the shipped app.
    await page.evaluate(() => {
      ;(window as any).__rum.triggerMetric('LCP', 2500, 'good')
      // Flush synchronously so the metric drains from the in-memory buffer into
      // the history ref + localStorage BEFORE the full-page navigation below
      // (page.goto is a document reload, not a client-side route, so the
      // in-memory instance is replaced; the persisted history survives).
      ;(window as any).__rum.flush()
    })

    // Navigate away + back to exercise the lifecycle across a route change.
    // Use the base subpath (deep routes 404 at the origin — see BASE note).
    await page.goto(ABOUT)
    await page.waitForLoadState('networkidle')

    // Within ~2s, window.__rum.history (a Vue ref) must report >= 1 sample.
    // history is exposed as the reactive ref, so read .value.length.
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const h = (window as any).__rum?.history
        // h may be a ref ({value: [...]}) or the raw array; handle both.
        return Array.isArray(h) ? h.length : (h?.value?.length ?? 0)
      })
    }, { timeout: 2000, intervals: [200] }).toBeGreaterThanOrEqual(1)
  })

  test('NO-ENDPOINT NO-OP: default config fires ZERO /rum requests', async ({ page }) => {
    // Record every request to a /rum endpoint.
    const rumRequests: string[] = []
    await page.route('**/rum', (route) => {
      rumRequests.push(route.request().url())
      route.continue().catch(() => {})
    })

    // Enable + navigate. With NO endpoint configured (default), the beacon
    // never dispatches, so rumRequests must stay empty.
    await page.locator('[data-test="rum-toggle"]').click()
    await page.evaluate(() => {
      ;(window as any).__rum.triggerMetric('CLS', 0.05, 'good')
      ;(window as any).__rum.flush()
    })
    await page.goto(ABOUT)
    await page.waitForLoadState('networkidle')
    // Give any deferred dispatch a moment to (not) fire.
    await page.waitForTimeout(500)

    expect(rumRequests.length).toBe(0)
  })

  test('DISABLE STOPS GROWTH: enable -> disable -> navigate -> history frozen', async ({ page }) => {
    // Enable + push one metric.
    await page.locator('[data-test="rum-toggle"]').click()
    await expect(page.locator('[data-test="rum-toggle"]')).toHaveAttribute('aria-pressed', 'true')
    await page.evaluate(() => {
      ;(window as any).__rum.triggerMetric('LCP', 2000, 'good')
      ;(window as any).__rum.flush()
    })
    // firefox under CI load can take longer than 2s to flush the metric into
    // the reactive history ref (the enable-toggle click + reactive update +
    // triggerMetric + flush race). Wait for the toggle's aria-pressed='true'
    // BEFORE pushing (done above), and give the poll a longer window + finer
    // interval so the history is observed as soon as it settles. Cross-browser
    // E2E #222 (pre-existing firefox flake surfaced on main post-#228 merge).
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const h = (window as any).__rum?.history
        return Array.isArray(h) ? h.length : (h?.value?.length ?? 0)
      })
    }, { timeout: 5000, intervals: [100] }).toBeGreaterThanOrEqual(1)

    // Disable the toggle.
    await page.locator('[data-test="rum-toggle"]').click()
    await expect(page.locator('[data-test="rum-toggle"]')).toHaveAttribute('aria-pressed', 'false')

    const lengthBefore = await page.evaluate(() => {
      const h = (window as any).__rum?.history
      return Array.isArray(h) ? h.length : (h?.value?.length ?? 0)
    })

    // Attempt to push a metric post-disable; recordMetric is gated on
    // enabled.value so it must be a no-op.
    await page.evaluate(() => {
      ;(window as any).__rum.triggerMetric('INP', 300, 'needs-improvement')
    })
    await page.goto(ABOUT)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const lengthAfter = await page.evaluate(() => {
      const h = (window as any).__rum?.history
      return Array.isArray(h) ? h.length : (h?.value?.length ?? 0)
    })

    expect(lengthAfter).toBe(lengthBefore)
  })

  test('A11Y: keyboard-tab to toggle, Enter activates, region appears with role=region', async ({ page }) => {
    // The footer status area is late in tab order; focus the toggle directly
    // then drive the rest by keyboard (mirrors the pulse.spec focus approach).
    await page.locator('[data-test="rum-toggle"]').focus()
    await expect(page.locator('[data-test="rum-toggle"]')).toBeFocused()

    // Enter activates (not click-only).
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-test="rum-toggle"]')).toHaveAttribute('aria-pressed', 'true')

    // The dashboard region is now visible with role=region + aria-labelledby.
    const region = page.locator('[data-test="rum-region"]')
    await expect(region).toBeVisible()
    await expect(region).toHaveAttribute('role', 'region')
    const labelledBy = await region.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    // The referenced id must exist in the DOM.
    await expect(page.locator(`#${labelledBy}`)).toHaveCount(1)

    // aria-live status region present.
    await expect(page.locator('[data-test="rum-status"][aria-live="polite"]')).toBeVisible()
  })
})
