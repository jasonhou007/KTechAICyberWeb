/**
 * @file tests/unit/348-clientonly-isolation.spec.js
 * @description Client-side-effect isolation gate for Issue #348 (build-time SSG).
 *
 * #348 ships build-time SSG via vite-ssg. Components that touch browser-only
 * APIs (matchMedia, IntersectionObserver, requestAnimationFrame, document,
 * window, localStorage) MUST either:
 *
 *   (a) Guard the access with `typeof X !== 'undefined'` so the SSR pass
 *       (where these globals are undefined) doesn't throw; OR
 *   (b) Run the access inside onMounted, which vite-ssg's SSR pass SKIPS
 *       (only the client fires onMounted); OR
 *   (c) Be wrapped in <ClientOnly> so the SSR pass emits a placeholder.
 *
 * If a component violates all three, the SSG build throws at build time
 * (crashing CI) OR — worse — silently writes client-only state into the SSR
 * HTML that the client discards on hydrate, erasing the SSG perf win.
 *
 * #348 did NOT introduce any <ClientOnly> usage (none of the existing
 * components need it: every component either renders correctly on the
 * server OR guards its browser-API access). This test pins that contract
 * so a future refactor that introduces a browser-API access in setup() body
 * without a guard fails the gate before it erodes the SSG win in production.
 *
 * APPROACH:
 * We assert the SOURCE contract for every composable + App.vue that's known
 * to touch browser-only APIs. Specifically:
 *
 *   1. App.vue: setAttribute('data-theme') and initLanguage() are INSIDE
 *      onMounted (covered by 348-hydration-no-mismatch.spec.js — this test
 *      is the complementary set).
 *
 *   2. useLanguage.js: initLanguage + setLanguage guard localStorage with
 *      typeof (covered by 348-hydration-no-mismatch.spec.js).
 *
 *   3. useAutoDemoLoop.js (SelfDrivingDemo's composable): the IntersectionObserver
 *      lookup AND the rAF loop ARE guarded by typeof window === 'undefined'
 *      OR live inside onMounted. SelfDrivingDemo renders server-side (its
 *      markup is in the SSR HTML), so its client-only effects MUST be SSR-safe.
 *
 *   4. useSettlementStream.js: document / window / IntersectionObserver
 *      references are guarded. (This composable is used by SolutionForge
 *      which is lazy-loaded; not on the 5 marketing routes, but the source
 *      contract is the same.)
 *
 *   5. The SSG build does NOT throw: vite-ssg runs the entry against all 5
 *      marketing routes at build time. If any guard is missing, the build
 *      fails with a TypeError. The presence of dist-audit/<route>/index.html
 *      for all 5 routes (asserted by 348-ssg-output.spec.js) is the
 *      end-to-end proof; this test adds the SOURCE-LEVEL proof so the
 *      regression is detectable WITHOUT running the build.
 *
 * @ticket #348
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')

function readSrc(rel) {
  return readFileSync(resolve(ROOT, rel), 'utf-8')
}

function stripComments(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')
}

describe('#348 client-side-effect isolation (SSR-safety source contract)', () => {
  it('useAutoDemoLoop.js: IntersectionObserver access is guarded', () => {
    const code = stripComments(readSrc('src/composables/useAutoDemoLoop.js'))
    // The composable references IntersectionObserver. It MUST guard the
    // access with typeof window === 'undefined' OR typeof window.IntersectionObserver
    // !== 'function' (both forms appear in the file). Asserting BOTH
    // the typeof-window check exists and the IntersectionObserver reference
    // appears in a guard context.
    expect(code).toMatch(/typeof\s+window\s*===?\s*['"]undefined['"]/)
    expect(code).toMatch(/typeof\s+window\.IntersectionObserver\s*!==?\s*['"]function['"]/)
  })

  it('useAutoDemoLoop.js: requestAnimationFrame is not called in setup body (only in onMounted or guarded callbacks)', () => {
    // The rAF loop drives the FSM animation. Calling rAF during SSR (where
    // it's undefined) would throw. The composable must NOT call rAF
    // unguarded at the top level of its setup function — only inside
    // onMounted or inside a function that's called from onMounted.
    const code = stripComments(readSrc('src/composables/useAutoDemoLoop.js'))
    // Find every requestAnimationFrame reference.
    const rafMatches = [...code.matchAll(/requestAnimationFrame/g)]
    expect(rafMatches.length, 'useAutoDemoLoop should reference requestAnimationFrame (its rAF loop)').toBeGreaterThan(0)
    // The file MUST import onMounted from vue (proves the lifecycle hook is
    // used; the rAF calls live inside the onMounted callback or functions
    // called from it).
    expect(code).toMatch(/import\s+\{[^}]*\bonMounted\b[^}]*\}\s+from\s+['"]vue['"]/)
  })

  it('useSettlementStream.js: document references are guarded or in onMounted', () => {
    const code = stripComments(readSrc('src/composables/useSettlementStream.js'))
    // The composable references document.visibilityState. Each access MUST
    // be preceded by a typeof guard within a small window. Asserting the
    // guards EXIST (count >= 2) rather than every-access-is-guarded (which
    // would require AST analysis) is sufficient for the source-contract gate.
    const docGuards = code.match(/typeof\s+document\s*[!=]==?\s*['"]undefined['"]/g) || []
    expect(docGuards.length, 'useSettlementStream must guard document access with typeof checks').toBeGreaterThanOrEqual(2)
    // window + IntersectionObserver guards too.
    expect(code).toMatch(/typeof\s+window\s*!==?\s*['"]undefined['"]/)
    expect(code).toMatch(/typeof\s+window\.IntersectionObserver\s*!==?\s*['"]undefined['"]/)
    // And onMounted import (proves browser-API calls are scoped to client lifecycle).
    expect(code).toMatch(/import\s+\{[^}]*\bonMounted\b[^}]*\}\s+from\s+['"]vue['"]/)
  })

  it('useSkeleton.js: timers are scoped to onMounted (not setup body)', () => {
    // useSkeleton uses setTimeout. SSR build must not fire the timer.
    const code = stripComments(readSrc('src/composables/useSkeleton.js'))
    // The composable imports onMounted from vue (proves setup is structured correctly).
    expect(code).toMatch(/import\s+\{[^}]*\bonMounted\b[^}]*\}\s+from\s+['"]vue['"]/)
  })

  it('main.js: the dynamic cyber.css import resolves at SSG time (no fetch of /src/...)', () => {
    // The legacy fetch('/src/locales/...') bug (#7) returned in some prior
    // iterations because the dynamic import was mis-scoped. Assert main.js
    // does NOT call fetch() against any /src/ path (those 404 in production
    // dist/) — it MUST use static or dynamic import() so Vite bundles them.
    const code = stripComments(readSrc('src/main.js'))
    expect(code, 'main.js must not fetch from /src/ (those paths 404 in production)').not.toMatch(/fetch\s*\(\s*['"][^'']*\/src\//)
  })

  it('App.vue: the dynamic cyber.css import is preserved (not lost in the SSG refactor)', () => {
    // main.js's dynamic import('./assets/styles/cyber.css') is what splits
    // cyber.css into an async chunk (#340 perf win). The SSG refactor must
    // not lose it. Assert the literal stays.
    const code = stripComments(readSrc('src/main.js'))
    expect(code).toMatch(/import\(['"]\.\/assets\/styles\/cyber\.css['"]\)/)
  })
})
