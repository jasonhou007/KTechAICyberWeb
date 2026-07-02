#!/usr/bin/env node
/**
 * @file scripts/334-lighthouse-capture.mjs
 * @description Mobile-only Lighthouse capture harness for Issue #334
 * (mobile LCP<2.5s + score>=90 on /about, /contact, /news, deferred from #302).
 *
 * Why a dedicated harness (vs reusing scripts/302-lighthouse-capture.mjs):
 *   - #302 ran BOTH desktop + mobile presets across 5 routes (10 captures).
 *     #334 is a TARGETED mobile-only capture on the 3 routes that missed the
 *     mobile AC, plus 2 witness routes (Home, /services) to prove the fix does
 *     not regress the routes that were already passing. Narrowing the scope
 *     keeps each STAGE=before|after run fast (~5 captures, mobile preset).
 *   - The STAGE env var (before|after) routes the raw JSON to
 *     lighthouse-{route}-mobile-{stage}.json so the before/after pair lives
 *     side-by-side in the evidence dir for the IMPLEMENTATION_SUMMARY table.
 *
 * Perf-honesty gate (iter-16): every cited number traces to a saved JSON whose
 * configSettings.formFactor==='mobile'. The harness ASSERTS this on every
 * capture before trusting any metric it emits — a desktop-formFactor JSON in a
 * mobile-tagged file would silently inflate the score and fake a PASS.
 *
 * The evidence dir is in the DevAgent repo (not the worktree) so it survives
 * worktree cleanup. Absolute path per the ticket instructions.
 *
 * Routes:
 *   TARGET (AC1): /about, /contact, /news      -> lighthouse-{tag}-mobile-{stage}.json
 *   WITNESS:      /, /services                 -> lighthouse-{tag}-mobile-{stage}.json
 *
 * Usage:
 *   STAGE=before node scripts/334-lighthouse-capture.mjs   # baseline
 *   STAGE=after  node scripts/334-lighthouse-capture.mjs   # post-fix
 *   node scripts/334-lighthouse-capture.mjs                # STAGE defaults to 'after'
 *
 * @ticket #334
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
const PORT = '4174' // distinct from 302's 4173 so concurrent captures don't collide

// Evidence lives in the DevAgent repo (not the worktree) so it persists after
// the worktree is cleaned up.
const EVIDENCE_DIR =
  '/Users/jinbo/Documents/AIProject/AutoDevAgent/DevAgent/projects/kttech-cyber/tickets/334/evidence'

// TARGET routes are the AC1 set; WITNESS routes guard against regression on the
// two routes that were already passing mobile in #302.
const TARGET_ROUTES = [
  { url: '/about', tag: 'about', kind: 'target' },
  { url: '/contact', tag: 'contact', kind: 'target' },
  { url: '/news', tag: 'news', kind: 'target' },
]
const WITNESS_ROUTES = [
  { url: '/', tag: 'home', kind: 'witness' },
  { url: '/services', tag: 'services', kind: 'witness' },
]

// Mobile-only. The AC and the diagnosis are mobile-specific (#302 desktop
// already passed); capturing desktop here would burn time without informing
// the AC. expectedFormFactor is asserted per-capture (perf-honesty gate).
const PRESET = { preset: 'perf', device: 'mobile', expectedFormFactor: 'mobile' }

// AC thresholds. verdict per metric = pass | fail | n/a.
const THRESHOLDS = { lcp: 2500, score: 90 }

function log(msg) {
  console.log(`[334-capture] ${msg}`)
}

function verdict(metric, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a'
  if (metric === 'score') return value >= THRESHOLDS.score ? 'pass' : 'fail'
  return value <= THRESHOLDS[metric] ? 'pass' : 'fail'
}

/**
 * Extract the LCP element snippet for stdout logging. Lighthouse does not
 * always populate the LCP audit's details.items[0].node (it is often {} in a
 * saved JSON), so we return whatever diagnostic string is available:
 *   - the node's snippet (HTML) if present
 *   - otherwise the audit's displayValue (e.g. "4.2 s")
 * Returns '' if nothing is available.
 */
function lcpElementSnippet(lh) {
  const lcp = lh.audits?.['largest-contentful-paint']
  if (!lcp) return ''
  const items = lcp.details?.items || []
  for (const it of items) {
    const node = it.node || {}
    if (node.snippet) return node.snippet.slice(0, 120)
    if (node.path) return node.path.slice(0, 120)
  }
  return lcp.displayValue || ''
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
 * Run a single Lighthouse capture. Returns { lh } or { error }. Never throws.
 * Falls back from --headless=new to --headless if the new flag is rejected.
 */
function runLighthouse(routeUrl, preset) {
  const tmpDir = mkdtempSync(resolve(tmpdir(), 'lh334-'))
  const outPath = resolve(tmpDir, 'lh.json')

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
    return spawnSync(
      resolve(ROOT, 'node_modules/.bin/lighthouse'),
      args,
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
  }

  let res = tryRun('--headless=new')
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
  try {
    return { lh: JSON.parse(readFileSync(outPath, 'utf8')) }
  } catch (e) {
    return { error: `failed to parse JSON: ${e.message}` }
  }
}

async function main() {
  // STAGE controls the output filename suffix. The before/after pair lands
  // side-by-side in the evidence dir for the SUMMARY before→after table.
  const stageRaw = (process.env.STAGE || 'after').toLowerCase()
  if (stageRaw !== 'before' && stageRaw !== 'after') {
    console.error(`[334-capture] STAGE must be 'before' or 'after' (got '${stageRaw}')`)
    process.exit(2)
  }
  const stage = stageRaw
  log(`STAGE=${stage}`)

  mkdirSync(EVIDENCE_DIR, { recursive: true })

  // Witness routes are measured AFTER only (they exist to prove the fix does
  // not regress already-passing routes — a before-baseline already exists in
  // the #302 evidence dir). Target routes are measured in BOTH stages.
  const routes = stage === 'after' ? [...TARGET_ROUTES, ...WITNESS_ROUTES] : TARGET_ROUTES

  const summary = {
    generatedAt: new Date().toISOString(),
    stage,
    preset: PRESET,
    thresholds: THRESHOLDS,
    routes: [],
    formFactorAssertions: { allMatched: true, mismatches: [] },
  }

  // 1. Build the audit variant. base=/ so root-relative routes resolve at the
  //    web root (the production /KTechAICyberWeb/ base breaks local asset
  //    loading -> NO_FCP; same rationale as 302-lighthouse-capture.mjs and
  //    lighthouse-ci.yml).
  log('Building audit variant (base=/, outDir dist-audit)...')
  const buildRes = spawnSync(
    resolve(ROOT, 'node_modules/.bin/vite'),
    ['build', '--base=/', '--outDir', 'dist-audit'],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  if (buildRes.status !== 0) {
    console.error('[334-capture] vite build failed:\n' + (buildRes.stderr || '').slice(-800))
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

    const { preset, device, expectedFormFactor } = PRESET

    // 3. For each route: run, ASSERT formFactor, extract, save raw, log.
    for (const { url: route, tag, kind } of routes) {
      const routeUrl = `http://localhost:${PORT}${route}`
      log(`Lighthouse ${routeUrl} [${preset}] (${kind})...`)
      const run = runLighthouse(routeUrl, preset)

      if (run.error) {
        log(`  ERROR — ${run.error}`)
        summary.routes.push({
          route, kind, device, stage,
          formFactor: null,
          lcp: null, performanceScore: null,
          lcpElement: '',
          error: run.error,
          verdict: { lcp: 'error', score: 'error' },
        })
        continue
      }

      const lh = run.lh
      // perf-honesty (iter-16): assert the preset produced the expected
      // formFactor BEFORE trusting any number it emitted.
      const actualFF = lh.configSettings?.formFactor ?? 'unknown'
      const formFactorMatched = actualFF === expectedFormFactor
      if (!formFactorMatched) {
        log(`  FORMFACTOR MISMATCH: expected ${expectedFormFactor}, got ${actualFF}`)
        summary.formFactorAssertions.allMatched = false
        summary.formFactorAssertions.mismatches.push({
          route, stage, preset, expected: expectedFormFactor, actual: actualFF,
        })
        // Throw-style: record the mismatch but DO emit the JSON so the user can
        // inspect it; mark the metrics as untrusted.
      } else {
        log(`  formFactor PASS (${actualFF})`)
      }

      const m = extractMetrics(lh)
      const lcpEl = lcpElementSnippet(lh)

      // Save the RAW lighthouse JSON (the evidence-of-record). Filename
      // encodes route + device + STAGE so before/after are distinguishable.
      const rawPath = resolve(EVIDENCE_DIR, `lighthouse-${tag}-${device}-${stage}.json`)
      writeFileSync(rawPath, JSON.stringify(lh, null, 2))

      const v = {
        lcp: verdict('lcp', m.lcp),
        score: verdict('score', m.performanceScore),
      }
      log(`  LCP=${m.lcp == null || Number.isNaN(m.lcp) ? 'n/a' : Math.round(m.lcp)}ms  score=${m.performanceScore}  verdict=${JSON.stringify(v)}`)
      if (lcpEl) log(`  LCP element: ${lcpEl}`)

      summary.routes.push({
        route, kind, device, stage,
        formFactor: actualFF,
        formFactorMatched,
        lcp: Number.isFinite(m.lcp) ? m.lcp : null,
        cls: Number.isFinite(m.cls) ? m.cls : null,
        tbt: Number.isFinite(m.tbt) ? m.tbt : null,
        tti: Number.isFinite(m.tti) ? m.tti : null,
        performanceScore: m.performanceScore,
        lcpElement: lcpEl,
        thresholds: THRESHOLDS,
        verdict: v,
        rawFile: `lighthouse-${tag}-${device}-${stage}.json`,
      })
    }

    // 4. Write metrics-summary-{stage}.json (consolidated evidence for SUMMARY).
    writeFileSync(
      resolve(EVIDENCE_DIR, `metrics-summary-${stage}.json`),
      JSON.stringify(summary, null, 2),
    )
    log(`Wrote metrics-summary-${stage}.json (${summary.routes.length} routes).`)

    // 5. Print a verdict table.
    console.log(`\n========== #334 LIGHTHOUSE VERDICT (STAGE=${stage}, formFactor=mobile) ==========`)
    console.log('kind      route       LCP      score    L/S verdict')
    for (const r of summary.routes) {
      const fmtLcp = (n) => (n === null || n === undefined ? '   n/a' : String(Math.round(n)).padStart(6) + 'ms')
      const fmtScore = (n) => (n === null || n === undefined ? '  n/a' : String(n).padStart(4))
      const v = r.verdict
      const vcs = `${(v.lcp || '?')[0].toUpperCase()}/${(v.score || '?')[0].toUpperCase()}`
      const ff = r.formFactor === 'mobile' ? '' : ` [FF=${r.formFactor}!]`
      console.log(`${r.kind.padEnd(9)} ${r.route.padEnd(11)} ${fmtLcp(r.lcp)}  ${fmtScore(r.performanceScore)}    ${vcs}${ff}`)
    }
    console.log('====================================================================================')
    console.log(`formFactor assertions all matched: ${summary.formFactorAssertions.allMatched}`)
    if (!summary.formFactorAssertions.allMatched) {
      console.log('MISMATCHES:', JSON.stringify(summary.formFactorAssertions.mismatches))
    }

    // 6. Target-route gate: every TARGET route must pass LCP<2500 AND score>=90.
    //    (Witness routes are reported but do not fail the run — they are
    //    informational regression indicators.)
    if (stage === 'after') {
      const targetResults = summary.routes.filter((r) => r.kind === 'target')
      const failed = targetResults.filter(
        (r) => r.verdict.lcp !== 'pass' || r.verdict.score !== 'pass',
      )
      if (failed.length > 0) {
        log(`AC1 GATE: ${failed.length}/${targetResults.length} target routes FAILED:`)
        for (const f of failed) {
          log(`  ${f.route}: LCP=${f.lcp} score=${f.performanceScore} verdict=${JSON.stringify(f.verdict)}`)
        }
      } else {
        log(`AC1 GATE: all ${targetResults.length} target routes PASS (LCP<2500 + score>=90)`)
      }
    }
  } finally {
    log('Stopping server + cleaning dist-audit...')
    try { server.kill('SIGTERM') } catch { /* ignore */ }
    spawnSync('rm', ['-rf', resolve(ROOT, 'dist-audit')], { cwd: ROOT })
  }
}

main().catch((err) => {
  console.error('[334-capture] FAILED:', err)
  process.exit(1)
})
