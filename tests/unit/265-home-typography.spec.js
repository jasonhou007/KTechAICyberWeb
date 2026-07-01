import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * #265 — Home typography tokenization + single-screen-fit source contract.
 *
 * These are SOURCE-TEXT assertions (we read the .css/.vue files as text and
 * strip comments before asserting). They prove the #265 refactor:
 *   1. variables.css declares the new Home typography tokens.
 *   2. Home.vue h1 consumes --home-h1 (NOT the old literal clamp(2.5rem, 6vw, 5rem)).
 *   3. The token hierarchy is sound: h1 max >= 1.5 * section-title max, and
 *      section-title max >= 1.5 * body max (a real visual hierarchy, not a
 *      flat shuffle that just renamed values).
 *   4. SelfDrivingDemo no longer pins a literal 420px min-height — it clamps.
 *
 * Source-text (not computed-style) because these contracts must hold in the
 * shipped CSS chunk itself, independent of any viewport a browser happens to
 * render at.
 */

const ROOT = resolve(__dirname, '../..')

function readSource(rel) {
  const raw = readFileSync(resolve(ROOT, rel), 'utf8')
  // Strip /* ... */ CSS/Vue comments so commented-out old values don't trip
  // the "must NOT contain" assertions (e.g. the old clamp(2.5rem, 6vw, 5rem)
  // lives on as an explanatory comment in Home.vue after the refactor).
  return raw.replace(/\/\*[\s\S]*?\*\//g, '')
}

function clampUpper(clampStr) {
  // Pull the third comma-separated arg out of `clamp(a, b, c)` and parse it
  // as a rem number. Ratios are unit-agnostic (1rem == 16px everywhere here).
  const match = clampStr.match(/clamp\([^)]*\)/)
  if (!match) return NaN
  const parts = match[0].split(',')
  if (parts.length < 3) return NaN
  return parseFloat(parts[2].trim())
}

describe('#265 Home typography tokens', () => {
  it('variables.css declares all three Home typography tokens', () => {
    const css = readSource('src/assets/styles/variables.css')
    expect(css).toContain('--home-h1:')
    expect(css).toContain('--home-subtitle:')
    expect(css).toContain('--home-section-title:')
  })

  it('Home.vue h1 consumes --home-h1 (old literal clamp gone)', () => {
    const vue = readSource('src/views/Home.vue')
    // The h1 rule must reference the token.
    expect(vue).toContain('var(--home-h1)')
    // The old literal must NOT survive into the active rule (comment-stripped).
    expect(vue).not.toContain('clamp(2.5rem, 6vw, 5rem)')
  })

  it('token hierarchy: h1-max >= 1.5 * section-title-max >= 1.5 * body-max', () => {
    const css = readSource('src/assets/styles/variables.css')
    // Extract each token's clamp() value.
    const h1Line = css.match(/--home-h1:\s*(clamp\([^)]*\));/)
    const sectionLine = css.match(/--home-section-title:\s*(clamp\([^)]*\));/)
    expect(h1Line).not.toBeNull()
    expect(sectionLine).not.toBeNull()

    const h1Max = clampUpper(h1Line[1])
    const sectionMax = clampUpper(sectionLine[1])
    expect(Number.isFinite(h1Max)).toBe(true)
    expect(Number.isFinite(sectionMax)).toBe(true)

    // h1 (3.25rem) must be at least 1.5x the section title (1.75rem).
    expect(h1Max).toBeGreaterThanOrEqual(sectionMax * 1.5)

    // Body max is 1.05rem (the hero card <p> upper bound). Section title
    // (1.75rem) must be at least 1.5x body — the same hierarchy the old site
    // had, just compressed.
    const bodyMax = 1.05
    expect(sectionMax).toBeGreaterThanOrEqual(bodyMax * 1.5)
  })
})

describe('#265 SelfDrivingDemo height clamped', () => {
  it('.self-driving-demo min-height uses clamp (literal 420px gone)', () => {
    const vue = readSource('src/components/SelfDrivingDemo.vue')
    // The active min-height must be a clamp, not the old literal.
    const minHeightLine = vue.match(/min-height:\s*([^;]+);/)
    expect(minHeightLine).not.toBeNull()
    expect(minHeightLine[1]).toContain('clamp(')
    // The old literal must not survive into the active rule.
    expect(vue).not.toContain('min-height: 420px')
  })
})
