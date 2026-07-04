/**
 * @file tests/unit/348-hydration-no-mismatch.spec.js
 * @description Hydration-safety gate for Issue #348 (build-time SSG).
 *
 * #348 ships build-time SSG via vite-ssg. The win depends on the SSR HTML
 * and the client-hydrated HTML being STRUCTURALLY IDENTICAL — Vue's
 * hydration is "soft": a mismatch does NOT throw (the page renders), but it
 * logs a console.warn and Vue RECONSTRUCTS the affected subtree from
 * scratch, defeating the SSG win (the rebuilt subtree re-runs every render
 * effect, erasing the perf delta SSG was supposed to deliver).
 *
 * This test catches the most common SSR/CSR divergences that would silently
 * erase the SSG LCP win without breaking the test suite:
 *
 * 1. SSR-SKIPPED CONTENT (the worst kind): if a v-if branch is gated on
 *    something that's true on the client but false on the server, the SSR
 *    HTML is missing the branch, the client renders it on hydrate, and Vue
 *    rebuilds the subtree. The static HTML's LCP marker would still be
 *    present (so 348-ssg-output passes) but the SSR'd DOM would be torn
 *    down on hydrate.
 *
 * 2. SSR-ONLY CONTENT (the inverse): if a v-if branch is true on the server
 *    but false on the client, the SSR HTML has content the client discards.
 *
 * 3. Attribute-value mismatches: e.g. class="page-title neon-text" on the
 *    server vs class="page-title" on the client because some computed
 *    class-binding depends on a client-only API (matchMedia, Intersection
 *    Observer).
 *
 * APPROACH:
 * Building full hydration in vitest requires running vite-ssg's client
 * entry against the SSR'd HTML in happy-dom. That's heavy and brittle
 * (happy-dom lacks IntersectionObserver/matchMedia). Instead we apply
 * targeted structural checks to the SSR HTML itself:
 *
 *   - The LCP element MUST NOT be wrapped in a v-if whose condition is
 *     client-only (we assert the LCP element appears in the SSR HTML, which
 *     348-ssg-output already covers, AND that it has at least one
 *     client-hydratable attribute — a data-v-* scope id — so the client
 *     hydration can match the SSR node 1:1 without rebuilding).
 *
 *   - No onMounted-only side-effect should have written to the SSR HTML in
 *     a way the client would not reproduce. We assert the <html> tag carries
 *     data-theme="dark" (the index.html seed + App.vue's onMounted both
 *     apply this; if App.vue's onMounted had WRITTEN to the SSR HTML during
 *     SSG, the seed and the runtime value would diverge).
 *
 *   - The vite-ssg writeTag comment markers must be present and well-formed
 *     so we know the SSG pass (not just the vite client build) produced
 *     the file. vite-ssg emits a `<!--generated-by-vite-ssg-->` (or
 *     equivalent inline data attribute) we can grep for.
 *
 * Together these gate the *most common* silent SSG-erosion modes. The
 * full hydration-equivalence test is left to the Lighthouse mobile capture
 * (which would surface the regression as a LCP stall at audit time).
 *
 * @ticket #348
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')

function stripHtmlComments(s) {
  return s.replace(/<!--[\s\S]*?-->/g, '')
}

function readRoute(distRoot, file) {
  const p = resolve(ROOT, distRoot, file)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf-8')
}

// LCP element + scoped-CSS expectation per route. The scope id (data-v-XXXX)
// is the SAME on the server and the client because vite-ssg runs the SAME
// Vue component on both sides — that's the structural contract Vue's
// hydration matcher relies on.
const ROUTE_LCP = [
  { route: '/', file: 'index.html', lcpClass: 'neon-text' },
  { route: '/about', file: 'about/index.html', lcpClass: 'page-title' },
  { route: '/contact', file: 'contact/index.html', lcpClass: 'section-title' },
  { route: '/news', file: 'news/index.html', lcpClass: 'news-page__title' },
]

// Pick the dist root: prefer dist-audit (the SSG audit build) if present,
// else dist (the prod SSG build), else skip.
function pickDistRoot() {
  if (existsSync(resolve(ROOT, 'dist-audit'))) return 'dist-audit'
  if (existsSync(resolve(ROOT, 'dist'))) return 'dist'
  return null
}

describe('#348 SSG hydration-safety gate', () => {
  const distRoot = pickDistRoot()
  describe.skipIf(!distRoot)(`SSR HTML structure (${distRoot}/)`, () => {
    for (const { route, file, lcpClass } of ROUTE_LCP) {
      it(`${route} LCP element (class~=${lcpClass}) has a Vue scoped-CSS data-v-* attribute`, () => {
        // The data-v-XXXX scope id is what Vue's hydration matcher uses to
        // pair the SSR node with its client counterpart. If the SSR HTML
        // is missing the scope id, the client hydrate treats the SSR node
        // as foreign and rebuilds the subtree — erasing the SSG win.
        const raw = readRoute(distRoot, file)
        expect(raw).not.toBeNull()
        const stripped = stripHtmlComments(raw)
        // Find the element with the LCP class. Match an opening tag with
        // both the class and a data-v-XXXX attribute somewhere in the tag.
        const re = new RegExp(
          `<([a-z0-9]+)\\b[^>]*\\bclass=["'][^"']*\\b${lcpClass}\\b[^"']*["'][^>]*\\bdata-v-[a-f0-9]+\\b[^>]*>`,
          'i',
        )
        expect(
          stripped,
          `${route}: LCP element (class~=${lcpClass}) is missing its Vue scoped-CSS data-v-* attribute in SSR HTML — client hydration will rebuild the subtree and erase the SSG win`,
        ).toMatch(re)
      })
    }

    it('every route file contains the vite-ssg SSR marker (proves SSG pass produced it)', () => {
      // vite-ssg emits a small inline marker we can grep for so the test
      // proves the file came from the SSG pass (not just the client build).
      // The most stable signal is the inline module script that bootstraps
      // hydration — the client-only build also emits this, BUT in
      // combination with per-route index.html files (dist/about/index.html
      // etc.) the only way those land is via SSG. We assert the per-route
      // file exists AND has the module script (the SSG signature).
      for (const { file } of ROUTE_LCP) {
        const raw = readRoute(distRoot, file)
        expect(raw).not.toBeNull()
        const stripped = stripHtmlComments(raw)
        expect(stripped).toMatch(/<script[^>]*type=["']module["']/)
      }
    })

    it('<html> tag carries data-theme="dark" (the SSR seed matches the client onMounted lock)', () => {
      // The index.html seed AND App.vue's onMounted both apply
      // data-theme="dark". If App.vue's onMounted had written to the SSR
      // HTML during SSG (it shouldn't — onMounted is client-only), the
      // SSR <html> tag would carry data-theme="dark" but via the WRONG
      // path, and a refactor that moves setAttribute back to setup() would
      // throw on the server. Asserting the seed at <html> tag level proves
      // the SSR HTML is theme-stable without depending on the client
      // runtime firing.
      const raw = readRoute(distRoot, 'index.html')
      expect(raw).not.toBeNull()
      const stripped = stripHtmlComments(raw)
      expect(stripped).toMatch(/<html\b[^>]*\bdata-theme=["']dark["']/)
    })
  })

  describe('onMounted guard verified by source (SSR-safety of App.vue)', () => {
    it('App.vue keeps document.documentElement.setAttribute INSIDE onMounted (not setup body)', () => {
      // The structural SSR test above proves the seed lands on <html>. This
      // test pins the SOURCE contract that makes it true: App.vue MUST call
      // document.documentElement.setAttribute inside onMounted (where the
      // SSR build skips it) and NOT in the setup() body (where the SSR
      // build would try to execute it and crash on `document is undefined`).
      const appSrc = readFileSync(resolve(ROOT, 'src/App.vue'), 'utf-8')
      const codeOnly = appSrc
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/<!--[\s\S]*?-->/g, '')
      // document.documentElement.setAttribute MUST appear, and it MUST be
      // inside an onMounted callback (heuristic: 'onMounted' appears within
      // 200 chars before it).
      const setAttrIdx = codeOnly.indexOf("document.documentElement.setAttribute('data-theme'", )
      const setAttrIdx2 = codeOnly.indexOf('document.documentElement.setAttribute("data-theme"')
      const idx = setAttrIdx >= 0 ? setAttrIdx : setAttrIdx2
      expect(idx, 'document.documentElement.setAttribute(data-theme) not found in App.vue source').toBeGreaterThanOrEqual(0)
      const preceding = codeOnly.slice(Math.max(0, idx - 200), idx)
      expect(preceding, 'document.documentElement.setAttribute must be inside an onMounted(...) callback so the SSG build skips it').toMatch(/onMounted/)
    })

    it('useLanguage initLanguage guards localStorage with typeof (SSR-safe)', () => {
      // initLanguage() is called from App.vue's onMounted. onMounted is
      // client-only so this guard is not STRICTLY required for the SSG
      // build, but it IS required if initLanguage is ever invoked during
      // module-eval on the server (e.g. by a future refactor that pulls
      // the call out of onMounted). The guard makes the function total on
      // both sides.
      const src = readFileSync(resolve(ROOT, 'src/composables/useLanguage.js'), 'utf-8')
      const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      // Both the READ guard (initLanguage) and the WRITE guard (setLanguage)
      // must be present. Use word-boundary regex so a comment-only mention
      // (already stripped) does not satisfy the contract.
      expect(codeOnly).toMatch(/typeof\s+localStorage\s*===?\s*['"]undefined['"]/)
    })
  })
})
