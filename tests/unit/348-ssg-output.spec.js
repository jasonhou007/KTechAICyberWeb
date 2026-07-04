/**
 * @file tests/unit/348-ssg-output.spec.js
 * @description Build-output gate for Issue #348 (build-time SSG via vite-ssg).
 *
 * #348 ships build-time SSG: vite-ssg pre-renders the 5 marketing routes
 * (/, /about, /contact, /news, /services) at BUILD time so first-paint HTML
 * + CSS lands in the initial document, eliminating the SPA hydration gate
 * that set a ~2800ms mobile LCP floor under Lighthouse's 4G throttling
 * (see evidence at projects/kttech-cyber/tickets/348/evidence/).
 *
 * This test PINS the SSG contract: each marketing route's LCP element marker
 * MUST be present in the static HTML (no JS execution required to discover
 * it). If anyone reverts the SSG build, removes a route from
 * vite.config.js ssgOptions.includedRoutes, or breaks the SSR render path,
 * the route's LCP marker vanishes from the static HTML and this test fails.
 *
 * LCP element markers per route (derived from the Lighthouse capture's
 * lcp-element audit + the source view templates):
 *   /         h1.neon-text            (Home hero — the #302 desktop + #348
 *                                       mobile LCP element)
 *   /about    h1.page-title           (About hero — #334 measured this as LCP)
 *   /contact  h2.section-title        (#346 commit 3 confirmed this h2 is LCP;
 *                                       lcp-breakdown-insight reported
 *                                       elementRenderDelay=2870ms with NO
 *                                       resource load, proving hydration was
 *                                       the bottleneck pre-SSG)
 *   /news     h1.news-page__title     (#340 NewsList LCP)
 *   /services (NotFound content via   (Witness route — no declared /services
 *             catch-all)               route; pre-SSG the SPA served the same
 *                                       NotFound content, so the before/after
 *                                       comparison is apples-to-apples.)
 *
 * Markers are CLASS NAMES (not full attribute literals) because the source
 * views compose multiple classes on the LCP element (e.g. /about's h1 has
 * class="page-title neon-text glitch-text"). HTML comments are stripped
 * before assertion so a marker substring inside a <!-- ... --> comment does
 * not satisfy the contract.
 *
 * BUILD VARIANTS:
 *   - dist/         — production build (base=/KTechAICyberWeb/); CI emits this.
 *   - dist-audit/   — audit build (base=/), used by 348-lighthouse-capture.mjs.
 * Both variants go through the SSG pass; both MUST contain the LCP markers in
 * static HTML. The test asserts BOTH when present (the standard `vitest run`
 * CI path does not build first, so the suite no-ops cleanly via describe.skipIf
 * when neither is present — same guard pattern as 340-perf-css-defer-pattern).
 *
 * @ticket #348
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')

// Strip HTML comments so the marker assertion is against actual rendered
// content, not a stray marker substring inside a <!-- ... --> comment.
function stripHtmlComments(s) {
  return s.replace(/<!--[\s\S]*?-->/g, '')
}

// Each entry: route-relative path under dist/ + the LCP marker class name
// that MUST appear in the static HTML (post-comment-strip). Class NAME (not
// attribute literal) so multi-class compositions like
// class="page-title neon-text glitch-text" still match.
const ROUTE_LCP_MARKERS = [
  { route: '/', file: 'index.html', marker: 'neon-text' },
  { route: '/about', file: 'about/index.html', marker: 'page-title' },
  { route: '/contact', file: 'contact/index.html', marker: 'section-title' },
  { route: '/news', file: 'news/index.html', marker: 'news-page__title' },
  // /services has no declared route — falls through to NotFound's catch-all.
  // The marker is NotFound's root class so we verify SSG actually followed
  // the catch-all (not a stale empty page from a broken build).
  { route: '/services', file: 'services/index.html', marker: 'not-found' },
]

// Read a route file from a given dist root. Returns null if the file does
// not exist (so the audit-vs-prod variants can be tested independently).
function readRoute(distRoot, file) {
  const p = resolve(ROOT, distRoot, file)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf-8')
}

// Helper to build a describe block per variant. Allows each variant to
// no-op cleanly if its build dir is absent.
function assertVariant(distRoot) {
  const distExists = existsSync(resolve(ROOT, distRoot))
  describe.skipIf(!distExists)(`#348 SSG output (${distRoot}/)`, () => {
    for (const { route, file, marker } of ROUTE_LCP_MARKERS) {
      it(`${route} static HTML contains LCP marker class "${marker}"`, () => {
        const raw = readRoute(distRoot, file)
        expect(raw, `${distRoot}/${file} not found — SSG did not pre-render ${route}`).not.toBeNull()
        const stripped = stripHtmlComments(raw)
        expect(
          stripped,
          `${distRoot}/${file} does not contain class "${marker}" in static HTML — SSG did not render the route's LCP element server-side`,
        ).toContain(marker)
      })
    }

    it('static HTML contains the vite-ssg hydration script (the SSR -> CSR handoff)', () => {
      // vite-ssg emits a module script entry that hydrates the static HTML.
      // If the entry is missing, the static HTML never hydrates and the page
      // is dead (no interactivity). The script's exact src hash varies per
      // build, so we assert a script tag with type="module" pointing at the
      // assets/ entry chunk. (Either dist/index.html or one of the per-route
      // index.html files contains it — we check the home route.)
      const raw = readRoute(distRoot, 'index.html')
      expect(raw).not.toBeNull()
      const stripped = stripHtmlComments(raw)
      expect(stripped).toMatch(/<script[^>]*type=["']module["'][^>]*src=["'][^"']*assets\/[^"']+\.js["']/)
    })
  })
}

describe('#348 SSG output — LCP markers in static HTML (5 marketing routes)', () => {
  assertVariant('dist')
  assertVariant('dist-audit')

  // Cross-variant consistency: when BOTH variants exist (the typical case
  // after the capture harness runs), the LCP marker set MUST be identical —
  // a route's LCP marker present in dist/ but missing in dist-audit/ (or
  // vice versa) would mean the audit-build LCP measurement is measuring a
  // DIFFERENT page than the production build (invalid evidence).
  describe('cross-variant consistency (only when both dist/ and dist-audit/ exist)', () => {
    const bothExist =
      existsSync(resolve(ROOT, 'dist')) &&
      existsSync(resolve(ROOT, 'dist-audit'))
    it.skipIf(!bothExist)(
      'every route present in dist/ is also present in dist-audit/ (same SSG pass)',
      () => {
        for (const { route, file, marker } of ROUTE_LCP_MARKERS) {
          const prod = stripHtmlComments(readRoute('dist', file) || '')
          const audit = stripHtmlComments(readRoute('dist-audit', file) || '')
          const prodHas = prod.includes(marker)
          const auditHas = audit.includes(marker)
          expect(
            { route, prodHas, auditHas },
            `${route}: LCP marker "${marker}" presence diverges between dist/ (has=${prodHas}) and dist-audit/ (has=${auditHas}) — audit-build evidence is not measuring the same page as production`,
          ).toEqual({ route, prodHas: prodHas, auditHas: auditHas })
          expect(prodHas).toBe(auditHas)
        }
      },
    )
  })
})
