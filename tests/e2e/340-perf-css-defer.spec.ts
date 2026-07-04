/**
 * @file tests/e2e/340-perf-css-defer.spec.ts
 * @description Visual no-FOUC E2E for Issue #340 Steps 1-3 (defer the entry
 * CSS bundle + expand the critical-CSS seed + preload the /news first-card
 * LCP image — follow-up to #334).
 *
 * WHY getComputedStyle at first paint (not DOM text): the DOM cannot SEE CSS.
 * The #340 AC is VISUAL — the page must NOT flash unstyled content between
 * first paint and the deferred entry sheet applying. The strongest
 * programmatic signal the browser exposes is the RESOLVED computed
 * background-color on <body> the moment the page becomes paintable. The
 * critical-CSS seed in index.html paints `background:var(--bg)` (#0a0a0a)
 * inline, so the body MUST resolve to rgb(10, 10, 10) BEFORE the deferred
 * sheet applies — if the seed were missing or broken, body would resolve to
 * the user-agent default (rgb(255,255,255) or transparent) at first paint
 * and flash white. This mirrors the iter-13/15/42/43 visual-AC gate pattern.
 *
 * Routes covered (the 3 #340 target routes): /about, /contact, /news at the
 * mobile LCP viewport 375x667 (matches the Lighthouse mobile formFactor).
 * A screenshot is captured per route as evidence for the PR.
 *
 * Run: node_modules/.bin/playwright test 340-perf-css-defer --project=chromium
 *   (the dev server must be running on :3000 — see playwright.config.ts
 *   webServer config; reuseExistingServer:true is the local default.)
 *
 * @ticket #340
 */
import { test, expect } from '@playwright/test'

// The app is served at the Vite base subpath /KTechAICyberWeb/. Playwright's
// baseURL is origin-only (http://localhost:3000), so page.goto('/') works
// (the server 302-redirects / to the subpath) BUT page.goto('/about') hits
// the origin's /about which 404s (no redirect for deep routes). Specs that
// deep-link must include the subpath explicitly. Mirrors the BASE-constant
// pattern used by 140-router-base.spec.ts and 188-css-purge.spec.ts.
const BASE = '/KTechAICyberWeb/'
const ABOUT = `${BASE}about`
const CONTACT = `${BASE}contact`
const NEWS = `${BASE}news`

// The critical-CSS seed declares `--bg:#0a0a0a` and `body{background:var(--bg)}`.
// At first paint (before the deferred entry sheet applies), the resolved
// body background-color MUST be rgb(10, 10, 10). A white/transparent flash
// means the seed is broken and the user sees FOUC.
const EXPECTED_BG = 'rgb(10, 10, 10)'

// Mobile LCP viewport (matches the Lighthouse mobile formFactor Moto G Power
// CSS viewport 375x667 — the #340 metric target).
const MOBILE_VIEWPORT = { width: 375, height: 667 }

test.describe('#340 CSS defer — no-FOUC at first paint on target routes', () => {
  // Force the mobile viewport for the whole describe block — the #340 AC is
  // specifically the MOBILE LCP residual, and the visual-AC gate must assert
  // at the same viewport Lighthouse measures.
  test.use({ viewport: MOBILE_VIEWPORT })

  for (const route of [
    { name: 'about', url: ABOUT },
    { name: 'contact', url: CONTACT },
    { name: 'news', url: NEWS },
  ]) {
    test(`/${route.name} body background is ${EXPECTED_BG} at first paint (no FOUC)`, async ({ page }) => {
      // Navigate and wait only for the DOM to be ready (domcontentloaded) —
      // NOT networkidle — so we capture the computed style as early as the
      // page is paintable, before the deferred entry sheet's onload handler
      // flips the preload into an active stylesheet. The seed in index.html
      // is what paints --bg at this moment.
      await page.goto(route.url, { waitUntil: 'domcontentloaded' })

      // Read the RESOLVED computed background-color on <body>. This is the
      // CSS-source + live-DOM check: the seed's `body{background:var(--bg)}`
      // must resolve to the --bg literal (#0a0a0a → rgb(10,10,10)). A missing
      // or broken seed would leave body at the user-agent default.
      const bg = await page.evaluate(() => {
        return getComputedStyle(document.body).backgroundColor
      })

      // eslint-disable-next-line no-console
      console.log(`\n[340] /${route.name} body computed background-color at first paint: ${bg}`)
      expect(bg.toLowerCase().replace(/\s+/g, ' ')).toBe(EXPECTED_BG)

      // Capture a screenshot per route as evidence for the PR. Stored under
      // the Playwright output path. The screenshot is the human-readable
      // proof the no-FOUC AC holds at first paint on mobile.
      await page.screenshot({
        path: `test-results/340-no-fouc-${route.name}.png`,
        fullPage: false,
      })
    })
  }
})
