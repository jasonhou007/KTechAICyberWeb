import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * #313 — Home above-the-fold rhythm tightening (source-text contract).
 *
 * The literal #265 AC1 ("entire Home fits @1920x1080 without scroll") is
 * geometrically impossible without breaking #203 AC1 (SelfDrivingDemo mounted
 * IN-FLOW as the first content block, also on About.vue). This follow-up
 * revises the AC and tightens the .whatwedo/.cta rhythm via clamp() so the
 * full eager flagship stack FLIPS from fail to pass @2560x1440 (was 128px
 * over, measured 2026-07-02) and continues to fit @3840x2160.
 *
 * These are SOURCE-TEXT assertions (read Home.vue / SelfDrivingDemo.vue /
 * variables.css as text, comments stripped) — the contract must hold in the
 * shipped CSS chunk itself, independent of any viewport a browser renders at.
 * The live-DOM measurement that proves the actual fit is the E2E spec
 * tests/e2e/313-home-above-fold.spec.ts (the source of truth for this visual AC).
 */

const ROOT = resolve(__dirname, '../..')

function readSource(rel) {
  const raw = readFileSync(resolve(ROOT, rel), 'utf8')
  // Strip /* ... */ comments so explanatory comments referencing old values
  // do not trip the "must NOT contain" / regex assertions.
  return raw.replace(/\/\*[\s\S]*?\*\//g, '')
}

/**
 * Pull the vh coefficient out of a clamp()'s middle arm, e.g.
 *   clamp(1rem, 2.5vh, 2rem) -> 2.5
 * Returns NaN if the middle arm is not a vh value.
 */
function clampVhMiddle(clampStr) {
  const match = clampStr.match(/clamp\(([^)]*)\)/)
  if (!match) return NaN
  const parts = match[1].split(',')
  if (parts.length < 3) return NaN
  const middle = parts[1].trim()
  const vh = middle.match(/^([\d.]+)vh$/)
  if (!vh) return NaN
  return parseFloat(vh[1])
}

/** Pull the lower-bound rem value out of clamp(a, b, c) -> a (in rem). */
function clampLowerRem(clampStr) {
  const match = clampStr.match(/clamp\(([^)]*)\)/)
  if (!match) return NaN
  const parts = match[1].split(',')
  if (parts.length < 3) return NaN
  return parseFloat(parts[0].trim())
}

describe('#313 Home above-the-fold rhythm tightening', () => {
  it('.section-title margin-bottom clamp vh arm tightened (was 2.5vh, now <=1.5vh)', () => {
    const vue = readSource('src/views/Home.vue')
    // Grab the .section-title rule block.
    const rule = vue.match(/\.section-title\s*\{[^}]*\}/)
    expect(rule, '.section-title rule must exist').not.toBeNull()
    const marginLine = rule[0].match(/margin-bottom:\s*(clamp\([^)]*\))/)
    expect(marginLine, '.section-title margin-bottom must be a clamp').not.toBeNull()
    const vh = clampVhMiddle(marginLine[1])
    expect(Number.isFinite(vh)).toBe(true)
    // Was 2.5vh; the tightening drops the middle arm to <=1.5vh so the title
    // compresses on shorter viewports (1vh = 14.4px @1440p => ~14px saved).
    expect(vh).toBeLessThanOrEqual(1.5)
  })

  it('.cyber-header padding clamp vh arm tightened (was 3vh, now <=2vh)', () => {
    const vue = readSource('src/views/Home.vue')
    // The FIRST .cyber-header rule carries the rhythm padding clamp.
    const rule = vue.match(/\.cyber-header\s*\{[^}]*\}/)
    expect(rule, '.cyber-header rule must exist').not.toBeNull()
    const paddingLine = rule[0].match(/padding:\s*(clamp\([^)]*\))/)
    expect(paddingLine, '.cyber-header padding must be a clamp').not.toBeNull()
    const vh = clampVhMiddle(paddingLine[1])
    expect(Number.isFinite(vh)).toBe(true)
    // Was 3vh; tightened to <=2vh (saves ~29px @1440p, top+bottom).
    expect(vh).toBeLessThanOrEqual(2)
  })

  it('.solution-card padding readability floor preserved (>=0.45rem)', () => {
    const vue = readSource('src/views/Home.vue')
    const rule = vue.match(/\.solution-card\s*\{[^}]*\}/)
    expect(rule, '.solution-card rule must exist').not.toBeNull()
    const paddingLine = rule[0].match(/padding:\s*(clamp\([^)]*\))/)
    expect(paddingLine, '.solution-card padding must be a clamp').not.toBeNull()
    const floor = clampLowerRem(paddingLine[1])
    expect(Number.isFinite(floor)).toBe(true)
    // iter-13 visual readability floor — must not regress.
    expect(floor).toBeGreaterThanOrEqual(0.45)
  })

  it('SelfDrivingDemo min-height clamp unchanged (#203 flagship untouched)', () => {
    const vue = readSource('src/components/SelfDrivingDemo.vue')
    const minHeightLine = vue.match(/min-height:\s*(clamp\([^)]*\))/)
    expect(minHeightLine, 'SelfDrivingDemo min-height must be a clamp').not.toBeNull()
    // The #203 flagship floor — must remain exactly clamp(280px, 38vh, 360px).
    expect(minHeightLine[1]).toBe('clamp(280px, 38vh, 360px)')
  })

  it('.whatwedo is eagerly rendered (NOT wrapped in <LazySection>)', () => {
    // Option 2 (lazy-mount .whatwedo) was REJECTED — it would hide the
    // solutions showcase on load. The template must keep the literal
    // <section class="whatwedo ..."> as a direct child of .content, NOT inside
    // a <LazySection>. Read the template region only (before <script setup>).
    const raw = readFileSync(resolve(ROOT, 'src/views/Home.vue'), 'utf8')
    const template = raw.slice(0, raw.indexOf('<script setup>'))
    // The eager <section class="whatwedo ..."> opening tag must be present.
    expect(template).toMatch(/<section\s+class="whatwedo/)
    // And it must NOT be preceded (within its containing block) by a LazySection
    // wrapper — assert the whatwedo section tag is not inside a LazySection by
    // confirming no LazySection opens between the .hero close and .whatwedo open.
    const heroEnd = template.lastIndexOf('</section>', template.indexOf('class="whatwedo'))
    const region = template.slice(heroEnd, template.indexOf('class="whatwedo'))
    expect(region).not.toContain('LazySection')
  })

  it('variables.css gains no NEW --home-* tokens (rhythm stays in Home.vue scoped styles)', () => {
    // Over-tokenization risk: rhythm margins live in Home.vue scoped styles,
    // not in variables.css, to avoid cross-page blast on About.vue. This ticket
    // must NOT add new --home-* tokens. We assert the count is unchanged from
    // the #265 baseline (7 tokens: h1, subtitle, section-title, section-gap,
    // card-title, card-body, group-label). [a-z0-9-] so --home-h1 (digit) matches.
    const css = readSource('src/assets/styles/variables.css')
    const matches = css.match(/--home-[a-z0-9-]+:/g) || []
    // De-duplicate (a token could be referenced in a comment, but comments are
    // already stripped; still dedupe to be safe).
    const unique = new Set(matches)
    expect(unique.size).toBe(7)
  })
})
