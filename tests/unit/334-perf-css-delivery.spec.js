/**
 * @file tests/unit/334-perf-css-delivery.spec.js
 * @description Source-of-fix gate for Issue #334 (mobile LCP<2.5s + score>=90
 * on /about, /contact, /news, deferred from #302).
 *
 * Diagnosis (from #302 mobile Lighthouse audits): the bottleneck is
 * RENDER-BLOCKING CSS, not JS (TBT=0 on all 3 routes). The surviving root
 * cause for #334 is:
 *   (B) CSS `@import` chains in App.vue `<style>` and main.css force a SERIAL
 *       fetch of the imported sheets (each @import is its own blocking request
 *       that cannot be parallelized), inflating the critical CSS chain by
 *       ~730ms measured.
 *
 * The fix is a CSS-DELIVERY change (not a CSS-content change): convert each
 * CSS-side `@import` to a JS-side `import` (Vite bundles JS-side CSS imports
 * into a single stylesheet with no serial fetch). Because the fix is delivery
 * plumbing, the unit-test burden is to assert the SOURCE of the fix exists as
 * active code. A green Lighthouse run is the final evidence, but the source
 * gate is what prevents a future refactor from silently reverting the fix.
 *
 * HISTORY — Fix A was DROPPED on the #335 rebase:
 *   Fix A originally targeted the Google Fonts CDN `<link rel="stylesheet">`
 *   in index.html (a ~1480ms render-blocking font round-trip) by converting it
 *   to a preload+async-onload pattern. Issue #335 (merged to main DURING #334's
 *   PR CI) solved the SAME problem better by self-hosting Orbitron/Rajdhani
 *   woff2 with font-display: optional in src/assets/styles/fonts.css — zero
 *   swap, zero CLS reflow, AND no render-blocking CDN round-trip. There is no
 *   Google Fonts `<link>` left in index.html, so the Fix A assertions (preload
 *   pattern, noscript fallback, preconnect pair, display=swap) became dead
 *   and were deleted from this file. The #335 font-selfhost tests cover the
 *   self-hosted direction. The image-priority work (Fix C/D/E) lives in
 *   tests/unit/334-perf-image-priority.spec.js and is orthogonal.
 *
 * @ticket #334
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')

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
