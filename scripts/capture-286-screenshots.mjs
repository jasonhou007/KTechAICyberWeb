#!/usr/bin/env node
/**
 * capture-286-screenshots.mjs — Issue #286 before/after evidence screenshots.
 *
 * Captures full-page Playwright screenshots of ServiceBigData (exercises all 5
 * role tokens: hero-subtitle, overview-text, card-description, stat-label,
 * cta-description) and PositionList (the .empty-message caption delta) against
 * the worktree's own vite on port 3001 (avoids shared-repo port-3000
 * contention with concurrent processes).
 *
 * Run with the dev server ALREADY STARTED on 3001, OR this script starts it.
 *
 * Usage:
 *   node scripts/capture-286-screenshots.mjs <outDir> [baseSubpath]
 *
 * Outputs <outDir>/<page>-<state>.png for each (page, before/after) pair.
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.argv[2] || '/tmp/286-shots'
const BASE = process.argv[3] || '/KTechAICyberWeb/'
const PORT = 3001
const URL = `http://localhost:${PORT}`

mkdirSync(OUT, { recursive: true })

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status < 500) return true
    } catch {}
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error(`dev server at ${url} did not come up in ${timeoutMs}ms`)
}

async function shoot(page, route, name) {
  // domcontentloaded + a fixed settle wait is more robust than networkidle
  // (some pages keep a long-poll / animation loop that never goes idle, and
  // /careers has a pre-existing render bug that throws during mount).
  await page.goto(`${URL}${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  // let fonts/layout settle
  await page.waitForTimeout(2500)
  const path = `${OUT}/${name}.png`
  await page.screenshot({ path, fullPage: true })
  console.log('shot', path)
}

async function main() {
  let devServer
  // probe; start if not up
  let serverUp = false
  try { const r = await fetch(URL); serverUp = r.ok || r.status < 500 } catch {}
  if (!serverUp) {
    console.log(`starting vite on ${PORT}...`)
    devServer = spawn('node_modules/.bin/vite', ['--port', String(PORT), '--strictPort'], {
      cwd: process.cwd(),
      stdio: 'ignore',
      detached: false
    })
    await waitForServer(URL)
    console.log('vite up')
  }

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  try {
    await shoot(page, 'service-big-data', 'servicebigdata')
    await shoot(page, 'careers', 'positionlist')
  } finally {
    await browser.close()
    if (devServer) { try { devServer.kill('SIGTERM') } catch {} }
  }
  console.log('DONE')
}

main().catch(e => { console.error(e); process.exit(1) })
