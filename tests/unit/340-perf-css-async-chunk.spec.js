/**
 * @file tests/unit/340-perf-css-async-chunk.spec.js
 * @description Source-of-fix gate for Issue #340 Step 1 (defer render-blocking
 * global CSS bundle — follow-up to #334).
 *
 * Diagnosis (from #340 Lighthouse audits): the SOLE remaining render-blocking
 * resource on /about, /contact, /news is the entry CSS bundle
 * (assets/index-*.css, 23.4KB / 5.7KB transfer), wasting ~730ms of FCP each.
 * #334 Fix B correctly eliminated the 3 serial CSS @import chains but
 * concentrated all global CSS into one render-blocking request.
 *
 * The fix: move cyber.css (79 lines, decorative neon/scanline/glow rules that
 * no above-the-fold element needs to paint) OUT of the entry bundle into an
 * async chunk via dynamic `import()`. Projected ~220ms of the 730ms wastedMs.
 * The other global sheets (variables.css, fonts.css, main.css, accessibility)
 * stay in the entry bundle because they ARE critical (CSS custom properties,
 * @font-face, reset, a11y focus rings) — those rules resolve before any
 * component can render correctly.
 *
 * This is a CSS-DELIVERY change (which chunk the sheet ships in), not a
 * CSS-content change. The unit-test burden is:
 *   (a) assert the SOURCE uses a dynamic `import()` (not a static `import`)
 *       for cyber.css in src/main.js — that is what triggers Vite to emit
 *       cyber.css as a separate async chunk instead of inlining it into the
 *       entry bundle.
 *   (b) when a `dist/` build is present, assert the BUILT entry CSS chunk
 *       (dist/assets/index-*.css) does NOT contain cyber.css signature rules
 *       (`.neon-text`, `[data-theme-initializing]`). This is the proof the
 *       chunk emit actually split cyber.css out. Mirrors the
 *       `describe.skipIf(!existsSync(ASSETS_DIR))` pattern in
 *       css-purge.spec.js.
 *
 * IMPORTANT — the existing `334-perf-css-delivery.spec.js` greps for the
 * literal `cyber.css` in main.js (asserting the sheet is still wired). A
 * dynamic `import('./assets/styles/cyber.css')` STILL contains that literal,
 * so the 334 test stays green under this fix. This file additionally asserts
 * the import is DYNAMIC (the #340 increment over #334).
 *
 * @ticket #340
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')
const MAIN_JS_PATH = resolve(ROOT, 'src/main.js')
const ASSETS_DIR = resolve(ROOT, 'dist/assets')

describe('#340 Step 1 — cyber.css loaded via dynamic import() in src/main.js', () => {
  let mainSrc
  beforeAll(() => {
    mainSrc = readFileSync(MAIN_JS_PATH, 'utf-8')
  })

  it('src/main.js references cyber.css (Fix B wiring from #334 stays intact)', () => {
    // The #334 gate asserts the literal `cyber.css` appears in a JS file.
    // Re-assert here so a future refactor cannot silently delete the wiring.
    expect(mainSrc).toMatch(/cyber\.css/)
  })

  it('src/main.js uses a DYNAMIC import() for cyber.css (not a static import)', () => {
    // Strip block + line comments so a commented-out `import './cyber.css'`
    // cannot masquerade as the active static import.
    const stripped = mainSrc
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')

    // A STATIC top-level `import '...cyber.css'` (with no `(` after `import`)
    // is the OLD render-blocking form — it forces Vite to inline cyber.css
    // into the entry bundle. The #340 fix is to convert it to a dynamic
    // `import('...cyber.css')` (with parens), which Vite emits as a separate
    // async chunk fetched only after the entry evaluates.
    const staticImportRegex = /^\s*import\s+['"][^'"]*cyber\.css['"]/m
    expect(
      stripped,
      'src/main.js must NOT use a static `import` for cyber.css (it inlines into the entry bundle — #340 wants an async chunk)',
    ).not.toMatch(staticImportRegex)

    // The dynamic form: `import('...cyber.css')` — note the parens. This is
    // the load-bearing #340 assertion: dynamic import triggers chunk emit.
    const dynamicImportRegex = /import\s*\(\s*['"][^'"]*cyber\.css['"]\s*\)/
    expect(
      stripped,
      'src/main.js must use a dynamic `import(...)` for cyber.css so Vite emits it as an async chunk',
    ).toMatch(dynamicImportRegex)
  })
})

// Build-time gate: when `vite build` has run, the entry CSS chunk must NOT
// contain cyber.css signature rules — that proves the dynamic import caused
// Vite to split cyber.css into a separate async chunk. Mirrors the
// `describe.skipIf(!existsSync(ASSETS_DIR))` no-op-when-no-build pattern in
// css-purge.spec.js. Runs only in the post-build CI path.
describe.skipIf(!existsSync(ASSETS_DIR))('#340 Step 1 — built entry CSS chunk excludes cyber.css', () => {
  // Lazy: resolve the entry chunk name inside each `it` so module-eval does
  // not scandir a path that may be skipped (mirrors css-purge.spec.js
  // findEntryCss() pattern).
  //
  // #348 update: vite-ssg renames the entry CSS chunk from `index-*.css` to
  // `app-*.css`. Accept EITHER name so the gate stays valid across SSG and
  // non-SSG builds. Prefer `index-` for backward compat (a future revert to
  // vite build needs no test edit); fall back to `app-` for the SSG build.
  function getEntryCssName() {
    const files = readdirSync(ASSETS_DIR)
    return (
      files.find((f) => /^index-.*\.css$/.test(f)) ||
      files.find((f) => /^app-.*\.css$/.test(f)) ||
      null
    )
  }

  it('entry CSS chunk exists in dist/assets (did the build run?)', () => {
    expect(getEntryCssName(), 'expected an index-*.css or app-*.css chunk in dist/assets').not.toBeNull()
  })

  it('entry CSS chunk does NOT contain the cyber.css `[data-theme-initializing]` rule', () => {
    const entryCssName = getEntryCssName()
    expect(entryCssName, 'no entry CSS chunk — did the build run?').not.toBeNull()
    const css = readFileSync(resolve(ASSETS_DIR, entryCssName), 'utf-8')
    // `[data-theme-initializing]` is the FOUC-suppression selector at the top
    // of cyber.css. It is unique to cyber.css (no other source sheet defines
    // it), making it a reliable signature that cyber.css was NOT inlined.
    expect(
      css,
      'entry CSS chunk contains `[data-theme-initializing]` — cyber.css was inlined into the entry bundle instead of split into an async chunk',
    ).not.toContain('[data-theme-initializing]')
  })
})
