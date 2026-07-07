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

  it('token hierarchy: h1-max > section-title-max >= 1.5 * body-max', () => {
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

    // #355 demoted the mission h1 to ~2/3 of its #265 value (was 3.25rem ->
    // 2.17rem). The h1 must still read as the page's primary heading, so it
    // stays strictly larger than the section title — but the old 1.5x ratio
    // no longer holds by design (the user filed #355 specifically to shrink
    // the mission statement). Assert h1-max > section-title-max preserves the
    // visual hierarchy intent ("not a flat shuffle") without re-imposing the
    // superseded 1.5x multiplier.
    expect(h1Max).toBeGreaterThan(sectionMax)

    // Body max is 1.05rem (the hero card <p> upper bound). Section title
    // (1.75rem) must be at least 1.5x body — the same hierarchy the old site
    // had, just compressed. (#355 did not touch body or section-title sizing.)
    const bodyMax = 1.05
    expect(sectionMax).toBeGreaterThanOrEqual(bodyMax * 1.5)
  })
})

describe('#265 Home card tokens (review AC#1 — .whatwedo fit)', () => {
  // #265 review(AC#1): the .whatwedo rhythm (6 solution cards) was tokenized
  // so the full flagship stack compresses on 1080p. These prove the new tokens
  // exist, have readability floors, and keep a sane hierarchy (card title >
  // card body; group label > card title — labels head groups of cards).
  it('variables.css declares the card + group-label tokens', () => {
    const css = readSource('src/assets/styles/variables.css')
    expect(css).toContain('--home-card-title:')
    expect(css).toContain('--home-card-body:')
    expect(css).toContain('--home-group-label:')
  })

  it('Home.vue .solution-card consumes the card tokens (old literals gone)', () => {
    const vue = readSource('src/views/Home.vue')
    expect(vue).toContain('var(--home-card-title)')
    expect(vue).toContain('var(--home-card-body)')
    expect(vue).toContain('var(--home-group-label)')
    // The old literal card font-sizes must NOT survive (comment-stripped).
    expect(vue).not.toMatch(/\.solution-card h4[^}]*font-size:\s*1\.1rem/)
    expect(vue).not.toMatch(/\.solution-card p[^}]*font-size:\s*0\.95rem/)
  })

  it('card body readability floor >= 0.78rem', () => {
    const css = readSource('src/assets/styles/variables.css')
    const bodyLine = css.match(/--home-card-body:\s*clamp\(([^)]*)\)/)
    expect(bodyLine).not.toBeNull()
    const floor = parseFloat(bodyLine[1].split(',')[0].trim())
    // 0.78rem is the readability floor agreed in the #265 review — anything
    // smaller crushes the solution-card descriptions below legibility.
    expect(floor).toBeGreaterThanOrEqual(0.78)
  })

  it('token hierarchy: group-label >= card-title >= card-body', () => {
    const css = readSource('src/assets/styles/variables.css')
    const upperOf = (token) => {
      const m = css.match(new RegExp(`--${token}:\\s*clamp\\([^)]*\\)`))
      if (!m) return NaN
      const parts = m[0].split(',')
      return parseFloat(parts[parts.length - 1].trim())
    }
    const group = upperOf('home-group-label')
    const title = upperOf('home-card-title')
    const body = upperOf('home-card-body')
    expect(Number.isFinite(group)).toBe(true)
    expect(Number.isFinite(title)).toBe(true)
    expect(Number.isFinite(body)).toBe(true)
    // Group labels head a group of cards, so they read as the larger heading.
    expect(group).toBeGreaterThanOrEqual(title)
    // Card titles head a card, so they read as larger than the card body.
    expect(title).toBeGreaterThanOrEqual(body)
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
