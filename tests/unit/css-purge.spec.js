/**
 * @file css-purge.spec.js
 * @description CSS purge / dead-CSS removal regression test for Issue #188
 * (Core Web Vitals — "unused CSS is removed" AC deferred from #18).
 * @ticket #188
 *
 * This gate asserts the entry CSS chunk actually shrank after the manual purge
 * (index.html dead inline skeleton + cyber.css redundant :root), AND that the
 * dead selectors were really removed (not just minified away). DOM tests can't
 * see CSS — so we read the built artifacts + the source HTML directly.
 *
 * Pattern mirrors bundle-size.spec.js (#18): read dist/assets with node:fs and
 * gzip with node:zlib, guarded by describe.skipIf(!existsSync(ASSETS_DIR)) so
 * the suite no-ops cleanly when no build is present (standard `vitest run` CI
 * path doesn't build first).
 *
 * Threshold rationale (re-derived from baseline build on autodev-188-purge-css
 * @ c672d06, 2026-06-29):
 *   - baseline entry CSS raw = 75,369 bytes; gzip = 12,892 bytes
 *   - post-purge thresholds set BELOW the baseline so the test is RED today
 *     and only goes green once the dead block + redundant :root are removed.
 *
 * RED-TEST PROOF: run this against the current (unpurged) build and the
 * "entry CSS raw < 72000" + "gzip < 12500" + "index.html does NOT contain
 * .hero-title" assertions all fail — proving the gate catches the regression.
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

/** Find the single entry CSS chunk (index-*.css) in dist/assets, or null. */
function findEntryCss() {
  if (!existsSync(ASSETS_DIR)) return null
  return (
    readdirSync(ASSETS_DIR).find((f) => /^index-.*\.css$/.test(f)) || null
  )
}

// describe.skipIf: when no build is present (CI unit path without `vite build`
// first), the suite no-ops cleanly — same guard pattern as bundle-size.spec.js.
describe.skipIf(!existsSync(ASSETS_DIR))('CSS purge — entry chunk size (#188)', () => {
  const entryCssName = findEntryCss()

  it('entry CSS chunk exists in dist/assets', () => {
    expect(entryCssName, 'expected an index-*.css chunk in dist/assets').not.toBeNull()
  })

  it('entry CSS raw size is under 72000 bytes (baseline 75369)', () => {
    expect(entryCssName, 'no entry CSS chunk — did the build run?').not.toBeNull()
    const raw = readFileSync(resolve(ASSETS_DIR, entryCssName))
    console.log('\n[css-purge] entry CSS raw:', raw.length, 'bytes (budget 72000)')
    expect(raw.length).toBeLessThan(72000)
  })

  it('entry CSS gzip size is under 12500 bytes (baseline 12892)', () => {
    expect(entryCssName, 'no entry CSS chunk — did the build run?').not.toBeNull()
    const raw = readFileSync(resolve(ASSETS_DIR, entryCssName))
    const gzip = gzipSync(raw).length
    console.log('\n[css-purge] entry CSS gzip:', gzip, 'bytes (budget 12500)')
    expect(gzip).toBeLessThan(12500)
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
