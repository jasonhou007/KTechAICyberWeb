/**
 * @file 203-self-driving-demo.spec.ts
 * @description Playwright E2E for the Self-Driving ambient demo background (#203).
 *
 * Verifies the shipped user flow on the real app:
 *  - AUTO-PLAY with ZERO interaction: load the page, do not click/hover/scroll,
 *    and assert data-current-phase changes AND data-loop-iteration increments
 *    on its own (the core differentiator — the demo is "alive" without input).
 *  - REDUCED MOTION: under prefers-reduced-motion: reduce the demo renders the
 *    static key-frame summary (data-static="true") and the phase does NOT
 *    change over time.
 *  - GLOBAL (not dead code): the ambient layer is present on BOTH the home page
 *    and a deep route (/about), proving it is wired into App.vue (not a
 *    route-local widget).
 *
 * Run: node_modules/.bin/playwright test 203-self-driving-demo --project=chromium
 * (playwright.config.ts sets baseURL = http://localhost:3000; vite serves at the
 *  /KTechAICyberWeb/ base, so all gotos include the BASE prefix.)
 *
 * @ticket #203
 */

import { test, expect } from '@playwright/test'

// All paths are relative to Playwright's baseURL (http://localhost:3000).
// vite serves at base '/KTechAICyberWeb/', so the full URL becomes
// http://localhost:3000/KTechAICyberWeb/...
const BASE = '/KTechAICyberWeb/'

test.describe('#203 Self-Driving ambient demo background', () => {
  test('auto-plays with ZERO interaction: phase changes + loop iteration increments', async ({ page }) => {
    // Load and wait for network idle so the app shell + i18n are settled. We
    // intentionally do NOT click, hover, or scroll after this — the demo must
    // advance on its own.
    await page.goto(BASE, { waitUntil: 'networkidle' })

    const root = page.locator('[data-selfdriving-root]')
    await expect(root).toBeVisible()

    // Snapshot the initial phase + iteration with no interaction.
    const firstPhase = await root.getAttribute('data-current-phase')
    const firstIter = await root.getAttribute('data-loop-iteration')
    expect(firstPhase).toBeTruthy()

    // Poll for a phase change within ~8s (a full phase is ~1500ms, plus margin
    // for rAF scheduling + the network-idle settle). The demo must move on its
    // own — no click/hover/scroll anywhere in this test.
    await expect
      .poll(async () => await root.getAttribute('data-current-phase'), {
        timeout: 8000,
      })
      .not.toBe(firstPhase)

    // The loop iteration must also increment (proves the seamless wrap path is
    // reachable / the clock is advancing, not just a one-shot transition).
    await expect
      .poll(async () => Number(await root.getAttribute('data-loop-iteration')), {
        timeout: 30000,
      })
      .toBeGreaterThan(Number(firstIter))
  })

  test('reduced motion: renders the static key-frame and the phase does NOT change', async ({ browser }) => {
    // Spawn a context that advertises prefers-reduced-motion: reduce.
    const context = await browser.newContext({
      reducedMotion: 'reduce',
    } as any)
    const page = await context.newPage()
    await page.goto(BASE, { waitUntil: 'networkidle' })

    const root = page.locator('[data-selfdriving-root]')
    await expect(root).toBeVisible()

    // The static branch is active.
    await expect(root).toHaveAttribute('data-static', 'true')

    // Snapshot the phase; it must NOT change over the next few seconds because
    // the loop is static under reduced motion.
    const phase = await root.getAttribute('data-current-phase')
    expect(phase).toBeTruthy()
    await page.waitForTimeout(5000)
    const laterPhase = await root.getAttribute('data-current-phase')
    expect(laterPhase).toBe(phase)

    await context.close()
  })

  test('global: the ambient layer is present on BOTH / and /about (not dead code)', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await expect(page.locator('[data-selfdriving-root]')).toBeVisible()

    await page.goto(`${BASE}about`, { waitUntil: 'networkidle' })
    await expect(page.locator('[data-selfdriving-root]')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // VISIBILITY GATE (iter-13 occlusion regression test)
  // -------------------------------------------------------------------------
  // This is the test that SHOULD HAVE caught the iter-13 flagship defect: the
  // demo was mounted globally as a position:fixed; aria-hidden ambient
  // background painted BEHIND the routed page, so every route's opaque
  // foreground fully OCCLUDED it. elementFromPoint() at every pipeline card
  // center returned the hero <h1>, not the demo — the narrative was invisible.
  // No automated gate caught it; the coordinator found it manually.
  //
  // This test scrolls the demo into view, then for every pipeline card (and the
  // streaming feed + status readout) asserts that the TOPMOST element at that
  // point is INSIDE the demo — i.e. the demo's content is not occluded by the
  // hero/header/main. It FAILS on the pre-fix global-background mount (the
  // fixed demo painted behind the hero, so elementFromPoint returned the hero)
  // and PASSES on the in-flow section mount.
  // -------------------------------------------------------------------------
  test('visibility (AC1): the demo content is NOT occluded — elementFromPoint at every card/feed/readout center hits the demo', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await expect(page.locator('[data-selfdriving-root]')).toBeVisible()

    // Wait for the FSM to mount + the first phase to render the cards.
    await page.waitForTimeout(2000)

    // Scroll the demo into the viewport so elementFromPoint can hit it (the
    // demo is in-flow, so it may sit below the fold depending on the page's
    // header height; scrolling is part of the user flow, not occlusion).
    await page.locator('[data-selfdriving-root]').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    // For every pipeline card + the feed + readout, the topmost element at the
    // center must be INSIDE the demo region (not the hero/header/main).
    const occluded = await page.evaluate(() => {
      const root = document.querySelector('[data-selfdriving-root]')
      if (!root) return { error: 'no demo root' }
      const targets = Array.from(root.querySelectorAll('.pipeline-card'))
      const feed = root.querySelector('[class*=streaming]')
      const readout = root.querySelector('[class*=readout]')
      if (feed) targets.push(feed)
      if (readout) targets.push(readout)
      const offenders = []
      for (const el of targets) {
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const top = document.elementFromPoint(cx, cy)
        const inDemo = top ? root.contains(top) : false
        if (!inDemo) {
          offenders.push({
            label: (el.textContent || '').trim().slice(0, 16),
            center: [Math.round(cx), Math.round(cy)],
            topTag: top ? top.tagName : 'NULL',
            topClass: top && typeof top.className === 'string'
              ? top.className.split(' ')[0]
              : '',
          })
        }
      }
      return { checked: targets.length, offenders }
    })

    expect(occluded.error).toBeUndefined()
    expect(occluded.checked).toBeGreaterThan(0)
    // Every probed card/feed/readout center must hit an element INSIDE the demo.
    // A non-empty offenders list means the demo is occluded at that point.
    expect(occluded.offenders, JSON.stringify(occluded.offenders)).toEqual([])
  })
})
