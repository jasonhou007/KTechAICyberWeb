/**
 * @file tests/unit/334-perf-css-delivery.spec.js
 * @description Source-of-fix gate for Issue #334 (mobile LCP<2.5s + score>=90
 * on /about, /contact, /news, deferred from #302).
 *
 * Diagnosis (from #302 mobile Lighthouse audits): the bottleneck is
 * RENDER-BLOCKING CSS, not JS (TBT=0 on all 3 routes). Two root causes:
 *   (A) the Google Fonts `<link rel="stylesheet">` in index.html blocks the
 *       first paint for the full font-fetch round-trip (~1480ms measured).
 *   (B) CSS `@import` chains in App.vue `<style>` and main.css force a SERIAL
 *       fetch of the imported sheets (each @import is its own blocking request
 *       that cannot be parallelized), inflating the critical CSS chain by
 *       ~730ms measured.
 *
 * The fix is a CSS-DELIVERY change (not a CSS-content change): convert the
 * blocking font link to a preload+async-onload pattern, and convert each
 * CSS-side `@import` to a JS-side `import` (Vite bundles JS-side CSS imports
 * into a single stylesheet with no serial fetch). Because the fix is delivery
 * plumbing, the unit-test burden is to assert the SOURCE of the fix exists as
 * active code — these are the iter-13 visual/structural-source gates adapted
 * to perf. A green Lighthouse run is the final evidence, but the source gate
 * is what prevents a future refactor from silently reverting the fix.
 *
 * These tests are RED against the pre-fix code: the current index.html uses a
 * blocking `<link rel="stylesheet" ... fonts.googleapis.com>` (no preload/
 * async-onload pattern) and src/ contains 3 `@import` statements
 * (App.vue ×2, main.css ×1). After the fix, both invariants hold.
 *
 * @ticket #334
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')

const INDEX_HTML = readFileSync(resolve(ROOT, 'index.html'), 'utf8')

describe('#334 Fix A — non-blocking Google Fonts in index.html', () => {
  it('uses rel=preload + async onload for the Google Fonts stylesheet (not a blocking <link rel=stylesheet>)', () => {
    // The fix replaces the blocking
    //   <link rel="stylesheet" href="...fonts.googleapis.com/css2...">
    // with the preload-then-swap pattern:
    //   <link rel="preload" as="style" href="...fonts.googleapis.com/css2..." onload="...this.rel='stylesheet'">
    //   <noscript><link rel="stylesheet" href="..."></noscript>
    // The perf contract is the PRELOAD + ONLOAD swap — that is what makes the
    // resource non-render-blocking. Assert both tokens are present on a
    // fonts.googleapis.com href.
    const fontHrefPattern = /href=["']https:\/\/fonts\.googleapis\.com\/css2[^"']+["']/i
    const fontHrefs = INDEX_HTML.match(new RegExp(fontHrefPattern.source, 'gi')) || []
    expect(fontHrefs.length, 'index.html must reference the Google Fonts CSS').toBeGreaterThan(0)

    const preloadFontLine = INDEX_HTML.match(
      /<link[^>]*rel=["']preload["'][^>]*as=["']style["'][^>]*fonts\.googleapis\.com[^>]*>/i,
    )
    expect(
      preloadFontLine,
      'expected a <link rel=preload as=style ... fonts.googleapis.com ...> (the non-blocking font load). ' +
        'Found: ' + (INDEX_HTML.match(/<link[^>]*fonts\.googleapis\.com[^>]*>/gi) || []).join(' | '),
    ).not.toBeNull()

    const onloadSwap = /onload=["'][^"']*this\.rel\s*=\s*['"]?stylesheet['"]?[^"']*["']/i
    expect(
      onloadSwap.test(preloadFontLine[0]),
      'the preload link must swap rel to stylesheet via onload (async pattern). Found: ' + preloadFontLine[0],
    ).toBe(true)
  })

  it('does NOT keep a plain blocking <link rel=stylesheet> for Google Fonts (the preload pattern replaces it)', () => {
    // After the fix, the ONLY fonts.googleapis.com stylesheet references should
    // be the preload (with onload swap) and the <noscript> fallback. A plain
    // blocking <link rel="stylesheet" href="...fonts.googleapis.com..."> (no
    // preload, no onload) would re-introduce the render-blocking fetch.
    const blockingFontLink = INDEX_HTML.match(
      /<link[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']https:\/\/fonts\.googleapis\.com\/css2[^"']*["'][^>]*>/i,
    )
    expect(
      blockingFontLink,
      'found a BLOCKING <link rel=stylesheet> for Google Fonts — should be converted to preload+onload. ' +
        'Match: ' + (blockingFontLink ? blockingFontLink[0] : ''),
    ).toBeNull()
  })

  it('keeps display=swap in the font URL (FOUT, not FOIT)', () => {
    // display=swap is the font-render-behavior flag (show fallback immediately,
    // swap when the webfont arrives). It is independent of the stylesheet-load
    // blocking behavior (which Fix A addresses via preload), but must remain
    // present so the font does not become invisible while loading.
    const fontUrl = INDEX_HTML.match(/https:\/\/fonts\.googleapis\.com\/css2[^"'\s]+/i)
    expect(fontUrl, 'a fonts.googleapis.com/css2 URL must be present').not.toBeNull()
    expect(fontUrl[0], 'font URL must contain display=swap').toMatch(/display=swap/i)
  })

  it('preconnects to both fonts.googleapis.com and fonts.gstatic.com', () => {
    // preconnect warms the DNS+TLS handshake so the preload fetch is not
    // delayed by connection setup. Both hosts are required: googleapis.com is
    // the stylesheet host, gstatic.com is the font-file host (crossOrigin).
    expect(INDEX_HTML).toMatch(/<link[^>]*rel=["']preconnect["'][^>]*fonts\.googleapis\.com/i)
    expect(INDEX_HTML).toMatch(/<link[^>]*rel=["']preconnect["'][^>]*fonts\.gstatic\.com[^>]*crossorigin/i)
  })

  it('provides a <noscript> stylesheet fallback for the preload pattern (no-JS clients still get the font)', () => {
    // The preload+onload pattern only swaps to a stylesheet if JS runs. A
    // <noscript><link rel=stylesheet></noscript> guarantees the font still
    // loads for no-JS clients (and is itself non-render-blocking for the JS
    // path because it lives in noscript).
    expect(INDEX_HTML).toMatch(/<noscript>[^<]*<link[^>]*rel=["']stylesheet["'][^>]*fonts\.googleapis\.com/i)
  })
})

describe('#334 Fix B — no CSS @import chains in src/', () => {
  it('src/**/*.css contains zero @import statements (Vite bundles JS-side imports instead)', () => {
    // CSS @import is render-blocking AND serial (the browser must fetch the
    // importing sheet, parse it, discover the @import, then fetch the imported
    // sheet — no parallelism). Converting @import to a JS-side import lets Vite
    // inline all CSS into one bundled stylesheet at build time. This test
    // walks every .css file under src/ and asserts none contains @import.
    const cssFiles = execSync(`find ${ROOT}/src -type f -name '*.css'`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
    expect(cssFiles.length, 'expected at least one .css file under src/').toBeGreaterThan(0)

    const offenders = []
    for (const f of cssFiles) {
      const content = readFileSync(f, 'utf8')
      // match @import at the start of a line, allowing whitespace; exclude
      // occurrences inside comments by stripping /* ... */ first.
      const stripped = content.replace(/\/\*[\s\S]*?\*\//g, '')
      const importMatches = stripped.match(/^\s*@import\b[^;]*;/gim)
      if (importMatches) {
        offenders.push({ file: f.replace(ROOT + '/', ''), imports: importMatches })
      }
    }
    expect(
      offenders,
      'found @import statements in src CSS (should be converted to JS-side imports):\n' +
        offenders.map((o) => `  ${o.file}: ${o.import.join(', ')}`).join('\n'),
    ).toEqual([])
  })

  it('src/**/*.vue <style> blocks contain zero @import statements', () => {
    // Same rationale as the .css test, applied to <style> blocks inside SFCs.
    // App.vue previously had `@import './styles/accessibility.css'` and
    // `@import './assets/styles/cyber.css'` in its <style> block — these must
    // be gone (moved to JS-side import in main.js or the SFC <script>).
    const vueFiles = execSync(`find ${ROOT}/src -type f -name '*.vue'`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
    expect(vueFiles.length, 'expected at least one .vue file under src/').toBeGreaterThan(0)

    const offenders = []
    for (const f of vueFiles) {
      const content = readFileSync(f, 'utf8')
      // extract each <style> block (scoped or not) and scan for @import
      const styleBlocks = content.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []
      for (const block of styleBlocks) {
        const stripped = block.replace(/\/\*[\s\S]*?\*\//g, '')
        const importMatches = stripped.match(/^\s*@import\b[^;]*;/gim)
        if (importMatches) {
          offenders.push({ file: f.replace(ROOT + '/', ''), imports: importMatches })
        }
      }
    }
    expect(
      offenders,
      'found @import statements in .vue <style> blocks (should be converted to JS-side imports):\n' +
        offenders.map((o) => `  ${o.file}: ${o.imports.join(', ')}`).join('\n'),
    ).toEqual([])
  })
})

describe('#334 — global sheets still wired (Fix B does not drop a stylesheet)', () => {
  // Fix B MOVES the @import to a JS-side import; it must not DELETE the sheet.
  // Each previously-@imported sheet (variables.css, cyber.css,
  // accessibility.css) must still be imported somewhere in JS so its rules
  // ship. This guards against a refactor that "fixes" the @import by simply
  // removing it and losing the CSS.
  it('variables.css is imported via JS (main.css or main.js or a .vue <script>)', () => {
    const grep = execSync(
      `grep -rl "variables.css" ${ROOT}/src --include='*.css' --include='*.js' --include='*.vue' || true`,
      { encoding: 'utf8' },
    ).trim()
    expect(grep, 'variables.css must be referenced from a JS/CSS file').not.toEqual('')
  })

  it('cyber.css is imported via JS (not via App.vue <style> @import)', () => {
    // Must appear in a .js or in a <script> block of a .vue — i.e. a JS-side
    // import, not a CSS @import (which the previous test already bans).
    const hits = execSync(
      `grep -rn "cyber.css" ${ROOT}/src --include='*.js' --include='*.vue' || true`,
      { encoding: 'utf8' },
    ).trim()
    expect(hits, 'cyber.css must be imported via JS').not.toEqual('')
  })

  it('accessibility.css is imported via JS (not via App.vue <style> @import)', () => {
    const hits = execSync(
      `grep -rn "accessibility.css" ${ROOT}/src --include='*.js' --include='*.vue' || true`,
      { encoding: 'utf8' },
    ).trim()
    // the path is styles/accessibility.css; match either bare or qualified
    expect(hits, 'accessibility.css must be imported via JS').not.toEqual('')
  })
})
