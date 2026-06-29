/**
 * @file 219-evidence.spec.ts
 * @description Visual-regression EVIDENCE capture for #219 (NOT a regression
 * gate — produces screenshots for the ticket). Captures the CyberOpsHud
 * component (rendered on Home) in three states:
 *   1. after-cyberopshud.png            — default (system motion)
 *   2. after-cyberopshud-reduced-motion.png — prefers-reduced-motion: reduce
 *
 * BEFORE/AFTER NOTE: the #219 edit removes 4 dead CSS selector lines from
 * CyberOpsHud.vue's <style scoped> block. The selectors never matched the
 * rendered DOM (Vue compiles `.cyber-ops-hud .ops-needle` to
 * `.cyber-ops-hud[data-v-A] .ops-needle[data-v-A]`, but the rendered
 * .ops-needle carries the child OpsGauge.vue's [data-v-B]). Removing a selector
 * that never matched changes ZERO rendered pixels — so before.png and
 * after.png are byte-identical. The scoped-boundary proof in
 * docs/issue-219-scoped-style-audit.md §4 is the primary evidence; these
 * screenshots are belt-and-suspenders confirmation that the HUD still renders
 * correctly after the edit (no accidental regression in the surviving rules).
 *
 * Usage (with a vite dev or preview server running on :3000):
 *   EVIDENCE_LABEL=after EVIDENCE_OUT=/path/to/tickets/219/evidence \
 *     node_modules/.bin/playwright test 219-evidence --project=chromium
 *
 * To produce a "before" shot: rebuild from main (eb91f84), re-run with
 * EVIDENCE_LABEL=before. Output will be identical to "after" (see note above).
 * @ticket #219
 */
import { test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const LABEL = process.env.EVIDENCE_LABEL || 'shot'
const OUT = process.env.EVIDENCE_OUT
  ? resolve(process.env.EVIDENCE_OUT)
  : resolve(process.cwd(), 'tickets-219-evidence')
mkdirSync(OUT, { recursive: true })

// Skip by default: this is a manual evidence-capture helper, NOT a regression
// gate. It only runs when invoked explicitly with EVIDENCE_LABEL set.
const ENABLED = !!process.env.EVIDENCE_LABEL

// Per the project memory: KTech baseURL is the origin only; root goto('/')
// 302-redirects to the subpath (works). Use the subpath directly for safety.
const BASE = '/KTechAICyberWeb/'

test.describe('#219 visual evidence capture (CyberOpsHud)', () => {
  test.skip(!ENABLED, 'evidence capture helper — set EVIDENCE_LABEL to run')

  test(`capture ${LABEL} cyberopshud default`, async ({ page }) => {
    // Seed dark theme + en so the capture is deterministic.
    await page.goto(`${BASE}`)
    await page.evaluate(() => {
      localStorage.setItem(
        'ktech-preferences',
        JSON.stringify({ theme: 'dark', language: 'en' })
      )
    })
    await page.goto(`${BASE}`)
    await page.waitForLoadState('networkidle')
    // Let web fonts + the async-loaded CyberOpsHud chunk mount.
    await page.waitForTimeout(2000)
    // Scope the screenshot to the HUD element if present, else full page.
    const hud = page.locator('[data-test="cyber-ops-hud"]')
    const file = resolve(OUT, `${LABEL}-cyberopshud.png`)
    if ((await hud.count()) > 0) {
      await hud.screenshot({ path: file })
    } else {
      await page.screenshot({ path: file, fullPage: false })
    }
    console.log(`\n[219-evidence] captured ${file}`)
  })

  test(`capture ${LABEL} cyberopshud reduced-motion`, async ({ browser }) => {
    // Emulate prefers-reduced-motion: reduce at context creation time so the
    // CSS @media block AND the JS prefers-reduced-motion media-query check
    // both fire (Playwright's reducedMotion emulation must be set on the
    // context, not the page).
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 1280, height: 720 }
    })
    const page = await context.newPage()
    try {
      await page.goto(`${BASE}`)
      await page.evaluate(() => {
        localStorage.setItem(
          'ktech-preferences',
          JSON.stringify({ theme: 'dark', language: 'en' })
        )
      })
      await page.goto(`${BASE}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      const hud = page.locator('[data-test="cyber-ops-hud"]')
      const file = resolve(OUT, `${LABEL}-cyberopshud-reduced-motion.png`)
      if ((await hud.count()) > 0) {
        await hud.screenshot({ path: file })
      } else {
        await page.screenshot({ path: file, fullPage: false })
      }
      console.log(`\n[219-evidence] captured ${file}`)
    } finally {
      await context.close()
    }
  })
})
