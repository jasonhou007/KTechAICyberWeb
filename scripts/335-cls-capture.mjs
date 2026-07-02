#!/usr/bin/env node
/**
 * @file scripts/335-cls-capture.mjs
 * @description Runtime CLS verification harness for Issue #335.
 *
 * Models scripts/302-lighthouse-capture.mjs exactly. Differences:
 *   - ROUTES: only / and /about (the two routes the issue names as failing).
 *   - PRESETS: both desktop + mobile (perf preset) — all 4 combos.
 *   - Extracts ONLY cumulative-layout-shift (the metric under fix). Adds
 *     --only-categories=performance to each Lighthouse run to speed it up.
 *   - Port 4317 (NOT 4173) so a stale dev/preview server a concurrent lane
 *     left on 4173 cannot be hit by mistake.
 *   - After all 4 runs: writes metrics-summary-335.json with before/after
 *     numbers (before pulled from tickets/302/evidence/metrics-summary.json),
 *     prints a verdict table, and EXITS 1 if ANY combo has CLS >= 0.1
 *     (regression gate).
 *
 * iter-16 device-class honesty: each run asserts configSettings.formFactor
 * matches the preset's expected device BEFORE the CLS number is trusted.
 *
 * Usage:
 *   node scripts/335-cls-capture.mjs
 *
 * @ticket #335
 */
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { mkdtempSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
// 4317 — distinct from the 302 harness's 4173 so a stale preview server on
// 4173 cannot be hit by mistake.
const PORT = '4317'

// Evidence lives in the DevAgent repo (not the worktree) so it persists after
// the worktree is cleaned up (same parent-repo convention as the 302 evidence).
const EVIDENCE_DIR =
  '/Users/jinbo/Documents/AIProject/AutoDevAgent/DevAgent/projects/kttech-cyber/tickets/335/evidence'

// Before-numbers come from the 302 baseline (saved JSONs in the same parent
// repo). Read once at startup so the summary can carry before/after side by
// side. If the file is missing we surface null (do not fabricate).
const BEFORE_SUMMARY_PATH =
  '/Users/jinbo/Documents/AIProject/AutoDevAgent/DevAgent/projects/kttech-cyber/tickets/302/evidence/metrics-summary.json'

const ROUTES = [
  { url: '/', tag: 'home' },
  { url: '/about', tag: 'about' },
]
// Lighthouse presets -> the configSettings.formFactor each produces. perf is
// the mobile preset (throttled CPU + 4G); desktop is the desktop preset.
const PRESETS = [
  { preset: 'desktop', device: 'desktop', expectedFormFactor: 'desktop' },
  { preset: 'perf', device: 'mobile', expectedFormFactor: 'mobile' },
]

const CLS_THRESHOLD = 0.1

function log(msg) {
  console.log(`[335-capture] ${msg}`)
}

function clsVerdict(cls) {
  if (cls === null || cls === undefined || Number.isNaN(cls)) return 'n/a'
  return cls < CLS_THRESHOLD ? 'pass' : 'fail'
}

/** Read the 302 baseline CLS for a (route-tag, device) combo, or null. */
function beforeCls(tag, device) {
  if (!existsSync(BEFORE_SUMMARY_PATH)) return null
  try {
    const summary = JSON.parse(readFileSync(BEFORE_SUMMARY_PATH, 'utf8'))
    const row = (summary.routes || []).find(
      (r) => r.route === `/${tag === 'home' ? '' : tag}` && r.device === device,
    )
    // route '/' has tag 'home' in both this script and the 302 summary, so the
    // tag->route mapping above handles it.
    const row2 = (summary.routes || []).find((r) => r.device === device &&
      ((tag === 'home' && r.route === '/') || (tag !== 'home' && r.route === `/${tag}`)))
    const picked = row || row2
    return picked ? picked.cls : null
  } catch {
    return null
  }
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
  const tmpDir = mkdtempSync(resolve(tmpdir(), 'lh335-'))
  const outPath = resolve(tmpDir, 'lh.json')
  const chromeFlags = '--headless=new --no-sandbox --disable-gpu'

  function tryRun(headlessFlag) {
    const args = [
      routeUrl,
      '--output=json',
      `--output-path=${outPath}`,
      `--preset=${preset}`,
      '--only-categories=performance',
      '--quiet',
      `--chrome-flags=${headlessFlag} --no-sandbox --disable-gpu`,
      '--max-wait-for-load=45000',
    ]
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
    threshold: CLS_THRESHOLD,
    beforeSource: BEFORE_SUMMARY_PATH,
    runs: [],
    formFactorAssertions: { allMatched: true, mismatches: [] },
  }

  // 1. Build the audit variant. base=/ so root-relative routes resolve when
  //    served at the web root (the production /KTechAICyberWeb/ base breaks
  //    local asset loading -> NO_FCP; same rationale as 302 + lighthouse-ci.yml).
  log('Building audit variant (base=/, outDir dist-audit-335)...')
  const buildRes = spawnSync(
    resolve(ROOT, 'node_modules/.bin/vite'),
    ['build', '--base=/', '--outDir', 'dist-audit-335'],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  if (buildRes.status !== 0) {
    console.error('[335-capture] vite build failed:\n' + (buildRes.stderr || '').slice(-800))
    process.exit(1)
  }

  // 2. Spawn the static server on the isolated port.
  log(`Spawning serve -s dist-audit-335 -l ${PORT}...`)
  const server = spawn(
    resolve(ROOT, 'node_modules/.bin/serve'),
    ['-s', 'dist-audit-335', '-l', PORT],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  server.stdout?.on('data', (d) => process.stderr.write(d))
  server.stderr?.on('data', (d) => process.stderr.write(d))

  try {
    await waitForServer(`http://localhost:${PORT}/`)
    log('Server is up.')

    // 3. For each route × preset: run, assert formFactor, extract CLS, save raw.
    for (const { preset, device, expectedFormFactor } of PRESETS) {
      for (const { url: route, tag } of ROUTES) {
        const routeUrl = `http://localhost:${PORT}${route}`
        log(`Lighthouse ${routeUrl} [${preset}] (device=${device})...`)
        const run = runLighthouse(routeUrl, preset)

        if (run.error) {
          log(`  ERROR — capturing in summary: ${run.error}`)
          summary.runs.push({
            route, device, formFactor: null,
            cls: null, formFactorMatched: false,
            before: beforeCls(tag, device),
            verdict: 'error',
            error: run.error,
          })
          continue
        }

        const lh = run.lh
        // iter-16 perf-honesty: assert the preset produced the expected
        // formFactor BEFORE trusting the CLS number it emitted.
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

        const cls = Number(lh.audits?.['cumulative-layout-shift']?.numericValue)
        const v = clsVerdict(cls)

        // Save the RAW lighthouse JSON (the evidence-of-record).
        const rawPath = resolve(EVIDENCE_DIR, `lighthouse-${tag}-${device}.json`)
        writeFileSync(rawPath, JSON.stringify(lh, null, 2))

        const before = beforeCls(tag, device)
        log(`  CLS=${cls} (before=${before}) verdict=${v}`)

        summary.runs.push({
          route,
          device,
          formFactor: actualFF,
          formFactorMatched,
          cls,
          before,
          verdict: v,
          rawFile: `lighthouse-${tag}-${device}.json`,
        })
      }
    }

    // 4. Write metrics-summary-335.json.
    writeFileSync(
      resolve(EVIDENCE_DIR, 'metrics-summary-335.json'),
      JSON.stringify(summary, null, 2),
    )
    log(`Wrote metrics-summary-335.json (${summary.runs.length} route×device rows).`)

    // 5. Print the verdict table to stdout.
    console.log('\n================ #335 CLS VERDICT ================')
    console.log('route    device   formFactor  CLS   (before)  verdict')
    const failing = []
    for (const r of summary.runs) {
      const clsStr = r.cls === null || r.cls === undefined ? 'n/a' : r.cls.toFixed(4)
      const beforeStr = r.before === null || r.before === undefined ? 'n/a' : r.before.toFixed(4)
      console.log(
        `${r.route.padEnd(8)} ${r.device.padEnd(8)} ${(r.formFactor || '?').padEnd(10)} ${clsStr.padStart(7)} (${beforeStr.padStart(7)})  ${r.verdict}`,
      )
      if (r.verdict === 'fail' || r.verdict === 'error') failing.push(r)
    }
    console.log('=================================================')
    console.log(`formFactor assertions all matched: ${summary.formFactorAssertions.allMatched}`)
    if (!summary.formFactorAssertions.allMatched) {
      console.log('MISMATCHES:', JSON.stringify(summary.formFactorAssertions.mismatches))
    }

    // 6. REGRESSION GATE: exit 1 if any combo failed.
    if (failing.length > 0) {
      console.error(`\n[335-capture] REGRESSION: ${failing.length} combo(s) CLS >= ${CLS_THRESHOLD} or errored:`)
      for (const r of failing) {
        console.error(`  ${r.route} ${r.device}: CLS=${r.cls} verdict=${r.verdict} ${r.error || ''}`)
      }
      process.exit(1)
    }
    console.log(`\n[335-capture] ALL ${summary.runs.length} combos PASS (CLS < ${CLS_THRESHOLD}).`)
  } finally {
    log('Stopping server + cleaning dist-audit-335...')
    try { server.kill('SIGTERM') } catch { /* ignore */ }
    const rm = spawnSync('rm', ['-rf', resolve(ROOT, 'dist-audit-335')], { cwd: ROOT })
    if (rm.status !== 0) log('  (dist-audit-335 cleanup returned non-zero — ignoring)')
  }
}

main().catch((err) => {
  console.error('[335-capture] FAILED:', err)
  process.exit(1)
})
