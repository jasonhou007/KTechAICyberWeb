// tests/unit/346-perf-mobile-gate-retightened.spec.js
//
// Gate test for #346 commit 4 (post-revert honest-partial re-tightening),
// reconciled post-#348 (SSG closed the architectural LCP floor).
//
// AC#3 of #346 says: "Re-tighten lighthouserc.mobile.cjs assertions for
// largest-contentful-paint AND categories:performance from warn back to error
// once #1+#2 hold."
//
// Post-#346 measurement (the deferred state):
//   - AC#1 (LCP <2500ms on /about,/contact,/news) — NOT MET. Architectural
//     floor (~2800ms) existed even on the witness /services route (2767ms);
//     bottleneck was SPA hydration on 4G throttling, not route-specific.
//   - AC#2 (/about score >=90) — MET (92, up from baseline 84).
//
// #346 honest-partial re-tightening decision (held the met-AC at error;
// kept the un-met-AC at warn):
//   - categories:performance   warn -> error  (AC#2 met)
//   - largest-contentful-paint STAYS warn     (AC#1 not met; tracked by #348)
//   - interactive (TTI)        STAYS warn     (out of AC#3 scope)
//   - total-blocking-time      STAYS error    (unchanged)
//   - cumulative-layout-shift  STAYS error    (unchanged)
//
// #348 UPDATE (reconcile): #348 closed the architectural floor via build-time
// SSG (vite-ssg). Post-#348 mobile capture (preset=perf, formFactor asserted
// mobile, arm64 node, single run):
//   route        LCP     score
//   /about       1987ms   97    <- was 2894ms / 92
//   /contact     1447ms  100    <- was 2861ms / 93
//   /news        1975ms   93    <- was 3479ms / 88
//   / (witness)  1436ms  100    <- was 2254ms / 96
//   /services    1960ms   97    <- was 2767ms / 94  (witness, closed)
// ALL 5 routes <2500ms with >=513ms headroom. The deferred-AC#1 hold is no
// longer correct — largest-contentful-paint moves warn -> error, completing
// #346's AC#3. The other assertions are unchanged:
//   - categories:performance   STAYS error (AC#2 still met)
//   - interactive (TTI)        STAYS warn  (still out of scope)
//   - total-blocking-time      STAYS error
//   - cumulative-layout-shift  STAYS error
//
// This test reads lighthouserc.mobile.cjs source, strips comments, and asserts
// the final assert block matches the post-#348 reconciled state.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const cfgPath = resolve(process.cwd(), 'lighthouserc.mobile.cjs')
const source = readFileSync(cfgPath, 'utf8')

// Strip /* block */ comments, // line comments, and trailing line-comment
// content so assertions match the CODE, not the comments.
function stripComments(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s+\/\/.*$/g, '')
}

const code = stripComments(source)

describe('#346 mobile-gate re-tightening (reconciled post-#348)', () => {
  it('keeps categories:performance at error (AC#2 met, set in #346)', () => {
    // Must match the literal `['error', { minScore: 0.9 }]` form, not warn.
    expect(code).toMatch(
      /['"]categories:performance['"]:\s*\[\s*['"]error['"]\s*,\s*\{\s*minScore:\s*0\.9\s*\}\s*\]/
    )
    // And must NOT be warn.
    expect(code).not.toMatch(
      /['"]categories:performance['"]:\s*\[\s*['"]warn['"]/
    )
  })

  it('re-tightens largest-contentful-paint warn -> error post-#348 (AC#1 closed)', () => {
    // #348 closed the architectural floor — all 5 routes pass with >=513ms
    // headroom (slowest = /about at 1987ms). The deferred-AC#1 hold from #346
    // is no longer correct; the gate moves to error to complete #346's AC#3.
    expect(code).toMatch(
      /['"]largest-contentful-paint['"]:\s*\[\s*['"]error['"]\s*,\s*\{\s*maxNumericValue:\s*2500\s*\}\s*\]/
    )
    // And must NOT still be warn.
    expect(code).not.toMatch(
      /['"]largest-contentful-paint['"]:\s*\[\s*['"]warn['"]/
    )
  })

  it('keeps interactive (TTI) at warn (out of AC#3 scope)', () => {
    expect(code).toMatch(
      /['"]interactive['"]:\s*\[\s*['"]warn['"]\s*,\s*\{\s*maxNumericValue:\s*3800\s*\}\s*\]/
    )
  })

  it('keeps total-blocking-time at error (unchanged)', () => {
    expect(code).toMatch(
      /['"]total-blocking-time['"]:\s*\[\s*['"]error['"]\s*,\s*\{\s*maxNumericValue:\s*200\s*\}\s*\]/
    )
  })

  it('keeps cumulative-layout-shift at error (unchanged)', () => {
    expect(code).toMatch(
      /['"]cumulative-layout-shift['"]:\s*\[\s*['"]error['"]\s*,\s*\{\s*maxNumericValue:\s*0\.1\s*\}\s*\]/
    )
  })

  it('comment block references #348 (the SSG follow-up that closed the floor)', () => {
    // The full source (comments included) must reference the follow-up issue
    // number so the deferred-AC -> closed-AC trail is discoverable from the
    // config itself.
    expect(source).toContain('#348')
  })

  it('comment block cites the post-#346 architectural-floor evidence (2767ms witness)', () => {
    // The historical justification for WHY #346 deferred LCP must remain in
    // the comments — the witness /services 2767ms LCP — so future readers see
    // the architectural-floor diagnosis that #348 later disproved by closing.
    expect(source).toMatch(/2767/)
    expect(source).toMatch(/2894|2861|3479/)
  })

  it('comment block cites the post-#348 measured numbers (floor-closed evidence)', () => {
    // The reconciliation justification must cite the post-#348 numbers so the
    // warn -> error move is auditable against measured evidence, not a guessed
    // threshold relaxation.
    expect(source).toMatch(/1987|1447|1975|1436|1960/)
  })
})
