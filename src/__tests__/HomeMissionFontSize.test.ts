/**
 * @file HomeMissionFontSize.test.ts
 * @description VISUAL-AC CSS-SOURCE GATE for #355 — mission statement font size.
 * @ticket #355
 *
 * WHY THIS TEST EXISTS (iter-13/15/42/43 visual-AC lesson):
 * The mission statement ("Determined to Become a Leading Fintech Company in
 * China ASEAN Region") is rendered in the <h1> on Home.vue, sized via the
 * --home-h1 CSS token in variables.css. DOM structure tests CANNOT see CSS —
 * silently reverting the font-size reduction (or any future regression that
 * restores the old larger clamp) would PASS every existing Home.test.ts
 * assertion while shipping the visual bug the user filed #355 to fix.
 *
 * This gate reads the AUTHORITY CSS sources (variables.css for the token
 * definition, Home.vue for the consumer rule) and asserts:
 *  1. --home-h1 is reduced to ~2/3 of its pre-#355 value
 *     (was clamp(2rem, 4.5vw, 3.25rem) -> ~clamp(1.33rem, 3vw, 2.17rem)).
 *  2. The Home.vue h1 rule still consumes var(--home-h1) (wiring intact).
 *  3. The reduction is scoped to --home-h1 ONLY — the other Home typography
 *     tokens (--home-subtitle, --home-section-title, --home-card-*,
 *     --home-group-label) are UNCHANGED so the rest of the page rhythm set
 *     by #265/#313 is preserved.
 *
 * RED-TEST PROOF (per the iter-13 gate, performed 2026-07-07):
 *  - Restored the pre-#355 token `--home-h1: clamp(2rem, 4.5vw, 3.25rem)` ->
 *    the "upper bound ~2/3" and "vw middle ~2/3" assertions FAILED (regex no
 *    longer matched). Restored the reduced value -> PASSED.
 *  - Both reduction assertions (lower, middle, upper) independently catch a
 *    partial revert (only the clamp middle changed, etc.).
 *
 * The committed values are the reduced ones; nothing is left reverted.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const variablesCss = readFileSync(
  resolve(process.cwd(), 'src', 'assets', 'styles', 'variables.css'),
  'utf-8',
)

const homeVue = readFileSync(
  resolve(process.cwd(), 'src', 'views', 'Home.vue'),
  'utf-8',
)

describe('#355 — mission statement font size reduced to ~66% (visual-AC gate)', () => {
  // Helper: extract the --home-h1 declaration line from variables.css.
  // Strips CSS comments first so a commented-out rule cannot pass (iter-15 lesson).
  const strippedComments = variablesCss.replace(/\/\*[\s\S]*?\*\//g, '')
  const homeH1Decl = strippedComments.match(/--home-h1:\s*([^;]+);/)
  const homeH1Value = homeH1Decl ? homeH1Decl[1].trim() : ''

  it('--home-h1 token is defined in variables.css as ACTIVE CSS', () => {
    // Fails if the token is deleted OR only present inside a /* comment */.
    expect(homeH1Decl, '--home-h1 must be defined as active CSS').not.toBeNull()
    expect(homeH1Value.length).toBeGreaterThan(0)
  })

  it('--home-h1 uses a clamp() with three terms (responsive structure preserved)', () => {
    // The pre-#355 structure was clamp(MIN, VW, MAX). The reduction keeps that
    // structure (only the numeric values change) so responsive behavior survives.
    expect(homeH1Value).toMatch(/^clamp\(/)
    const terms = homeH1Value.match(/clamp\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/)
    expect(terms, 'clamp() must have exactly 3 terms').not.toBeNull()
    expect(terms![1].trim()).toMatch(/rem$/)
    expect(terms![2].trim()).toMatch(/vw$/)
    expect(terms![3].trim()).toMatch(/rem$/)
  })

  it('lower bound is reduced to ~2/3 of the pre-#355 2rem floor (>=1.2rem & <=1.5rem)', () => {
    // 2/3 * 2rem = 1.333rem. Allow a small tolerance band [1.2, 1.5] that
    // catches both the exact 2/3 (1.33) and any reasonable round (1.3 / 1.4)
    // while REJECTING the pre-#355 2rem value.
    const terms = homeH1Value.match(/clamp\(\s*([^,]+),/)
    const lower = parseFloat(terms![1])
    expect(lower).toBeGreaterThanOrEqual(1.2)
    expect(lower).toBeLessThanOrEqual(1.5)
    // Hard-reject the pre-#355 value.
    expect(lower).not.toBe(2)
  })

  it('vw middle is reduced to ~2/3 of the pre-#355 4.5vw (>=2.5vw & <=3.5vw)', () => {
    // 2/3 * 4.5vw = 3vw. Allow [2.5, 3.5]; reject 4.5.
    const terms = homeH1Value.match(/clamp\([^,]+,\s*([^,]+),/)
    const middle = parseFloat(terms![1])
    expect(middle).toBeGreaterThanOrEqual(2.5)
    expect(middle).toBeLessThanOrEqual(3.5)
    expect(middle).not.toBe(4.5)
  })

  it('upper bound is reduced to ~2/3 of the pre-#355 3.25rem cap (>=1.9rem & <=2.4rem)', () => {
    // 2/3 * 3.25rem = 2.167rem. Allow [1.9, 2.4]; reject 3.25.
    const terms = homeH1Value.match(/clamp\([^,]+,[^,]+,\s*([^)]+)\)/)
    const upper = parseFloat(terms![1])
    expect(upper).toBeGreaterThanOrEqual(1.9)
    expect(upper).toBeLessThanOrEqual(2.4)
    expect(upper).not.toBe(3.25)
  })

  it('Home.vue h1 rule still consumes var(--home-h1) (wiring intact)', () => {
    // The consumer rule must keep reading the token. A hardcoded font-size on
    // h1 would break the responsive contract.
    // Strip comments so a commented-out rule cannot satisfy this.
    const stripped = homeVue.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '')
    const h1Block = stripped.match(/(^|\n)\s*h1\s*\{([^}]*)\}/)
    expect(h1Block, 'Home.vue must have an h1 rule').not.toBeNull()
    expect(h1Block![2]).toMatch(/font-size:\s*var\(--home-h1\)/)
  })

  it('reduction is scoped to --home-h1 ONLY — other Home typography tokens unchanged', () => {
    // iter-25 visible-delta lesson: changing a shared value is a VISIBLE change.
    // --home-h1 is consumed ONLY by the mission h1, but the sibling Home tokens
    // drive other elements (subtitle, section titles, cards, group labels).
    // Assert they keep their pre-#355 values so the rest of the page rhythm
    // (#265 / #313) is preserved.
    expect(strippedComments).toMatch(/--home-subtitle:\s*clamp\(1rem,\s*1\.6vw,\s*1\.2rem\)/)
    expect(strippedComments).toMatch(/--home-section-title:\s*clamp\(1\.4rem,\s*2\.2vw,\s*1\.75rem\)/)
    expect(strippedComments).toMatch(/--home-card-title:\s*clamp\(0\.85rem,\s*1vw,\s*1rem\)/)
    expect(strippedComments).toMatch(/--home-card-body:\s*clamp\(0\.78rem,\s*0\.85vw,\s*0\.9rem\)/)
    expect(strippedComments).toMatch(/--home-group-label:\s*clamp\(0\.9rem,\s*1\.2vw,\s*1\.1rem\)/)
  })
})
