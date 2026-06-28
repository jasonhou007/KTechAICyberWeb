// One-off screenshot harvester for AC #165 before/after evidence.
// Usage: node scripts/165-screenshot.mjs <outDir>
// Requires a vite dev server already running at http://localhost:3000.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const outDir = process.argv[2] || '/tmp/165-shots'
mkdirSync(outDir, { recursive: true })

const BASE = 'http://localhost:3000/KTechAICyberWeb/'

const browser = await chromium.launch()
const desktop = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await desktop.newPage()

// About — full page
await page.goto(`${BASE}about`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: resolve(outDir, 'after-about.png'), fullPage: true })

// News list
await page.goto(`${BASE}news`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.screenshot({ path: resolve(outDir, 'after-news.png'), fullPage: true })

await browser.close()
console.log(`Screenshots written to ${outDir}`)
