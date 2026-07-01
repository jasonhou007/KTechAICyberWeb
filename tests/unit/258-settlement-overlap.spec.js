/**
 * @file 258-settlement-overlap.spec.js
 * @description CSS-source regression test for Issue #258 — SettlementStream
 *              readouts overlapping page content (the footer) on mobile.
 * @ticket #258
 *
 * Root cause (analysed in the planner's plan):
 *   `.ss-readouts` in SettlementStream.vue is `position:absolute; inset:0`
 *   spanning the whole `.settlement-stream-section`. That section (Home.vue)
 *   has only `min-height:320px` and NO fixed height. Because `.ss-readouts` is
 *   absolute, it does NOT contribute to the section's height, so the section
 *   collapses to 320px. On mobile (`@media max-width:768px`) `.ss-readouts`
 *   becomes a single stacked `1fr` column whose natural height exceeds 320px,
 *   so the stacked readouts bleed DOWNWARD past the section's 320px bottom
 *   edge and paint over `.cyber-footer` (App.vue, normal flow, no raised
 *   z-index). Additionally `.ss-bg` (rails) and `.ss-readouts` have NO declared
 *   z-index — they paint in DOM order by accident.
 *
 * The fix is surgical CSS only (no JS, no template):
 *   - SettlementStream.vue: `.ss-bg { z-index: 0 }`, `.ss-readouts { z-index: 1;
 *     overflow: hidden }`
 *   - Home.vue: `.settlement-stream-section { isolation: isolate; overflow:
 *     hidden }` + a mobile `min-height` override sized to the empirically
 *     measured stacked-readout natural height.
 *
 * Pattern mirrors style-unification.spec.js (#242) + font-consolidation.spec.js
 * (#188): read the source, strip comments (so a commented-out rule cannot
 * masquerade as active CSS), then assert the structural CSS invariants hold.
 *
 * RED-TEST PROOF: against origin/main (commit recorded in IMPLEMENTATION_SUMMARY)
 * every assertion below FAILS — neither z-index nor `overflow:hidden` nor
 * `isolation:isolate` nor the mobile min-height override exists yet.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const SETTLEMENT_STREAM = resolve(ROOT, 'src/components/SettlementStream.vue')
const HOME = resolve(ROOT, 'src/views/Home.vue')

/**
 * The mobile `.settlement-stream-section` min-height override, derived
 * EMPIRICALLY from the live Pixel 5 DOM (see IMPLEMENTATION_SUMMARY for the
 * measured stacked-readout natural height). Asserted here so a future edit
 * cannot silently drop the override. MUST match the value written in Home.vue.
 */
export const MOBILE_MIN_HEIGHT_PX = 480

/** Strip comments so a commented-out rule cannot masquerade as active CSS. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

/**
 * Extract a flat CSS rule body (the text between the selector's `{` and its
 * matching `}`). For these flat rules (no nested braces) `[^}]*` is sufficient,
 * BUT we still walk to the matching brace so a later `.ss-readouts:hover { ... }`
 * rule (which also matches the `\.ss-readouts\s*\{` prefix when naively grepped)
 * cannot false-pass. Returns the first matching rule body, or '' if not found.
 */
function ruleBody(src, selectorRegex) {
  const re = new RegExp(selectorRegex.source + /(\s*\{)([^}]*)\}/.source)
  const m = src.match(re)
  return m ? m[2] : ''
}

describe('#258 SettlementStream.vue — stacking + clip invariants', () => {
  const raw = readFileSync(SETTLEMENT_STREAM, 'utf-8')
  const styleBlock = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  const css = stripComments(styleBlock ? styleBlock[1] : raw)

  it('`.ss-bg` declares z-index: 0 (explicit background layer)', () => {
    const body = ruleBody(css, /\.ss-bg\b/)
    expect(body).toMatch(/z-index:\s*0\b/)
  })

  it('`.ss-readouts` declares z-index: 1 (above rails)', () => {
    const body = ruleBody(css, /\.ss-readouts\b/)
    expect(body).toMatch(/z-index:\s*1\b/)
  })

  it('`.ss-readouts` declares overflow: hidden (clip overflowing column)', () => {
    const body = ruleBody(css, /\.ss-readouts\b/)
    expect(body).toMatch(/overflow:\s*hidden\b/)
  })
})

describe('#258 Home.vue — section containment invariants', () => {
  const raw = readFileSync(HOME, 'utf-8')
  const styleBlock = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  const css = stripComments(styleBlock ? styleBlock[1] : raw)

  it('`.settlement-stream-section` declares isolation: isolate (fresh stacking context)', () => {
    const body = ruleBody(css, /\.settlement-stream-section\b/)
    expect(body).toMatch(/isolation:\s*isolate\b/)
  })

  it('`.settlement-stream-section` declares overflow: hidden (crop spillover)', () => {
    const body = ruleBody(css, /\.settlement-stream-section\b/)
    expect(body).toMatch(/overflow:\s*hidden\b/)
  })

  it(`mobile @media sets .settlement-stream-section min-height: ${MOBILE_MIN_HEIGHT_PX}px`, () => {
    // Extract the mobile @media block body via brace matching (the block
    // contains nested `{ ... }` rules, so a non-greedy `[^}]*` would stop at
    // the first inner rule's close brace and miss the min-height override).
    const mediaStart = css.indexOf('@media')
    const foundMedia = mediaStart !== -1
    let mediaBody = ''
    if (foundMedia) {
      let i = css.indexOf('{', mediaStart)
      let depth = 1
      i++
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth++
        else if (css[i] === '}') depth--
        if (depth > 0) mediaBody += css[i]
        i++
      }
    }
    expect(
      foundMedia,
      'a @media block exists in Home.vue scoped styles',
    ).toBe(true)
    expect(mediaBody).toMatch(
      new RegExp(
        `\\.settlement-stream-section\\b[^}]*min-height:\\s*${MOBILE_MIN_HEIGHT_PX}px`,
      ),
    )
  })
})
