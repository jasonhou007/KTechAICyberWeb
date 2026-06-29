/**
 * @file css-purge.spec.js
 * @description CSS purge / dead-CSS removal regression test for Issue #188
 * (Core Web Vitals — "unused CSS is removed" AC deferred from #18).
 * @ticket #188
 *
 * What #188 actually purged (measured 2026-06-29 on autodev-188-purge-css):
 *   - The ~8 KB dead inline <style> block in index.html that styled the
 *     pre-Vue skeleton (.hero-title/.honor-badge/.contact-grid/.loader-logo/
 *     .nav-links, the #loading splash, .scanlines overlay, fade-in helpers).
 *     Vue mounts #app and renders its own components, so this CSS targeted HTML
 *     the user never sees. Source inline block: 8,182 -> 397 bytes (-95%).
 *     This is the load-bearing CWV win: the browser downloads and parses ~8 KB
 *     fewer HTML bytes on first paint before the app can mount.
 *   - A byte-identical :root/{[data-theme=dark]} duplication in cyber.css.
 *   - 259 Orbitron/Rajdhani font hardcodes consolidated onto CSS variables
 *     (covered by font-consolidation.spec.js).
 *
 * IMPORTANT — what the purge did NOT shrink, and why: the bundled entry CSS
 * chunk (dist/assets/index-*.css, ~75 KB raw / ~12.9 KB gzip) is composed of
 * variables.css + cyber.css + LIVE scoped component styles. The dead CSS lived
 * in index.html's INLINE block (a separate document), not in the chunk. So the
 * chunk is essentially unchanged by this purge (75,369 -> 74,859 raw). The
 * chunk-size test below is therefore a NON-REGRESSION gate (catches future
 * bloat), not a proof of this purge — the proof is the index.html inline-block
 * size test + the dead-selector-absence tests.
 *
 * Pattern mirrors bundle-size.spec.js (#18): read dist/assets with node:fs and
 * gzip with node:zlib, guarded by describe.skipIf(!existsSync(ASSETS_DIR)) so
 * the suite no-ops cleanly when no build is present (standard `vitest run` CI
 * path doesn't build first).
 *
 * RED-TEST PROOF: against origin/main @ c672d06 (pre-purge), the
 * "index.html inline <style> block < 1500 bytes" assertion fails (block is
 * 8,182 bytes) and the dead-selector-absence assertions all fail (.hero-title
 * etc. are present) — proving the gate catches the regression.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const ASSETS_DIR = resolve(ROOT, 'dist/assets')
const INDEX_HTML_PATH = resolve(ROOT, 'index.html')
const CYBER_CSS_PATH = resolve(ROOT, 'src/assets/styles/cyber.css')

/** Strip CSS/HTML comments so a commented-out rule cannot masquerade as active. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
}

/** Extract the inline <style>...</style> block bytes from an HTML document. */
function extractInlineStyleBlock(html) {
  const m = html.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  return m ? m[0] : ''
}

/** Find the single entry CSS chunk (index-*.css) in dist/assets, or null. */
function findEntryCss() {
  if (!existsSync(ASSETS_DIR)) return null
  return (
    readdirSync(ASSETS_DIR).find((f) => /^index-.*\.css$/.test(f)) || null
  )
}

// The PRIMARY purge-size gate: the index.html inline <style> block. This runs
// on the SOURCE file (no build needed) so it is robust in every CI path. The
// dead pre-Vue skeleton lived HERE, not in the CSS chunk — so this is the
// honest measure of the #188 purge win.
describe('CSS purge — index.html inline <style> block shrank (#188)', () => {
  // Baseline (origin/main @ c672d06): 8,182 bytes. After #188: 397 bytes.
  // Threshold 1,500 bytes is ~4x the post-purge block (headroom for the
  // critical no-FOUC block + comments) but ~5x BELOW the baseline, so the
  // test is RED pre-purge and GREEN post-purge with no flake risk.
  it('index.html inline <style> block is under 1500 bytes (baseline 8182, post-purge 397)', () => {
    const html = readFileSync(INDEX_HTML_PATH, 'utf-8')
    const block = extractInlineStyleBlock(html)
    console.log('\n[css-purge] index.html inline <style> block:', block.length, 'bytes (budget 1500)')
    expect(block.length).toBeLessThan(1500)
  })
})

// describe.skipIf: when no build is present (CI unit path without `vite build`
// first), the suite no-ops cleanly — same guard pattern as bundle-size.spec.js.
// This is a NON-REGRESSION gate on the entry CSS chunk (the chunk was not the
// purge target — see file header).
describe.skipIf(!existsSync(ASSETS_DIR))('CSS purge — entry chunk non-regression (#188)', () => {
  const entryCssName = findEntryCss()

  it('entry CSS chunk exists in dist/assets', () => {
    expect(entryCssName, 'expected an index-*.css chunk in dist/assets').not.toBeNull()
  })

  it('entry CSS raw size stays bounded (< 76000 bytes; post-purge 74859)', () => {
    expect(entryCssName, 'no entry CSS chunk — did the build run?').not.toBeNull()
    const raw = readFileSync(resolve(ASSETS_DIR, entryCssName))
    console.log('\n[css-purge] entry CSS raw:', raw.length, 'bytes (non-regression budget 76000)')
    expect(raw.length).toBeLessThan(76000)
  })

  it('entry CSS gzip size stays bounded (< 13000 bytes; post-purge 12837)', () => {
    expect(entryCssName, 'no entry CSS chunk — did the build run?').not.toBeNull()
    const raw = readFileSync(resolve(ASSETS_DIR, entryCssName))
    const gzip = gzipSync(raw).length
    console.log('\n[css-purge] entry CSS gzip:', gzip, 'bytes (non-regression budget 13000)')
    expect(gzip).toBeLessThan(13000)
  })
})

// These source-file assertions run regardless of build presence — they guard
// the SOURCE removal, which is the actual change. The build-size tests above
// are the downstream proof.
describe('CSS purge — dead selectors removed from index.html (#188)', () => {
  let html
  beforeAll(() => {
    html = readFileSync(INDEX_HTML_PATH, 'utf-8')
  })

  // Vue mounts #app and renders its own Home/About/etc components — the
  // pre-Vue skeleton selectors (.hero-title, .honor-badge, .contact-grid,
  // .loader-logo, .nav-links) in the index.html inline <style> are dead: they
  // target HTML that is never served to the user. #188 deletes that block.
  // RED today: all five selectors are present in the inline <style>.
  for (const selector of [
    '.hero-title',
    '.honor-badge',
    '.contact-grid',
    '.loader-logo',
    '.nav-links'
  ]) {
    it(`index.html does NOT contain dead skeleton selector ${selector}`, () => {
      expect(html).not.toContain(selector)
    })
  }

  it('index.html RETAINS a critical no-FOUC block (--bg + body background)', () => {
    // We must not regress FOUC: the purge keeps a minimal critical block that
    // paints the dark background before the JS bundle hydrates. Assert both
    // the custom property declaration and the body background rule survive.
    expect(html).toContain('--bg')
    expect(html).toMatch(/body\s*\{[^}]*background/)
  })
})

describe('CSS purge — cyber.css redundant :root removed (#188)', () => {
  // cyber.css historically declared the dark-theme variables TWICE: once in a
  // `:root { /* Default to dark theme */ }` block and once in
  // `[data-theme="dark"] { ... }`, byte-identical. The :root copy is dead
  // (the app keys off [data-theme]) — #188 removes it. Assert the dedup by
  // counting how many times the unique dark gradient-end value appears in
  // ACTIVE (comment-stripped) source: must be exactly ONCE (only in
  // [data-theme="dark"]). RED today: appears twice.
  it('cyber.css contains --bg-gradient-end: #16213e exactly ONCE (only in [data-theme=dark])', () => {
    const raw = readFileSync(CYBER_CSS_PATH, 'utf-8')
    const active = stripComments(raw)
    const matches = active.match(/--bg-gradient-end:\s*#16213e/g) || []
    console.log('\n[css-purge] --bg-gradient-end #16213e count in cyber.css:', matches.length)
    expect(matches.length).toBe(1)
  })
})
