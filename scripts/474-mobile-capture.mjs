#!/usr/bin/env node
/**
 * @file scripts/474-mobile-capture.mjs
 * @description Mobile performance baseline capture harness for Issue #474
 *
 * Captures Lighthouse metrics on mobile viewport across key routes to establish
 * baseline before optimization. Mirrors the pattern from scripts/302-lighthouse-capture.mjs
 * and scripts/334-lighthouse-capture.mjs.
 *
 * STAGE env var (before|after) routes evidence to:
 *   - lighthouse-{route}-mobile-{stage}.json (raw Lighthouse output)
 *   - metrics-summary-{stage}.json (extracted metrics for IMPLEMENTATION_SUMMARY)
 *
 * Perf-honesty gate: Asserts configSettings.formFactor==='mobile' on every capture.
 *
 * Routes (AC scope): /, /about, /services, /contact, /news
 *
 * Usage:
 *   STAGE=before node scripts/474-mobile-capture.mjs   # baseline
 *   STAGE=after  node scripts/474-mobile-capture.mjs   # post-optimization
 *   node scripts/474-mobile-capture.mjs                # STAGE defaults to 'after'
 *
 * @ticket #474
 */

import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { mkdtempSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PORT = '4175' // Distinct from other captures to avoid collision

// Evidence lives in the DevAgent repo (not the worktree)
const EVIDENCE_DIR =
  '/Users/jinbo/Documents/AIProject/AutoDevAgent/DevAgent/projects/kttech-cyber/tickets/474/evidence'

// Routes to test (key pages from AC requirements)
const ROUTES = [
  { url: '/', tag: 'home' },
  { url: '/about', tag: 'about' },
  { url: '/services', tag: 'services' },
  { url: '/contact', tag: 'contact' },
  { url: '/news', tag: 'news' },
]

// Mobile-only (AC1-3: LCP<2.5s, CLS<0.1, TTI<3.5s on mobile)
const PRESET = { preset: 'perf', device: 'mobile', expectedFormFactor: 'mobile' }

// AC thresholds (from requirements)
const THRESHOLDS = {
  lcp: 2500,    // 2.5s
  cls: 0.1,
  tti: 3500,   // 3.5s
  score: 90,   // Performance score >= 90
}

const STAGE = process.env.STAGE || 'after'

function log(msg) {
  console.log(`[474-capture] ${msg}`)
}

function verdict(metric, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a'
  if (metric === 'score') return value >= THRESHOLDS.score ? 'pass' : 'fail'
  // Lower is better for numeric metrics
  const max = THRESHOLDS[metric]
  return value <= max ? 'pass' : 'fail'
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404 || res.status === 200) return true
    } catch (e) {
      // Server not up yet, keep trying
    }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`Server not ready at ${url} after ${timeoutMs}ms`)
}

async function runLighthouse(url, outputFile) {
  return new Promise((resolve, reject) => {
    const lhArgs = [
      url,
      '--output=json',
      '--output-path=' + outputFile,
      '--quiet',
      '--chrome-flags="--headless --no-sandbox --disable-gpu"',
      '--preset=' + PRESET.preset,
      '--only-categories=performance',
    ]

    log(`Running Lighthouse: ${url} (preset=${PRESET.preset})`)

    const lh = spawn('npx', ['lighthouse', ...lhArgs], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' },
    })

    let stderr = ''
    lh.stderr.on('data', d => { stderr += d.toString() })

    lh.on('close', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Lighthouse failed (code ${code}): ${stderr}`))
      }
    })
  })
}

function extractMetrics(jsonPath) {
  if (!existsSync(jsonPath)) {
    throw new Error(`Lighthouse output not found: ${jsonPath}`)
  }

  const raw = readFileSync(jsonPath, 'utf-8')
  const report = JSON.parse(raw)

  // Assert formFactor (perf-honesty gate)
  const formFactor = report.configSettings?.formFactor
  if (formFactor !== PRESET.expectedFormFactor) {
    throw new Error(
      `FormFactor mismatch: expected "${PRESET.expectedFormFactor}", got "${formFactor}" in ${jsonPath}`
    )
  }

  // Extract Core Web Vitals + TTI + Performance score
  const metrics = {
    url: report.finalUrl,
    formFactor: formFactor,
    lcp: report.audits['largest-contentful-paint']?.numericValue,
    cls: report.audits['cumulative-layout-shift']?.numericValue,
    tti: report.audits['total-blocking-time']?.numericValue
      ? report.audits['total-blocking-time'].numericValue + report.audits['largest-contentful-paint'].numericValue
      : null,
    score: report.categories?.performance?.score * 100,
  }

  return metrics
}

async function main() {
  log(`Starting mobile capture (STAGE=${STAGE})`)
  log(`Evidence directory: ${EVIDENCE_DIR}`)

  // Ensure evidence dir exists
  mkdirSync(EVIDENCE_DIR, { recursive: true })

  // Build the project
  log('Building project...')
  const buildResult = spawnSync(
    '/usr/local/bin/npm',
    ['run', 'build', '--', '--outDir=dist-474'],
    {
      cwd: ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        npm_config_cache: '/tmp/npm-cache-ktech',
      },
    }
  )

  if (buildResult.status !== 0) {
    throw new Error(`Build failed (status ${buildResult.status})`)
  }

  log('Build complete')

  // Start preview server
  log('Starting preview server...')
  const tmpDir = mkdtempSync('vite-preview-474-')
  const server = spawn('npx', ['vite', 'preview', '--port', PORT], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
    },
  })

  let serverStderr = ''
  server.stderr.on('data', d => { serverStderr += d.toString() })

  // Wait for server to be ready
  const serverUrl = `http://localhost:${PORT}/KTechAICyberWeb/`
  try {
    await waitForServer(serverUrl)
    log(`Server ready at ${serverUrl}`)
  } catch (e) {
    server.kill()
    throw new Error(`Failed to start server: ${e.message}`)
  }

  try {
    const summary = []

    for (const route of ROUTES) {
      const url = `${serverUrl}${route.url.replace(/^\//, '')}`.replace(/\/$/, '') || serverUrl
      const outputFile = resolve(EVIDENCE_DIR, `lighthouse-${route.tag}-mobile-${STAGE}.json`)

      log(`Capturing ${route.tag}...`)

      await runLighthouse(url, outputFile)

      const metrics = extractMetrics(outputFile)
      const routeSummary = {
        route: route.tag,
        ...metrics,
        lcpVerdict: verdict('lcp', metrics.lcp),
        clsVerdict: verdict('cls', metrics.cls),
        ttiVerdict: verdict('tti', metrics.tti),
        scoreVerdict: verdict('score', metrics.score),
      }

      summary.push(routeSummary)

      log(`${route.tag}: LCP=${Math.round(metrics.lcp || 0)}ms ${routeSummary.lcpVerdict}, ` +
          `CLS=${(metrics.cls || 0).toFixed(3)} ${routeSummary.clsVerdict}, ` +
          `TTI=${Math.round(metrics.tti || 0)}ms ${routeSummary.ttiVerdict}, ` +
          `Score=${Math.round(metrics.score || 0)} ${routeSummary.scoreVerdict}`)
    }

    // Write metrics summary
    const summaryFile = resolve(EVIDENCE_DIR, `metrics-summary-${STAGE}.json`)
    writeFileSync(summaryFile, JSON.stringify({ stage: STAGE, routes: summary }, null, 2))
    log(`Metrics summary written to ${summaryFile}`)

    // Print table
    log('\n=== Mobile Performance Summary ===')
    log(`STAGE: ${STAGE}`)
    log(`Route        | LCP (ms) | CLS   | TTI (ms) | Score`)
    log('-------------|----------|-------|----------|-------')
    for (const r of summary) {
      log(`${r.route.padEnd(12)} | ${(Math.round(r.lcp || 0) + '').padStart(8)} | ${(r.cls || 0).toFixed(2).padStart(5)} | ${(Math.round(r.tti || 0) + '').padStart(8)} | ${Math.round(r.score || 0)}`)
    }

    // Check AC compliance
    const allPass = summary.every(r =>
      r.lcpVerdict === 'pass' &&
      r.clsVerdict === 'pass' &&
      r.ttiVerdict === 'pass' &&
      r.scoreVerdict === 'pass'
    )

    if (allPass) {
      log('\n✅ All AC thresholds met')
    } else {
      log('\n⚠️  Some AC thresholds not met - see details above')
    }

  } finally {
    server.kill()
    log('Server stopped')
  }
}

main().catch(err => {
  console.error('[474-capture] Fatal error:', err)
  process.exit(1)
})
