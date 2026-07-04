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
// app shell. Measured post-#187 total gzip across dist/assets: 163,324 bytes
// (re-derived from a fresh `vite build`, 2026-06-29; the prior 162,728 figure
// predated the #187 review(dead-state) latest-reading readout). Budget raised
// from 160,000 -> 170,000 (restores ~4% headroom over the new measured total).
// The MAX_ROUTE_CHUNK_GZIP_BUDGET stays unchanged: web-vitals is its own lazy
// chunk at 2,580 gzip, well under the 7,000 per-chunk cap.
//
// Updated for #203 (Self-Driving demo): the feature adds a new code-split
// `SelfDrivingDemo-*.js` lazy chunk (~3.1 KB gzip) lazy-imported in Home.vue +
// About.vue via defineAsyncComponent (NOT eager — it does not bloat the index
// entry chunk; it loads on demand like the 5 #224 modules + #206 stream).
// Measured post-#203 total gzip across dist/assets: 170,305 bytes (fresh
// `vite build`, 2026-06-30). Budget raised 170,000 -> 175,000 (restores ~2.7%
// headroom over the new measured total, consistent with the #187 bump's
// philosophy: a properly code-split flagship feature warrants a documented
// bump rather than a hack). MAX_ROUTE_CHUNK_GZIP_BUDGET unchanged — the new
// chunk at 3,139 gzip is well under the 7,000 per-chunk cap.
//
// Updated for #240 (remove RUM beacon): the #187 RUM feature was fully removed
// (the performance-monitoring debug panel was leaking into production). This
// deletes the dynamic-imported `web-vitals` async chunk (-2,556 gzip) AND the
// RumDashboard/useRumBeacon wiring from the index entry chunk (-3,148 gzip).
// Measured post-#240 total gzip across dist/assets: 164,141 bytes / 30 chunks
// (fresh `vite build`, 2026-06-30; was 170,305 / 31 chunks pre-#240 — a
// -5,730 gzip / -1-chunk shrink). The TOTAL_ENTRY_GZIP_BUDGET is intentionally
// LEFT at 175,000: a deletion widens headroom (now ~6.6%), which is the
// correct direction — lowering the ceiling after a shrink would mask a future
// regression that re-adds comparable weight. MAX_ROUTE_CHUNK_GZIP_BUDGET
// unchanged (the deleted web-vitals chunk was already well under the cap).
//
// Updated for #348 (build-time SSG via vite-ssg): vite-ssg renames the entry
// chunk from `index-*.js` to `app-*.js` (the SSG client entry that hydrates
// the pre-rendered HTML) and re-organizes the chunk graph: app shell + router
// + pinia + head + the route-import manifest land in `app-*.js`, while vue +
// vue-router + pinia + @vueuse stay in `vendor-*.js` via the function-form
// manualChunks. The measured post-#348 totals (fresh `vite-ssg build`,
// 2026-07-04):
//   - app-*.js     gzip 60,115 bytes  (was index-*.js gzip 54,102 pre-SSG)
//   - vendor-*.js  gzip ~47,000 bytes (unchanged from pre-SSG)
//   - total dist/assets gzip 178,721 bytes / 58 chunks
// The 14,580-byte total-vs-pre-#240 growth is the vite-ssg runtime + the SSG
// hydration bootstrap. TOTAL_ENTRY_GZIP_BUDGET is RAISED 175,000 -> 185,000
// (restores ~3% headroom over the new measured total, consistent with the
// #187/#203 philosophy: a properly-isolated SSG entry warrants a documented
// bump rather than a hack — the LCP win from #348 (>900ms on every AC route)
// is the trade-off). MAX_ROUTE_CHUNK_GZIP_BUDGET UNCHANGED — the per-route
// lazy chunks (About-*.js, News-*.js, etc.) all stay well under 7,000 gzip
// individually; the 60KB `app-*.js` is the ENTRY (filtered out by the
// `app-*` / `index-*` / `vendor-*` exclusion), not a route chunk.
//
// ENTRY-CHUNK FILTER UPDATE: the route-chunk filter (was `!vendor-` &&
// `!index-`) MUST also exclude `app-` because vite-ssg names the SSG entry
// `app-*.js`. Without this exclusion, the SSG entry would be classified as a
// "route chunk" and the per-chunk budget (7,000 gzip) would flag the 60KB
// entry as a regression — a false positive that masks real per-route
// regressions.
const TOTAL_ENTRY_GZIP_BUDGET = 185000
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
    // 'index-*' or 'app-*' entry chunk (the router/app shell, bounded by the
    // total budget above). What's left are the per-route lazy chunks; a
    // single one ballooning signals a view imported a heavy dependency.
    // #348: 'app-*' is vite-ssg's entry-chunk name (the SSG client entry
    // that hydrates the pre-rendered HTML); the pre-SSG 'index-*' name is
    // kept for backward compat in case a future build reverts to vite build.
    const routeChunks = chunks.filter(
      (f) => !f.startsWith('vendor-') && !f.startsWith('index-') && !f.startsWith('app-')
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

  // #253 AC9: the main entry point (the chunks the browser MUST fetch on first
  // paint of any route before any lazy chunk loads) must stay under 500KB
  // gzipped. The entry is the app shell: the index-* chunk (router + app
  // bootstrap + eagerly-imported components) + the vendor-* chunk (Vue, VueUse,
  // Pinia, vue-router). 5x headroom over the measured ~94KB total so the gate
  // does not flake on minor dependency bumps but catches a real regression
  // (e.g. a heavy dep accidentally imported into the entry).
  //
  // Measured baseline (post #253 build): index-* gzip 53,241 + vendor-* gzip
  // 40,273 = 93,514 bytes total (re-derived from a fresh `vite build`).
  //
  // #348 update: vite-ssg names the SSG client entry `app-*.js` instead of
  // `index-*.js`. The filter accepts BOTH names so the gate stays valid
  // across SSG and non-SSG builds. Post-#348 entry total: app-* gzip 60,115
  // + vendor-* gzip ~47,000 = ~107,000 bytes total — still well under the
  // 500,000 byte AC9 budget.
  it('main entry gzipped < 500KB (#253 AC9)', () => {
    const entryChunks = chunks.filter(
      (f) => f.startsWith('index-') || f.startsWith('vendor-') || f.startsWith('app-')
    )
    const perFile = entryChunks.map((f) => ({ file: f, ...chunkSizes(f) }))
    const entryGzip = perFile.reduce((sum, c) => sum + c.gzip, 0)

    console.log(
      '\n[bundle-size] main entry gzip (index + vendor):',
      entryGzip,
      'bytes (AC9 budget 500_000 bytes)'
    )
    for (const c of perFile.sort((a, b) => b.gzip - a.gzip)) {
      console.log(`  ${c.file.padEnd(48)} gzip ${String(c.gzip).padStart(7)}`)
    }

    expect(entryGzip).toBeLessThan(500_000)
  })
})
