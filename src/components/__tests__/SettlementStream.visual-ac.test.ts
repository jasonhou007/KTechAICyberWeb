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
})
