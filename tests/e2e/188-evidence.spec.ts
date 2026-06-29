/**
 * @file 188-evidence.spec.ts
 * @description Visual-regression EVIDENCE capture for #188 (NOT a regression
 * gate — produces screenshots for the ticket). Run twice: once against the
 * pre-purge build (EVIDENCE_LABEL=before) and once against the post-purge
 * build (EVIDENCE_LABEL=after), then compare.
 * @ticket #188
 *
 * Usage (with a vite preview server running on :3000):
 *   EVIDENCE_LABEL=after EVIDENCE_OUT=/path/to/tickets/188/evidence \
 *     node_modules/.bin/playwright test 188-evidence --project=chromium
 *
 * Then rebuild from main, re-run with EVIDENCE_LABEL=before.
 */
import { test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const LABEL = process.env.EVIDENCE_LABEL || 'shot'
const OUT = process.env.EVIDENCE_OUT
  ? resolve(process.env.EVIDENCE_OUT)
  : resolve(process.cwd(), 'tickets-188-evidence')
mkdirSync(OUT, { recursive: true })

// Skip by default: this is a manual evidence-capture helper, NOT a regression
// gate. It only runs when invoked explicitly with EVIDENCE_LABEL set (so a
// normal `playwright test` CI run does not capture stray screenshots).
const ENABLED = !!process.env.EVIDENCE_LABEL

const BASE = '/KTechAICyberWeb/'

test.describe('#188 visual evidence capture', () => {
  test.skip(!ENABLED, 'evidence capture helper — set EVIDENCE_LABEL to run')
  // Desktop dark, 1280x720 — the canonical hero shot.
  for (const target of [
    { name: 'home', path: `${BASE}` },
    { name: 'about', path: `${BASE}about` }
  ]) {
    test(`capture ${LABEL} ${target.name} desktop-dark`, async ({ page }) => {
      // Seed dark theme so the capture is deterministic (not system-dependent).
      await page.goto(`${BASE}`)
      await page.evaluate(() => {
        localStorage.setItem(
          'ktech-preferences',
          JSON.stringify({ theme: 'dark', language: 'en' })
        )
      })
      await page.goto(target.path)
      await page.waitForLoadState('networkidle')
      // Let web fonts load so the screenshot reflects Orbitron, not fallback.
      await page.waitForTimeout(1500)
      const file = resolve(OUT, `${LABEL}-${target.name}-desktop-dark.png`)
      await page.screenshot({ path: file, fullPage: false })
      console.log(`\n[188-evidence] captured ${file}`)
    })
  }
})
