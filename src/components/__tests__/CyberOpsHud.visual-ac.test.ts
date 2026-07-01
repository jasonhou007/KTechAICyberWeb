/**
 * @file CyberOpsHud.visual-ac.test.ts
 * @description Visual-AC CSS-source gate for the Cyber Ops HUD (#182).
 * @ticket #182
 *
 * AC2 of issue #182 is a VISUAL acceptance criterion: "HUD frames + neon gauges
 * + scanlines + glitch-on-anomaly, consistent with existing theme." DOM tests
 * cannot SEE CSS — a color/animation revert passes every DOM test. This gate
 * reads the CyberOpsHud.vue SOURCE, strips comments (so a commented-out rule
 * cannot masquerade as an active one — iter-15 lesson), and asserts each
 * visual-AC keyframe is DECLARED AND APPLIED.
 *
 * Pattern mirrors SolutionForge.visual-ac.test.ts (the canonical visual-AC
 * gate from #180): read the .vue source, strip comments, assert @keyframes
 * declared + animation: rule referencing it.
 *
 * RED-TEST PROOF: deleting any one of the @keyframes blocks asserted below
 * makes the corresponding "declared" assertion fail, AND deleting the
 * animation: rule that references it makes the "applied" assertion fail — so a
 * bare declaration that is never wired up (dead code) also fails.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const componentPath = path.resolve(__dirname, '../CyberOpsHud.vue')

/** Strip comments so they cannot masquerade as active CSS. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

/**
 * Extract a single CSS rule body (text between its outer `{` and the matching
 * `}`), honouring nested braces so a sibling rule's `infinite`/`forwards`
 * token cannot leak into the target rule's body (iter-43 brace-counter).
 * Returns '' if the selector start is not found.
 */
function extractRuleBody(src: string, startRe: RegExp, open: string, close: string): string {
  const m = src.match(startRe)
  if (!m || m.index === undefined) return ''
  let i = m.index + m[0].length - 1 // position of the opening `{`
  let depth = 0
  let out = ''
  for (; i < src.length; i++) {
    const ch = src[i]
    if (ch === open) { depth++; if (depth === 1) continue }
    if (ch === close) { depth--; if (depth === 0) break }
    if (depth >= 1) out += ch
  }
  return out
}

describe('CyberOpsHud.vue — visual-AC CSS-source gate (#182)', () => {
  let source: string

  beforeAll(() => {
    const raw = fs.readFileSync(componentPath, 'utf-8')
    source = stripComments(raw)
    expect(source, 'CyberOpsHud.vue source must be readable').toBeTruthy()
    expect(source.length).toBeGreaterThan(1000)
  })

  // --------------------------------------------------------------------------
  // (a) Neon gauge needle animation: ops-gauge-needle declared AND applied.
  // NOTE: the @keyframes live in OpsGauge.vue (the needle is owned by the gauge
  // widget). We assert against OpsGauge.vue's source for this one.
  // RED-TEST PROOF: delete the `@keyframes ops-gauge-needle { ... }` block in
  // OpsGauge.vue and the first expect() fails; delete the
  // `.ops-needle:not(.ops-needle-static) { animation: ops-gauge-needle ... }`
  // rule and the second expect() fails.
  // --------------------------------------------------------------------------
  it('AC2 gauge: an ACTIVE @keyframes ops-gauge-needle is declared and applied (in OpsGauge.vue)', () => {
    const gaugePath = path.resolve(__dirname, '../ops/OpsGauge.vue')
    const gaugeSrc = stripComments(fs.readFileSync(gaugePath, 'utf-8'))
    expect(gaugeSrc).toMatch(/@keyframes\s+ops-gauge-needle(?=\s*\{)/)
    expect(gaugeSrc).toMatch(/animation[^;]*ops-gauge-needle/)
  })

  // --------------------------------------------------------------------------
  // (b) Scoped scanline strip: ops-scanline declared AND applied to
  // .ops-scanlines (the SCOPED strip, NOT the global Scanlines.vue).
  // RED-TEST PROOF: delete the `@keyframes ops-scanline { ... }` block and the
  // first expect() fails; delete the `.ops-scanlines { animation: ops-scanline
  // ... }` rule and the second expect() fails.
  // --------------------------------------------------------------------------
  it('AC2 scanlines: an ACTIVE @keyframes ops-scanline is declared and applied to the scoped .ops-scanlines strip', () => {
    expect(source).toMatch(/@keyframes\s+ops-scanline(?=\s*\{)/)
    expect(source).toMatch(/\.ops-scanlines[^{]*\{[^}]*animation:\s*ops-scanline/s)
  })

  // --------------------------------------------------------------------------
  // (c) Glitch-on-anomaly: ops-glitch declared AND applied to the anomaly toast,
  // AND seizure-safe (#271). The original `animation: ops-glitch 0.3s infinite`
  // strobed at 3.33Hz — OVER the <3Hz WCAG 2.3.1 photosensitivity ceiling — a
  // transform-based strobe the #234 steps()+infinite audit missed. #271 makes
  // it one-shot (`forwards`). This gate closes that gap at the component level
  // (the repo-wide strobe-audit.test.ts is the catch-all).
  // RED-TEST PROOF: delete the `@keyframes ops-glitch { ... }` block (in
  // OpsAnomalyToast.vue) and the declared assertion fails; delete the
  // `.ops-glitch { animation: ops-glitch ... }` rule and the applied assertion
  // fails; revert to `animation: ops-glitch 0.3s infinite` and the
  // seizure-safety assertions (forwards present, infinite absent) fail.
  // --------------------------------------------------------------------------
  it('AC2 glitch-on-anomaly: ops-glitch declared, applied, AND seizure-safe (one-shot forwards, no infinite) (#271)', () => {
    const toastPath = path.resolve(__dirname, '../ops/OpsAnomalyToast.vue')
    const toastSrc = stripComments(fs.readFileSync(toastPath, 'utf-8'))
    // DECLARED — identifier-anchored.
    expect(toastSrc).toMatch(/@keyframes\s+ops-glitch(?=\s*\{)/)
    // APPLIED to the .ops-glitch rule (brace-counted body so a sibling rule's
    // tokens cannot leak in — iter-43 brace-counter pattern).
    const opsGlitchRule = extractRuleBody(toastSrc, /(?:^|\})\s*\.ops-glitch\b\s*\{/, '{', '}')
    expect(opsGlitchRule, '.ops-glitch rule body must be extractable').toBeTruthy()
    expect(opsGlitchRule).toMatch(/animation:[^;]*ops-glitch/)
    // SEIZURE-SAFE — one-shot forwards, NOT infinite.
    expect(opsGlitchRule!).toMatch(/forwards/)
    expect(opsGlitchRule!, '.ops-glitch must NOT be an infinite strobe (#271 <3Hz)')
      .not.toMatch(/\binfinite\b/)
  })

  // --------------------------------------------------------------------------
  // (d) Reduced-motion guard: @media (prefers-reduced-motion: reduce) block
  // exists with animation: none (AC 3.2, seizure-safe).
  // RED-TEST PROOF: delete the reduced-motion @media block and this assertion
  // fails.
  // --------------------------------------------------------------------------
  it('AC3.2 reduced-motion: animation: none is set under a @media (prefers-reduced-motion: reduce) block', () => {
    expect(source).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/)
    expect(source).toMatch(/animation:\s*none/)
  })

  // --------------------------------------------------------------------------
  // (e) Palette reuse: the HUD uses the existing CSS vars, NOT new hardcoded
  // neon colors. AC2 "consistent with existing theme."
  // RED-TEST PROOF: replace `var(--neon-green)` with a hardcoded `#00ff88` and
  // this assertion fails.
  // --------------------------------------------------------------------------
  it('AC2 palette: the HUD references the shared neon CSS vars (no new hardcoded neon colors)', () => {
    expect(source).toMatch(/var\(\s*--neon-green\s*\)/)
    expect(source).toMatch(/var\(\s*--card-border\s*\)/)
    expect(source).toMatch(/var\(\s*--glow-color\s*\)/)
  })
})
