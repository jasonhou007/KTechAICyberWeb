#!/usr/bin/env node
/**
 * @file scripts/302-lighthouse-capture.mjs
 * @description Runtime Lighthouse verification harness for Issue #302
 * (deferred from #253). Builds the audit variant, serves it on an isolated
 * preview port, runs Lighthouse per route × device preset, extracts the
 * Core-Web-Vitals + TTI + Performance score, and saves the raw JSON +
 * metrics-summary.json to the ticket's evidence dir.
 *
 * Why a script wraps Lighthouse (mirrors scripts/253-perf-evidence.mjs): the
 * perf-honesty gate (iter-16) requires every cited perf number to trace to a
 * saved JSON whose configSettings.formFactor matches the device claim. The
 * script guarantees (a) the server is the BUILT audit variant (base=/, not a
 * stale dev server a concurrent lane left on :3000), (b) each preset's
 * formFactor is asserted against the produced JSON before extraction, and (c)
 * the evidence lands in the DevAgent repo so it survives worktree cleanup.
 *
 * Routes (the 5 key routes from AC #10): /, /about, /services, /contact, /news.
 * Presets: desktop (--preset=desktop) and mobile (--preset=perf). 1 run each
 * for EVIDENCE CAPTURE — LHCI CI does the 3-run median for the regression
 * gate; here we capture representative numbers per route, not a median.
 *
 * Usage:
 *   node scripts/302-lighthouse-capture.mjs
 *
 * @ticket #302
 */
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { mkdtempSync } from 'node:fs'
import { extractMetrics } from './302-extract-metrics.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PORT = '4173'

// Evidence lives in the DevAgent repo (not the worktree) so it persists after
// the worktree is cleaned up. This is the same parent-repo convention as the
// other KTech evidence dirs.
const EVIDENCE_DIR =
  '/Users/jinbo/Documents/AIProject/AutoDevAgent/DevAgent/projects/kttech-cyber/tickets/302/evidence'

const ROUTES = [
  { url: '/', tag: 'home' },
  { url: '/about', tag: 'about' },
  { url: '/services', tag: 'services' },
  { url: '/contact', tag: 'contact' },
  { url: '/news', tag: 'news' },
]
// Lighthouse presets -> the configSettings.formFactor each produces. perf is
// the mobile preset (throttled CPU + 4G); desktop is the desktop preset.
const PRESETS = [
  { preset: 'desktop', device: 'desktop', expectedFormFactor: 'desktop' },
  { preset: 'perf', device: 'mobile', expectedFormFactor: 'mobile' },
]

// Perf-regression thresholds (AC #1-#4). verdict per metric = pass | fail | n/a.
const THRESHOLDS = { lcp: 2500, inp: 200, cls: 0.1, tti: 3800, score: 90 }

function log(msg) {
  console.log(`[302-capture] ${msg}`)
}

function verdict(metric, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a'
  if (metric === 'score') return value >= THRESHOLDS.score ? 'pass' : 'fail'
  // numericValue-style: lower is better
  const max = THRESHOLDS[metric]
  return value <= max ? 'pass' : 'fail'
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404 || res.status === 200) return true
    } catch {
      // not ready
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`server at ${url} did not become ready in ${timeoutMs}ms`)
}

/**
 * Run a single Lighthouse capture. Returns { lh, formFactorMatched }.
 * Falls back from --headless=new to --headless if the new flag is rejected.
 * Never throws — captures the error in a { error } shape so the harness can
 * continue to the next route.
 */
function runLighthouse(routeUrl, preset) {
  const tmpDir = mkdtempSync(resolve(tmpdir(), 'lh302-'))
  const outPath = resolve(tmpDir, 'lh.json')
  const chromeFlags = '--headless=new --no-sandbox --disable-gpu'

  function tryRun(headlessFlag) {
    const args = [
      routeUrl,
      '--output=json',
      `--output-path=${outPath}`,
      `--preset=${preset}`,
      '--quiet',
      `--chrome-flags=${headlessFlag} --no-sandbox --disable-gpu`,
      '--max-wait-for-load=45000',
    ]
    // spawnSync so a single bad run does not kill the harness; capture stderr.
    return spawnSync(
      resolve(ROOT, 'node_modules/.bin/lighthouse'),
      args,
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
  }

  let res = tryRun(chromeFlags)
  if (res.status !== 0 && /headless=new/i.test(res.stderr || '')) {
    log(`  --headless=new rejected; retrying with --headless`)
    res = tryRun('--headless')
  }
  if (res.status !== 0) {
    return {
      error: `lighthouse exited ${res.status}: ${(res.stderr || '').slice(0, 400)}`,
    }
  }
  if (!existsSync(outPath)) {
    return { error: `lighthouse produced no JSON at ${outPath}` }
  }
  let lh
  try {
    lh = JSON.parse(readFileSync(outPath, 'utf8'))
  } catch (e) {
    return { error: `failed to parse JSON: ${e.message}` }
  }
  return { lh }
}

async function main() {
  mkdirSync(EVIDENCE_DIR, { recursive: true })
  const summary = {
    generatedAt: new Date().toISOString(),
    thresholds: THRESHOLDS,
    routes: [],
    formFactorAssertions: { allMatched: true, mismatches: [] },
  }

  // 1. Build the audit variant. base=/ so root-relative routes resolve when
  //    served at the web root (the production /KTechAICyberWeb/ base breaks
  //    local asset loading -> NO_FCP; same rationale as lighthouse-ci.yml).
  log('Building audit variant (base=/, outDir dist-audit)...')
  const buildRes = spawnSync(
    resolve(ROOT, 'node_modules/.bin/vite'),
    ['build', '--base=/', '--outDir', 'dist-audit'],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  if (buildRes.status !== 0) {
    console.error('[302-capture] vite build failed:\n' + (buildRes.stderr || '').slice(-800))
    process.exit(1)
  }

  // 2. Spawn the static server on the isolated port.
  log(`Spawning serve -s dist-audit -l ${PORT}...`)
  const server = spawn(
    resolve(ROOT, 'node_modules/.bin/serve'),
    ['-s', 'dist-audit', '-l', PORT],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  server.stdout?.on('data', (d) => process.stderr.write(d))
  server.stderr?.on('data', (d) => process.stderr.write(d))

  try {
    await waitForServer(`http://localhost:${PORT}/`)
    log('Server is up.')

    // 3. For each route × preset: run, assert formFactor, extract, save raw.
    for (const { preset, device, expectedFormFactor } of PRESETS) {
      for (const { url: route, tag } of ROUTES) {
        const routeUrl = `http://localhost:${PORT}${route}`
        log(`Lighthouse ${routeUrl} [${preset}] (device=${device})...`)
        const run = runLighthouse(routeUrl, preset)

        if (run.error) {
          log(`  ERROR — capturing in summary: ${run.error}`)
          summary.routes.push({
            route,
            device,
            formFactor: null,
            lcp: null, inp: null, cls: null, tti: null, tbt: null,
            performanceScore: null,
            error: run.error,
            verdict: { lcp: 'error', inp: 'error', cls: 'error', tti: 'error', score: 'error' },
          })
          continue
        }

        const lh = run.lh
        // iter-16 perf-honesty: assert the preset produced the expected
        // formFactor BEFORE trusting any number it emitted.
        const actualFF = lh.configSettings?.formFactor ?? 'unknown'
        const formFactorMatched = actualFF === expectedFormFactor
        if (!formFactorMatched) {
          log(`  FORMFACTOR MISMATCH: expected ${expectedFormFactor}, got ${actualFF}`)
          summary.formFactorAssertions.allMatched = false
          summary.formFactorAssertions.mismatches.push({
            route, device, preset, expected: expectedFormFactor, actual: actualFF,
          })
        } else {
          log(`  formFactor PASS (${actualFF})`)
        }

        const m = extractMetrics(lh)
        // Save the RAW lighthouse JSON (the evidence-of-record).
        const rawPath = resolve(EVIDENCE_DIR, `lighthouse-${tag}-${device}.json`)
        writeFileSync(rawPath, JSON.stringify(lh, null, 2))

        const v = {
          lcp: verdict('lcp', m.lcp),
          inp: verdict('inp', m.inp),
          cls: verdict('cls', m.cls),
          tti: verdict('tti', m.tti),
          score: verdict('score', m.performanceScore),
        }
        log(`  LCP=${m.lcp} INP=${m.inp} CLS=${m.cls} TTI=${m.tti} TBT=${m.tbt} score=${m.performanceScore}`)
        log(`  verdict: ${JSON.stringify(v)}`)

        summary.routes.push({
          route,
          device,
          formFactor: actualFF,
          formFactorMatched,
          lcp: m.lcp,
          inp: m.inp,
          cls: m.cls,
          tti: m.tti,
          tbt: m.tbt,
          performanceScore: m.performanceScore,
          thresholds: THRESHOLDS,
          verdict: v,
          rawFile: `lighthouse-${tag}-${device}.json`,
        })
      }
    }

    // 4. Write metrics-summary.json (the consolidated evidence the SUMMARY cites).
    writeFileSync(
      resolve(EVIDENCE_DIR, 'metrics-summary.json'),
      JSON.stringify(summary, null, 2),
    )
    log(`Wrote metrics-summary.json (${summary.routes.length} route×device rows).`)

    // 5. Print a verdict table to stdout.
    console.log('\n================ #302 LIGHTHOUSE VERDICT ================')
    console.log(
      'route        device   formFactor  LCP    INP    CLS    TTI    TBT    score  L/C/T/S verdict',
    )
    for (const r of summary.routes) {
      const fmt = (n) => (n === null || n === undefined ? '  n/a' : String(Math.round(n)).padStart(5))
      const v = r.verdict
      const vcs = `${v.lcp[0].toUpperCase()}/${v.inp[0].toUpperCase()}/${v.tti[0].toUpperCase()}/${v.score[0].toUpperCase()}`
      console.log(
        `${r.route.padEnd(12)} ${r.device.padEnd(8)} ${(r.formFactor || '?').padEnd(10)} ${fmt(r.lcp)} ${fmt(r.inp)} ${fmt(r.cls)} ${fmt(r.tti)} ${fmt(r.tbt)} ${fmt(r.performanceScore)}  ${vcs}`,
      )
    }
    console.log('=========================================================')
    console.log(`formFactor assertions all matched: ${summary.formFactorAssertions.allMatched}`)
    if (!summary.formFactorAssertions.allMatched) {
      console.log('MISMATCHES:', JSON.stringify(summary.formFactorAssertions.mismatches))
    }
  } finally {
    log('Stopping server + cleaning dist-audit...')
    try { server.kill('SIGTERM') } catch { /* ignore */ }
    const rm = spawnSync('rm', ['-rf', resolve(ROOT, 'dist-audit')], { cwd: ROOT })
    if (rm.status !== 0) log('  (dist-audit cleanup returned non-zero — ignoring)')
  }
}

main().catch((err) => {
  console.error('[302-capture] FAILED:', err)
  process.exit(1)
})
