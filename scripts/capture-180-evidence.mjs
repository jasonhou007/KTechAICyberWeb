/**
 * Throwaway evidence-capture script for Issue #180 (AI Solution Forge
 * configurator). NOT committed as a tracked test — run manually once against
 * `vite preview` to produce the before/after/mid-decode screenshots that land
 * in tickets/180/evidence/.
 *
 * Method (mirrors scripts/capture-179-evidence.mjs): a single preview server
 * runs the current branch (Home WITH #180). The three captures are:
 *   - before-forge.png : the configurator in its IDLE state (config UI visible,
 *                       no result yet, Forge button present).
 *   - mid-decode.png   : mid-assembly, if capturable (the stage with neon arcs
 *                       + module fly-in + scramble text). Captured immediately
 *                       after clicking Forge, before the result lands.
 *   - after-forge.png  : after the assembly completes, the blueprint result
 *                       (services + metrics + verdict + CTA).
 *
 * Run:
 *   node_modules/.bin/vite build && node_modules/.bin/vite preview --port 4173
 *   node scripts/capture-180-evidence.mjs
 */
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EVIDENCE_DIR = path.resolve(__dirname, '../../tickets/180/evidence')

// vite preview default base is /KTechAICyberWeb/ (the app's Vite `base`).
// Allow override via env so a dev server on :3000 works too.
const BASE = process.env.FORGE_BASE || 'http://127.0.0.1:4173/KTechAICyberWeb/'
const VIEWPORT = { width: 1280, height: 900 }

async function run() {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  // ---- before: idle configurator (config UI, no result) ----------------
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-test="solution-forge"]', { timeout: 10000 })
  // Scroll the forge into view so the screenshot frames it.
  await page.locator('[data-test="solution-forge"]').scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  const beforePath = path.join(EVIDENCE_DIR, 'before-forge.png')
  await page.screenshot({ path: beforePath, fullPage: false })
  console.log('wrote', beforePath)

  // ---- mid-decode: click Forge, capture the assembly stage mid-flight -----
  await page.locator('[data-test="forge-button"]').click()
  // The assembly stage is rendered synchronously on click; grab it before the
  // rAF loop drives it to 'done'. A short settle lets the arcs/modules paint.
  await page.waitForSelector('[data-test="forge-stage"]', { timeout: 5000 })
  await page.waitForTimeout(250)
  const midPath = path.join(EVIDENCE_DIR, 'mid-decode.png')
  await page.screenshot({ path: midPath, fullPage: false })
  console.log('wrote', midPath)

  // ---- after: the blueprint result (services + metrics + verdict + CTA) ---
  await page.waitForSelector('[data-test="forge-result"]', { timeout: 8000 })
  await page.locator('[data-test="forge-result"]').scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  const afterPath = path.join(EVIDENCE_DIR, 'after-forge.png')
  await page.screenshot({ path: afterPath, fullPage: false })
  console.log('wrote', afterPath)

  await browser.close()
  console.log('done')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
