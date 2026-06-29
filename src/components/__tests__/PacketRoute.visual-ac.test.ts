/**
 * @file PacketRoute.visual-ac.test.ts
 * @description Visual-AC CSS-source gate for the Packet Route puzzle (#184).
 * @ticket #184
 *
 * AC2 of issue #184 is a VISUAL acceptance criterion: "Neon grid + packet
 * trail + firewall obstacles + scanlines + glitch-on-win, consistent with
 * theme." DOM tests cannot SEE CSS — a color/animation revert passes every DOM
 * test. This gate reads the PacketRoute.vue SOURCE, strips comments (so a
 * commented-out rule cannot masquerade as an active one — iter-15 lesson), and
 * asserts each visual-AC keyframe is DECLARED AND APPLIED.
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
const componentPath = path.resolve(__dirname, '../PacketRoute.vue')

/** Strip comments so they cannot masquerade as active CSS. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

describe('PacketRoute.vue — visual-AC CSS-source gate (#184)', () => {
  let source: string

  beforeAll(() => {
    const raw = fs.readFileSync(componentPath, 'utf-8')
    source = stripComments(raw)
    expect(source, 'PacketRoute.vue source must be readable').toBeTruthy()
    expect(source.length).toBeGreaterThan(1000)
  })

  // --------------------------------------------------------------------------
  // (a) Scoped scanline strip: packet-scanline declared AND applied to
  // .packet-scanlines (the SCOPED strip, NOT the global Scanlines.vue).
  // RED-TEST PROOF: delete the `@keyframes packet-scanline { ... }` block and
  // the first expect() fails; delete the `.packet-scanlines { animation:
  // packet-scanline ... }` rule and the second expect() fails.
  // --------------------------------------------------------------------------
  it('AC2 scanlines: an ACTIVE @keyframes packet-scanline is declared and applied to the scoped .packet-scanlines strip', () => {
    expect(source).toMatch(/@keyframes\s+packet-scanline(?=\s*\{)/)
    expect(source).toMatch(/\.packet-scanlines[^{]*\{[^}]*animation:\s*packet-scanline/s)
  })

  // --------------------------------------------------------------------------
  // (b) Packet-travel glow: packet-orb-glow declared AND applied to the orb.
  // RED-TEST PROOF: delete the `@keyframes packet-orb-glow { ... }` block and
  // the first expect() fails; delete the `.packet-orb { animation:
  // packet-orb-glow ... }` rule and the second expect() fails.
  // --------------------------------------------------------------------------
  it('AC2 packet trail: an ACTIVE @keyframes packet-orb-glow is declared and applied to the .packet-orb', () => {
    expect(source).toMatch(/@keyframes\s+packet-orb-glow(?=\s*\{)/)
    expect(source).toMatch(/\.packet-orb[^{]*\{[^}]*animation:\s*packet-orb-glow/s)
  })

  // --------------------------------------------------------------------------
  // (c) Glitch-on-win: packet-glitch-win declared AND applied to the won
  // feedback text.
  // RED-TEST PROOF: delete the `@keyframes packet-glitch-win { ... }` block and
  // the first expect() fails; delete the `.feedback-won .feedback-text {
  // animation: packet-glitch-win ... }` rule and the second expect() fails.
  // --------------------------------------------------------------------------
  it('AC2 glitch-on-win: an ACTIVE @keyframes packet-glitch-win is declared and applied to .feedback-won .feedback-text', () => {
    expect(source).toMatch(/@keyframes\s+packet-glitch-win(?=\s*\{)/)
    expect(source).toMatch(/feedback-won[^{]*\.feedback-text[^{]*\{[^}]*animation:\s*packet-glitch-win/s)
  })

  // --------------------------------------------------------------------------
  // (d) Shake-on-lose: packet-shake declared AND applied to the lost feedback
  // text.
  // RED-TEST PROOF: delete the `@keyframes packet-shake { ... }` block and the
  // first expect() fails; delete the `.feedback-lost .feedback-text { animation:
  // packet-shake ... }` rule and the second expect() fails.
  // --------------------------------------------------------------------------
  it('AC2 shake-on-lose: an ACTIVE @keyframes packet-shake is declared and applied to .feedback-lost .feedback-text', () => {
    expect(source).toMatch(/@keyframes\s+packet-shake(?=\s*\{)/)
    expect(source).toMatch(/feedback-lost[^{]*\.feedback-text[^{]*\{[^}]*animation:\s*packet-shake/s)
  })

  // --------------------------------------------------------------------------
  // (e) Neon grid lines: the .packet-grid uses neon-green gradients as its
  // background (the "neon grid" AC). Assert the grid rule carries a neon-green
  // linear-gradient background.
  // RED-TEST PROOF: removing the linear-gradient(...) backgrounds from the
  // .packet-grid rule makes this fail — a plain solid background is not the
  // neon grid effect.
  // --------------------------------------------------------------------------
  it('AC2 neon grid: .packet-grid background declares neon-green linear-gradient grid lines', () => {
    const gridBlock = source.match(/\.packet-grid\s*\{([\s\S]*?)\n\}/)
    expect(gridBlock, '.packet-grid rule must exist').not.toBeNull()
    // The grid lines are neon-green. They may be expressed either as the
    // --neon-green CSS var OR as its literal RGB triple (0, 255, 136) inside an
    // rgba() (needed for the alpha channel — CSS vars cannot drive rgba alpha
    // without color-mix). Either form satisfies the "neon grid" AC.
    expect(gridBlock![1]).toMatch(/linear-gradient\([^)]*(--neon-green|0,\s*255,\s*136)/)
  })

  // --------------------------------------------------------------------------
  // (f) Firewall hazard styling: firewall cells carry a distinct hazard
  // background (neon-pink stripes). Assert .packet-tile.is-firewall has a
  // repeating-linear-gradient with neon-pink.
  // RED-TEST PROOF: removing the repeating-linear-gradient from the
  // .is-firewall rule makes this fail.
  // --------------------------------------------------------------------------
  it('AC2 firewall: .packet-tile.is-firewall declares a neon-pink repeating hazard background', () => {
    const fwBlock = source.match(/\.packet-tile\.is-firewall\s*\{([\s\S]*?)\n\}/)
    expect(fwBlock, '.is-firewall rule must exist').not.toBeNull()
    expect(fwBlock![1]).toMatch(/repeating-linear-gradient\([^)]*255,\s*0,\s*255|repeating-linear-gradient\([^)]*--neon-pink/)
  })

  // --------------------------------------------------------------------------
  // (g) Conduit glow: lit conduit segments carry a neon-green box-shadow (the
  // "glowing packet trail" AC at the tile level).
  // RED-TEST PROOF: removing the box-shadow from the .conduit rule makes this
  // fail — conduits would render flat, not glowing.
  // --------------------------------------------------------------------------
  it('AC2 conduit glow: .conduit declares a neon-green box-shadow', () => {
    const conduitBlock = source.match(/\.conduit\s*\{([\s\S]*?)\n\}/)
    expect(conduitBlock, '.conduit rule must exist').not.toBeNull()
    expect(conduitBlock![1]).toMatch(/box-shadow:[^;]*--neon-green/)
  })

  // --------------------------------------------------------------------------
  // (h) Reduced-motion kill switch: BOTH the .reduced-motion class guard AND
  // the prefers-reduced-motion media query assert animation: none (AC 3.2,
  // seizure-safe). At least one must be present as ACTIVE CSS.
  // RED-TEST PROOF: deleting both reduced-motion blocks makes this fail.
  // --------------------------------------------------------------------------
  it('AC3 reduced-motion: an ACTIVE animation:none guard exists for reduced motion', () => {
    const hasReducedClassGuard = /\.reduced-motion[^{]*\{[^}]*animation:\s*none\s*!important/s.test(source)
    const hasReducedMedia = /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?animation:\s*none\s*!important/s.test(source)
    expect(hasReducedClassGuard || hasReducedMedia, 'must have a reduced-motion animation:none guard').toBe(true)
  })
})
