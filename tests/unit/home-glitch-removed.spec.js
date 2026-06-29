/**
 * @file home-glitch-removed.spec.js
 * @description Visual-AC red test for #224 — the neon flicker / glitch animation
 * MUST be gone from Home.vue's CSS source.
 *
 * Why a source-level CSS test (iter 13/15): the glitch is a CSS-keyframe effect
 * applied via ::before/::after on .glitch-text. A DOM mount test cannot see CSS
 * rules — jsdom does not parse <style> blocks, and a removed keyframe leaves no
 * DOM trace. The only honest gate is to read Home.vue's source, strip /* *\/
 * comments (so a "deleted" effect commented out does not falsely pass), and
 * assert:
 *   1. there is no `@keyframes glitch` definition left, AND
 *   2. there is no `.glitch-text::before` / `.glitch-text::after` rule that
 *      references the `glitch` animation.
 *
 * RED-TEST PROOF: against the pre-#224 Home.vue both assertions FAIL — the file
 * defines `@keyframes glitch` AND wires `.glitch-text::before { animation:
 * glitch 0.3s infinite }`. After the #224 fix this test goes GREEN.
 *
 * @ticket #224
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const HOME_VUE = resolve(process.cwd(), 'src/views/Home.vue')
const ACCESSIBILITY_CSS = resolve(process.cwd(), 'src/styles/accessibility.css')

/** Strip /* ... *\/ block comments so a "deleted" effect commented out cannot
 * falsely satisfy the "no glitch" gate. (iter 13/15 CSS-source gate.) */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '')
}

describe('#224 Home glitch / flicker animation is removed', () => {
  const raw = readFileSync(HOME_VUE, 'utf-8')
  const source = stripComments(raw)

  it('Home.vue defines no @keyframes glitch', () => {
    // The strobing keyframe (0.3s infinite, 5-stop translate) is the flicker.
    // Removing it is the headline a11y AC of #224.
    expect(source).not.toMatch(/@keyframes\s+glitch\b/)
  })

  it('Home.vue wires no .glitch-text::before/::after glitch animation', () => {
    // Even if the keyframe were renamed, the ::before/::after rule referencing
    // `animation: glitch` is the actual flicker carrier. Catch it directly.
    expect(source).not.toMatch(
      /\.glitch-text::(?:before|after)[^{]*\{[^}]*animation:\s*glitch/,
    )
  })

  it('Home.vue no longer applies the glitch-text class to the h1 title', () => {
    // The class binding is what attaches the ::before/::after pseudo-elements.
    // Without the class, attr(data-text) has no consumer and the pseudos do not
    // render even if the CSS rule were accidentally left in place.
    const h1Block = source.match(/<h1[^>]*>/)
    expect(h1Block, 'Home.vue must still render an <h1>').not.toBeNull()
    expect(h1Block[0]).not.toMatch(/\bglitch-text\b/)
    expect(h1Block[0]).not.toMatch(/:data-text=/)
  })

  it('accessibility.css drops the now-dead .glitch-text reduced-motion override', () => {
    // The reduced-motion block had `.glitch-text::before, .glitch-text::after
    // { animation: none !important }` — once the glitch rule is deleted from
    // Home.vue this override targets nothing and is dead CSS. It must be
    // removed so a future reader does not think the glitch still exists.
    const css = stripComments(readFileSync(ACCESSIBILITY_CSS, 'utf-8'))
    expect(css).not.toMatch(/\.glitch-text::(?:before|after)/)
  })

  it('Home.vue KEEPS the calm animations (neonPulse 0.5Hz, gridMove 20s, pulse 10s, fadeInUp)', () => {
    // #224 only kills the FLICKER. The slow text-glow (neonPulse 2s alternate =
    // 0.5Hz, well under the 3Hz seizure threshold), the slow background pan
    // (gridMove 20s), the radial pulse (10s), and the one-shot card entrance
    // (fadeInUp) are all calm and stay.
    expect(source).toMatch(/@keyframes\s+neonPulse\b/)
    expect(source).toMatch(/@keyframes\s+gridMove\b/)
    expect(source).toMatch(/@keyframes\s+pulse\b/)
    expect(source).toMatch(/@keyframes\s+fadeInUp\b/)
  })
})
