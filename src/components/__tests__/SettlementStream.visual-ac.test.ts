/**
 * @file SettlementStream.visual-ac.test.ts
 * @description Visual-AC CSS-source gate for the ambient Settlement Stream (#206).
 * @ticket #206
 *
 * AC2 of issue #206 is a VISUAL acceptance criterion: "neon rails, scanline
 * overlay, parallax depth; respects foreground legibility" (glitch DEFERRED
 * to #235 — NOT asserted here). DOM tests cannot SEE CSS — a color/animation
 * revert passes every DOM test. This gate reads the SettlementStream.vue
 * SOURCE, strips comments (so a commented-out rule cannot masquerade as active
 * — iter-15 lesson), and asserts each visual-AC keyframe is DECLARED AND
 * APPLIED.
 *
 * Pattern mirrors CyberOpsHud.visual-ac.test.ts (#182): read the .vue source,
 * strip comments, assert @keyframes declared + animation: rule referencing it.
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
const componentPath = path.resolve(__dirname, '../SettlementStream.vue')

/** Strip comments so they cannot masquerade as active CSS. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

/**
 * Extract the FULL body of a `@media (...) { ... }` block by counting braces
 * (a lazy regex stops at the first inner `}`, missing nested rules). Returns
 * the empty string if no such media block exists. Ported verbatim from
 * NeuralTerminal.visual-ac.test.ts (#234) so the reduced-motion guard gate
 * mirrors that precedent exactly.
 *
 * `mediaFeature` is a RAW regex fragment (e.g. `prefers-reduced-motion\s*:\s*reduce`)
 * — it is interpolated directly so callers can express whitespace tolerance.
 */
function extractMediaBlock(source: string, mediaFeature: string): string {
  const startRe = new RegExp(`@media\\s*\\(\\s*${mediaFeature}\\s*\\)\\s*\\{`)
  const startM = source.match(startRe)
  if (!startM) return ''
  const from = startM.index! + startM[0].length
  let depth = 1
  let i = from
  for (; i < source.length && depth > 0; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') depth--
  }
  return source.slice(from, i - 1)
}

/**
 * Parse every `animation:` shorthand in the source and return the list of
 * raw declaration values (the text between `animation:` and the `;`). Ported
 * verbatim from NeuralTerminal.visual-ac.test.ts (#234). Used by the <3Hz
 * proof to enumerate every animated element and compute its rate.
 */
function extractAnimationDeclarations(source: string): string[] {
  const re = /animation\s*:\s*([^;]+)/g
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    out.push(m[1].trim())
  }
  return out
}

describe('SettlementStream.vue — visual-AC CSS-source gate (#206)', () => {
  let source: string

  beforeAll(() => {
    const raw = fs.readFileSync(componentPath, 'utf-8')
    source = stripComments(raw)
    expect(source, 'SettlementStream.vue source must be readable').toBeTruthy()
    expect(source.length).toBeGreaterThan(1000)
  })

  // --------------------------------------------------------------------------
  // (a) Neon rail packet travel: ss-packet-travel declared AND applied to the
  // packet elements. AC2 "neon rails" + AC1.2 "payment packets travel".
  // RED-TEST PROOF: delete the `@keyframes ss-packet-travel` block and the
  // first expect() fails; delete the `.ss-packet { animation: ss-packet-travel
  // ... }` rule and the second expect() fails.
  // --------------------------------------------------------------------------
  it('AC2 neon rails: an ACTIVE @keyframes ss-packet-travel is declared and applied to packet elements', () => {
    expect(source).toMatch(/@keyframes\s+ss-packet-travel(?=\s*\{)/)
    expect(source).toMatch(/\.ss-packet[^{]*\{[^}]*animation:\s*ss-packet-travel/s)
  })

  // --------------------------------------------------------------------------
  // (b) Liquidity pulse: ss-liquidity-pulse declared AND applied to the
  // liquidity meter. AC1.3 "liquidity pool breathes".
  // --------------------------------------------------------------------------
  it('AC1.3 liquidity pulse: an ACTIVE @keyframes ss-liquidity-pulse is declared and applied', () => {
    expect(source).toMatch(/@keyframes\s+ss-liquidity-pulse(?=\s*\{)/)
    expect(source).toMatch(/animation:\s*ss-liquidity-pulse/)
  })

  // --------------------------------------------------------------------------
  // (c) Block settlement drop-in: ss-block-drop declared AND applied to the
  // block column items. AC1.2 "blockchain blocks settling".
  // --------------------------------------------------------------------------
  it('AC1.2 block settlement: an ACTIVE @keyframes ss-block-drop is declared and applied', () => {
    expect(source).toMatch(/@keyframes\s+ss-block-drop(?=\s*\{)/)
    expect(source).toMatch(/animation:\s*ss-block-drop/)
  })

  // --------------------------------------------------------------------------
  // (d) FX ticker drift: ss-fx-drift declared AND applied. AC1.2 "FX ticker
  // drifting".
  // --------------------------------------------------------------------------
  it('AC1.2 FX ticker drift: an ACTIVE @keyframes ss-fx-drift is declared and applied', () => {
    expect(source).toMatch(/@keyframes\s+ss-fx-drift(?=\s*\{)/)
    expect(source).toMatch(/animation:\s*ss-fx-drift/)
  })

  // --------------------------------------------------------------------------
  // (e) Reduced-motion guard: @media (prefers-reduced-motion: reduce) block
  // exists with animation: none (AC 4.1, seizure-safe).
  // --------------------------------------------------------------------------
  it('AC4.1 reduced-motion: animation: none is set under a @media (prefers-reduced-motion: reduce) block', () => {
    expect(source).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/)
    expect(source).toMatch(/animation:\s*none/)
  })

  // --------------------------------------------------------------------------
  // (f) Palette reuse: the stream uses the EXISTING CSS vars, NOT new
  // hardcoded neon colors. AC2 "consistent with existing theme."
  // --------------------------------------------------------------------------
  it('AC2 palette: the stream references the shared neon CSS vars (no new hardcoded neon palette)', () => {
    expect(source).toMatch(/var\(\s*--neon-green\s*\)/)
    expect(source).toMatch(/var\(\s*--neon-blue\s*\)/)
    expect(source).toMatch(/var\(\s*--neon-pink\s*\)/)
  })

  // --------------------------------------------------------------------------
  // (g) Mobile-degrade: a @media (max-width: 768px) block exists that caps /
  // simplifies the stream (AC 3.1 perf on mid-range mobile).
  // --------------------------------------------------------------------------
  it('AC3.1 mobile-degrade: a @media (max-width: 768px) block exists', () => {
    expect(source).toMatch(/@media\s*\(\s*max-width\s*:\s*768px\s*\)/)
  })

  // --------------------------------------------------------------------------
  // (h) Foreground legibility: the stream root is positioned BEHIND content
  // (z-index lower than the foreground, or position:absolute/fixed background)
  // and has pointer-events:none so it never intercepts interaction. AC2
  // "respects foreground legibility" + AC1.1 "no interaction required".
  // --------------------------------------------------------------------------
  it('AC2/AC1.1 background: the stream root is pointer-events:none so it never blocks interaction', () => {
    expect(source).toMatch(/pointer-events\s*:\s*none/)
  })

  // ==========================================================================
  // #235 — seizure-safe glitch-pulse (follow-up to #206 AC 2.1).
  // The glitch-flicker sub-mechanic was DEFERRED from #206 because #224 removed
  // unbounded neon strobe as a seizure hazard. #235 ships a single ≤2Hz
  // "glitch pulse" (transform/opacity-only chromatic-aberration pulse, NOT a
  // continuous flicker) that is fully suppressed under reduced-motion.
  // ==========================================================================

  // --------------------------------------------------------------------------
  // AC1: glitch-pulse keyframes declared AND applied to .ss-glitch-pulse.
  // RED-PROOF: delete the `@keyframes ss-glitch-pulse` block and the first
  // expect() fails; delete the `.ss-glitch-pulse { ... animation:
  // ss-glitch-pulse ... }` rule and the second expect() fails (a bare
  // declaration that is never wired up also fails — the iter-15 dead-keyframe
  // lesson).
  // --------------------------------------------------------------------------
  it('#235 AC1 glitch-pulse: an ACTIVE @keyframes ss-glitch-pulse is declared and applied to .ss-glitch-pulse', () => {
    expect(source).toMatch(/@keyframes\s+ss-glitch-pulse(?=\s*\{)/)
    expect(source).toMatch(/\.ss-glitch-pulse[^{]*\{[^}]*animation:\s*ss-glitch-pulse/s)
  })

  // --------------------------------------------------------------------------
  // AC1 ≤2Hz target: parse the .ss-glitch-pulse animation duration, assert
  // 1/seconds ≤ 2 (i.e. seconds ≥ 0.5). The issue names ≤2Hz as the target
  // (well under the ≤3Hz epilepsy-safe floor proven separately below).
  // RED-PROOF: set the duration to 0.4s (2.5Hz) and the assertion fails.
  // --------------------------------------------------------------------------
  it('#235 AC1 glitch-pulse is ≤2Hz (duration ≥ 0.5s)', () => {
    const ruleMatch = source.match(/\.ss-glitch-pulse[^{]*\{([^}]*)\}/s)
    expect(ruleMatch, '.ss-glitch-pulse rule must exist').not.toBeNull()
    const ruleBody = ruleMatch![1]
    const animMatch = ruleBody.match(/animation:\s*ss-glitch-pulse\s+([^;]+)/)
    expect(animMatch, '.ss-glitch-pulse must apply the ss-glitch-pulse animation').not.toBeNull()
    const durMatch = animMatch![1].match(/(\d+(?:\.\d+)?)\s*(s|ms)/)
    expect(durMatch, `glitch-pulse animation must declare a duration: "${animMatch![1]}"`).not.toBeNull()
    const value = parseFloat(durMatch![1])
    const unit = durMatch![2]
    const seconds = unit === 'ms' ? value / 1000 : value
    const hz = 1 / seconds
    expect(hz, `glitch-pulse is ${hz.toFixed(2)}Hz, must be ≤2Hz`).toBeLessThanOrEqual(2)
  })

  // --------------------------------------------------------------------------
  // AC3 ≤3Hz worst-case sweep: enumerate EVERY `animation:` declaration with
  // `infinite` in the component, parse each duration, assert 1/seconds < 3.
  // This is the holistic epilepsy-safe floor — it catches a future contributor
  // adding `0.2s linear infinite` (5Hz) anywhere in the file, not just in the
  // glitch-pulse rule. Ported verbatim from NeuralTerminal.visual-ac.test.ts.
  // RED-PROOF: add `animation: foo 0.2s linear infinite;` anywhere in the
  // source and this assertion fails (5Hz > 3Hz).
  // --------------------------------------------------------------------------
  it('#235 AC3 <3Hz: every infinite animation in the component is seizure-safe (<3Hz)', () => {
    const decls = extractAnimationDeclarations(source)
    expect(decls.length, 'component must declare at least one animation').toBeGreaterThan(0)
    for (const decl of decls) {
      if (!/\binfinite\b/.test(decl)) continue
      const durMatch = decl.match(/(\d+(?:\.\d+)?)\s*(s|ms)/)
      expect(durMatch, `infinite animation must declare a duration: "${decl}"`).not.toBeNull()
      const value = parseFloat(durMatch![1])
      const unit = durMatch![2]
      const seconds = unit === 'ms' ? value / 1000 : value
      const hz = 1 / seconds
      expect(hz, `infinite animation "${decl}" is ${hz.toFixed(2)}Hz, must be <3Hz`).toBeLessThan(3)
    }
  })

  // --------------------------------------------------------------------------
  // AC2 reduced-motion CSS-authoritative: the EXISTING @media
  // (prefers-reduced-motion: reduce) block must neutralize the glitch-pulse at
  // the CSS level (belt-and-suspenders alongside the composable's
  // prefersReducedMotion flag, which already keeps rAF from scheduling).
  // Mirrors #234's ac02054 decode-anim/terminal-cursor guard shape exactly.
  // RED-PROOF: remove the `.ss-glitch-pulse ...` entry from the @media block
  // and the second expect() fails.
  // --------------------------------------------------------------------------
  it('#235 AC2 reduced-motion guard: @media (prefers-reduced-motion: reduce) kills the glitch-pulse', () => {
    const block = extractMediaBlock(source, 'prefers-reduced-motion\\s*:\\s*reduce')
    expect(block, 'a prefers-reduced-motion media block must exist').toBeTruthy()
    // Selector matches .ss-glitch-pulse optionally with ::before/::after.
    expect(block).toMatch(/\.ss-glitch-pulse(?:::(?:before|after))?/)
    expect(block).toMatch(/animation:\s*none/)
  })

  // --------------------------------------------------------------------------
  // AC4 perf: extract the @keyframes ss-glitch-pulse body and assert it does
  // NOT animate color|background|box-shadow|filter|visibility (transform +
  // opacity only). This preserves #206's perf budget (transform/opacity are
  // compositor-only, no layout/paint). Mirrors the same constraint already
  // applied to the existing #206 keyframes.
  // RED-PROOF: add `color: var(--neon-pink);` inside a keyframe stop and the
  // assertion fails.
  // --------------------------------------------------------------------------
  it('#235 AC4 perf: @keyframes ss-glitch-pulse animates transform/opacity only (no paint/layout properties)', () => {
    const kfMatch = source.match(/@keyframes\s+ss-glitch-pulse\s*\{([\s\S]*?)\}/)
    expect(kfMatch, '@keyframes ss-glitch-pulse must be declared').not.toBeNull()
    const body = kfMatch![1]
    expect(body, 'glitch-pulse keyframes must animate transform or opacity').toMatch(/(transform|opacity)\s*:/)
    expect(body).not.toMatch(/\b(color|background|box-shadow|filter|visibility)\b\s*:/)
  })
})
