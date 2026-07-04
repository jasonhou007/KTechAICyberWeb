// tests/unit/346-perf-mobile-gate-retightened.spec.js
//
// Gate test for #346 commit 4 (post-revert honest-partial re-tightening).
//
// AC#3 of #346 says: "Re-tighten lighthouserc.mobile.cjs assertions for
// largest-contentful-paint AND categories:performance from warn back to error
// once #1+#2 hold."
//
// Post-#346 measurement:
//   - AC#1 (LCP <2500ms on /about,/contact,/news) — NOT MET. Architectural
//     floor (~2800ms) exists even on the witness /services route (2767ms);
//     bottleneck is SPA hydration on 4G throttling, not route-specific.
//   - AC#2 (/about score >=90) — MET (92, up from baseline 84). All 3 AC
//     routes now score >=88 with /about at 92.
//
// Honest-partial re-tightening decision (do NOT auto-fail CI on an
// architectural floor; do hold the met-AC going forward):
//   - categories:performance   warn -> error  (AC#2 met; #348 covers LCP)
//   - largest-contentful-paint STAYS warn     (AC#1 not met; tracked by #348)
//   - interactive (TTI)        STAYS warn     (out of AC#3 scope)
//   - total-blocking-time      STAYS error    (unchanged)
//   - cumulative-layout-shift  STAYS error    (unchanged)
//
// This test reads lighthouserc.mobile.cjs source, strips comments, and asserts
// the final assert block matches this honest-partial re-tightened state.

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

describe('#346 mobile-gate honest-partial re-tightening (commit 4, post-revert)', () => {
  it('re-tightens categories:performance from warn to error (AC#2 met)', () => {
    // Must match the literal `['error', { minScore: 0.9 }]` form, not warn.
    expect(code).toMatch(
      /['"]categories:performance['"]:\s*\[\s*['"]error['"]\s*,\s*\{\s*minScore:\s*0\.9\s*\}\s*\]/
    )
    // And must NOT still be warn.
    expect(code).not.toMatch(
      /['"]categories:performance['"]:\s*\[\s*['"]warn['"]/
    )
  })

  it('keeps largest-contentful-paint at warn (AC#1 not met; tracked by follow-up #348)', () => {
    expect(code).toMatch(
      /['"]largest-contentful-paint['"]:\s*\[\s*['"]warn['"]\s*,\s*\{\s*maxNumericValue:\s*2500\s*\}\s*\]/
    )
    // And must NOT have been re-tightened to error.
    expect(code).not.toMatch(
      /['"]largest-contentful-paint['"]:\s*\[\s*['"]error['"]/
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

  it('comment block references follow-up issue #348', () => {
    // The full source (comments included) must reference the follow-up issue
    // number so the deferred-AC trail is discoverable from the config itself.
    expect(source).toContain('#348')
  })

  it('comment block cites the post-#346 measured numbers (LCP floor evidence)', () => {
    // The honest-partial justification must cite the architectural-floor
    // evidence (witness /services LCP) so future readers see WHY LCP stays
    // warn while performance moved to error.
    expect(source).toMatch(/2767/)
    expect(source).toMatch(/2894|2861|3479/)
  })
})
