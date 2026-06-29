/**
 * @file bundle-size.spec.js
 * @description Performance-budget regression test for Issue #18 (Core Web
 * Vitals). Acts as the in-repo proxy for the "performance budgets configured"
 * and "regression tests prevent performance degradation" acceptance criteria.
 *
 * Why read files instead of importing: importing src/ would pull the whole app
 * into the test (and inflate coverage). Reading dist/assets/*.js with node:fs
 * and computing gzip with node:zlib mirrors exactly what a browser pays for,
 * without touching coverage measurement.
 *
 * Guard: the standard `vitest run` (CI unit suite, ~97% coverage gate) does
 * NOT run a production build first, so dist/assets is absent in that path.
 * describe.skipIf keeps the suite green in that case — the budgets only assert
 * when a build is actually present (e.g. when run after `vite build`, or by a
 * dedicated perf CI job). This guard is load-bearing: without it the coverage
 * gate would flip from green to red the first time someone deleted dist/.
 *
 * @ticket #18
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'

const ASSETS_DIR = resolve(process.cwd(), 'dist/assets')

/** Read a .js chunk file and return { raw, gzip } sizes in bytes. */
function chunkSizes(fileName) {
  const raw = readFileSync(resolve(ASSETS_DIR, fileName))
  return { raw: raw.length, gzip: gzipSync(raw).length }
}

/**
 * Returns the list of built .js chunk filenames (excluding .map files), or an
 * empty array when dist/assets is absent — so the suite no-ops cleanly.
 */
function listJsChunks() {
  if (!existsSync(ASSETS_DIR)) return []
  return readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.js'))
}

// NOTE: thresholds are pinned AFTER measuring the post-optimization build
// (lazy routes + vendor manualChunks + sourcemaps off), with headroom so CI
// does not flake on minor dependency updates. They intentionally guard the two
// CWV-relevant regressions:
//   - TOTAL_ENTRY_GZIP_BUDGET: entry chunks shipped on first paint must stay
//     bounded (regression = a route accidentally pulls a heavy dep eagerly).
//   - MAX_ROUTE_CHUNK_GZIP_BUDGET: no single non-vendor route chunk may blow
//     past this (regression = a view grew a huge dependency).
//
// Measured baseline (post #18 optimization): total gzip 131,332 bytes; largest
// non-vendor/non-index route chunk 'positions-*.js' gzip 5,296 bytes. Budgets
// set at ~22% (total) and ~32% (per-chunk) headroom above that baseline.
//
// Updated for #187 (RUM beacon): the feature adds an OPT-IN, dynamic-imported
// `web-vitals` chunk (~2.5 KB gzip) that only loads when the user enables
// performance monitoring — it is NOT part of first paint. The index chunk also
// grew slightly (~5 KB gzip) from wiring the composable + RumDashboard into the
// app shell. Measured post-#187 total gzip across dist/assets: 162,728 bytes.
// Budget raised from 160,000 -> 170,000 (restores ~4% headroom over the new
// measured total). The MAX_ROUTE_CHUNK_GZIP_BUDGET stays unchanged: web-vitals
// is its own lazy chunk at 2,563 gzip, well under the 7,000 per-chunk cap.
const TOTAL_ENTRY_GZIP_BUDGET = 170000
const MAX_ROUTE_CHUNK_GZIP_BUDGET = 7000

// The suite is skipped entirely when no build is present. describe.skipIf
// evaluates its condition once at collection time.
describe.skipIf(!existsSync(ASSETS_DIR))('bundle-size performance budget (#18)', () => {
  const chunks = listJsChunks()

  it('dist/assets contains route-level splitting (more than one route chunk)', () => {
    // Regression guard for the lazy-route work: before #18 the build emitted a
    // single ~243 kB index chunk. If code splitting regresses (e.g. someone
    // re-introduces static view imports), this count collapses and the test
    // fails. We expect >= 10 chunks (18 routes + vendor + shared chunks).
    expect(chunks.length).toBeGreaterThanOrEqual(10)
  })

  it('total gzip of entry chunks stays within budget', () => {
    // "Entry chunks" = everything in dist/assets that the browser may fetch.
    // The big lever for LCP/TTI. We sum gzip (what crosses the wire) and
    // assert against the budget.
    const perFile = chunks.map((f) => ({ file: f, ...chunkSizes(f) }))
    const totalGzip = perFile.reduce((sum, c) => sum + c.gzip, 0)

    // Audit trail: print measured sizes so the budget is verifiable from CI
    // logs without re-running the build.
    console.log(
      '\n[bundle-size] total JS gzip across dist/assets:',
      totalGzip,
      'bytes (budget',
      TOTAL_ENTRY_GZIP_BUDGET,
      'bytes)'
    )
    for (const c of perFile.sort((a, b) => b.gzip - a.gzip)) {
      console.log(
        `  ${c.file.padEnd(48)} raw ${String(c.raw).padStart(8)}  gzip ${String(c.gzip).padStart(7)}`
      )
    }

    expect(totalGzip).toBeLessThanOrEqual(TOTAL_ENTRY_GZIP_BUDGET)
  })

  it('no single non-vendor route chunk exceeds the per-chunk budget', () => {
    // Excludes the vendor chunk (shared, cached across navigations) and any
    // 'index-*' entry chunk (the router/app shell, bounded by the total
    // budget above). What's left are the per-route lazy chunks; a single one
    // ballooning signals a view imported a heavy dependency.
    const routeChunks = chunks.filter(
      (f) => !f.startsWith('vendor-') && !f.startsWith('index-')
    )
    const perFile = routeChunks.map((f) => ({ file: f, ...chunkSizes(f) }))
    const worst = perFile.reduce(
      (max, c) => (c.gzip > max.gzip ? c : max),
      { file: '(none)', raw: 0, gzip: 0 }
    )

    console.log(
      '\n[bundle-size] largest non-vendor route chunk:',
      worst.file,
      'gzip',
      worst.gzip,
      'bytes (budget',
      MAX_ROUTE_CHUNK_GZIP_BUDGET,
      'bytes)'
    )

    expect(worst.gzip).toBeLessThanOrEqual(MAX_ROUTE_CHUNK_GZIP_BUDGET)
  })
})
