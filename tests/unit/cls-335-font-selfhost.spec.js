/**
 * @file cls-335-font-selfhost.spec.js
 * @description CLS regression-fix gate for Issue #335.
 * @ticket #335
 *
 * Root cause (established, do not re-investigate): the Home (CLS 0.132 desktop)
 * and About (CLS 0.191 desktop) layout-shift regression is 100% web-font
 * FOIT/FOUT reflow. index.html previously loaded Orbitron + Rajdhani from
 * Google Fonts via `display=swap`; text painted in the fallback then reflowed
 * when the web font arrived. The saved Lighthouse layout-shifts audit names
 * section.whatwedo (Home) and footer/about-hero::before (About) as the biggest
 * shifters.
 *
 * The fix (load-bearing):
 *   1. Self-host the 9 woff2 faces (Orbitron 400/500/700/900 + Rajdhani
 *      300/400/500/600/700) under public/fonts/ and declare them in
 *      src/assets/styles/fonts.css with `font-display: optional`.
 *      `optional` gives the browser a tiny window to use the web font; if it
 *      is not ready in that window the browser keeps the fallback FOREVER for
 *      that page load — zero swap, zero reflow, zero CLS contribution.
 *   2. Wire fonts.css into main.css so the @font-face rules ship in the bundle
 *      (no runtime fetch of /src/...).
 *   3. Remove the Google Fonts <link> from index.html (kills the render-block
 *      + the swap-source reflow entirely).
 *   4. Add `contain: layout` to the two biggest shifters (.whatwedo on Home,
 *      .about-hero on About) so any residual internal layout shift cannot
 *      propagate to ancestor scoring.
 *
 * This is a SOURCE-GREP gate modeled on font-consolidation.spec.js (#188) +
 * seo-assets.spec.js (#263): it reads the real files (index.html, fonts.css,
 * main.css, variables.css, the two .vue files, public/fonts/) — NOT mocked —
 * so a missing file or a stray `display=swap` is caught. It would FAIL today
 * (Google Fonts link present, fonts.css absent, public/fonts/ absent) and
 * passes once Steps 2-6 of the plan land.
 *
 * RED-TEST PROOF: against the branch HEAD before the fix,
 *   - index.html still references fonts.googleapis.com / display=swap (fail #1)
 *   - fonts.css does not exist (fail #2, #3, #4)
 *   - public/fonts/*.woff2 do not exist (fail #5)
 *   - main.css does not @import fonts.css (fail #6)
 *   - .about-hero / .whatwedo do not contain `contain:.*layout` (fail #7, #8)
 *   - (variables.css already has the Orbitron/Rajdhani tokens, so #9 passes
 *      both before and after — it is a no-regression guard.)
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const INDEX_HTML = path.join(ROOT, 'index.html')
const FONTS_CSS = path.join(ROOT, 'src/assets/styles/fonts.css')
const MAIN_CSS = path.join(ROOT, 'src/assets/styles/main.css')
const VARIABLES_CSS = path.join(ROOT, 'src/assets/styles/variables.css')
const HOME_VUE = path.join(ROOT, 'src/views/Home.vue')
const ABOUT_VUE = path.join(ROOT, 'src/views/About.vue')
const PUBLIC_FONTS = path.join(ROOT, 'public/fonts')

// Strip C-style block comments so a commented-out rule cannot masquerade as
// active CSS (mirrors font-consolidation.spec.js).
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Read a file as utf-8 (throws if missing — caller surfaces the assertion). */
function read(p) {
  return fs.readFileSync(p, 'utf-8')
}

describe('#335 Group A — index.html no longer reaches Google Fonts', () => {
  const html = read(INDEX_HTML)

  it('does NOT reference fonts.googleapis.com', () => {
    expect(html).not.toMatch(/fonts\.googleapis\.com/)
  })

  it('does NOT reference fonts.gstatic.com', () => {
    expect(html).not.toMatch(/fonts\.gstatic\.com/)
  })

  it('does NOT use display=swap anywhere', () => {
    expect(html).not.toMatch(/display=swap/)
  })
})

describe('#335 Group A2 — App.vue useHead no longer preconnects to Google Fonts', () => {
  // The static index.html link is one source; App.vue's useHead injected a
  // SECOND pair of preconnect links at runtime. Both must be gone or the
  // browser still opens a third-party connection for fonts we no longer fetch.
  // Read App.vue source (stripped of comments) and assert no Google Fonts href.
  const APP_VUE = path.join(ROOT, 'src/App.vue')

  it('App.vue exists', () => {
    expect(fs.existsSync(APP_VUE)).toBe(true)
  })

  it('App.vue does NOT preconnect to fonts.googleapis.com', () => {
    const src = stripComments(read(APP_VUE))
    expect(src).not.toMatch(/fonts\.googleapis\.com/)
  })

  it('App.vue does NOT preconnect to fonts.gstatic.com', () => {
    const src = stripComments(read(APP_VUE))
    expect(src).not.toMatch(/fonts\.gstatic\.com/)
  })
})

describe('#335 Group B — fonts.css declares the 9 self-hosted faces', () => {
  it('fonts.css exists', () => {
    expect(fs.existsSync(FONTS_CSS)).toBe(true)
  })

  it('contains >= 9 @font-face blocks', () => {
    const src = stripComments(read(FONTS_CSS))
    const count = (src.match(/@font-face\s*\{/g) || []).length
    console.log('\n[cls-335] @font-face count:', count)
    expect(count).toBeGreaterThanOrEqual(9)
  })

  it('every @font-face has font-display: optional (count >= 9)', () => {
    const src = stripComments(read(FONTS_CSS))
    const count = (src.match(/font-display:\s*optional/g) || []).length
    console.log('\n[cls-335] font-display:optional count:', count)
    expect(count).toBeGreaterThanOrEqual(9)
  })

  it('NO @font-face src references http(s):// (web fonts self-hosted, fallbacks local-only)', () => {
    const src = stripComments(read(FONTS_CSS))
    // Split into @font-face blocks. Two face kinds are permitted:
    //   - WEB-font faces (the 9 Orbitron/Rajdhani): src MUST be url('/fonts/...')
    //   - METRIC-MATCHED fallback faces (family contains 'Fallback'): src MUST
    //     be local(...) only (no woff2 — they exist only to carry size-adjust).
    // No face may reference http(s):// under any name (#335 review fix:
    // added a metric-matched 'Rajdhani Fallback' face so the `optional`
    // fallback renders at Rajdhani width and .solution-card body text does
    // not wrap to a 2nd line in CI's colder decode timing — keeps the #313
    // .cta above-the-fold assertion deterministic without weakening CLS).
    const blocks = src.split(/@font-face\s*\{/).slice(1)
    expect(blocks.length).toBeGreaterThanOrEqual(9)
    let webFontCount = 0
    let fallbackCount = 0
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].split(/\}/)[0]
      const familyDecl = block.match(/font-family:\s*['"]([^'"]+)['"]/)
      const family = familyDecl ? familyDecl[1] : ''
      const srcDecl = block.match(/src:\s*([^;]+);/)
      if (!srcDecl) continue
      const srcVal = srcDecl[1]
      expect(srcVal).not.toMatch(/https?:\/\//)
      if (/Fallback/.test(family)) {
        // metric-matched fallback face: local-only, no url()
        expect(srcVal).toMatch(/local\(/)
        expect(srcVal).not.toMatch(/url\(/)
        fallbackCount++
      } else {
        // web-font face: must be url('/fonts/...')
        expect(srcVal).toMatch(/url\(['"]?\/fonts\//)
        webFontCount++
      }
    }
    expect(webFontCount).toBeGreaterThanOrEqual(9)
    expect(fallbackCount).toBeGreaterThanOrEqual(1)
  })
})

describe('#335 Group C — public/fonts/ holds the 9 woff2 binaries', () => {
  const expected = [
    'orbitron-400.woff2',
    'orbitron-500.woff2',
    'orbitron-700.woff2',
    'orbitron-900.woff2',
    'rajdhani-300.woff2',
    'rajdhani-400.woff2',
    'rajdhani-500.woff2',
    'rajdhani-600.woff2',
    'rajdhani-700.woff2',
  ]

  it('public/fonts/ exists', () => {
    expect(fs.existsSync(PUBLIC_FONTS)).toBe(true)
  })

  for (const file of expected) {
    it(`${file} exists and is non-empty`, () => {
      const p = path.join(PUBLIC_FONTS, file)
      expect(fs.existsSync(p)).toBe(true)
      const stat = fs.statSync(p)
      expect(stat.size).toBeGreaterThan(0)
    })
  }
})

describe('#335 Group D — fonts.css wired into the global CSS bundle', () => {
  // The #335 invariant is "fonts.css ships in the global stylesheet bundle so
  // its @font-face rules are available to every var(--font-display)/
  // var(--font-body) consumer". Originally that wiring was a CSS
  // `@import './fonts.css'` at the top of main.css. The #334 rebase moved ALL
  // global CSS wiring to JS-side imports in main.js (CSS @import is
  // render-blocking + serial; JS-side imports are Vite-bundled into one
  // stylesheet with no serial fetch — see tests/unit/334-perf-css-delivery).
  // Functionally identical: either edge puts fonts.css in the same entry
  // chunk. This test accepts either wiring so the invariant survives the
  // delivery-mechanism change.
  it("fonts.css is wired via main.css @import OR main.js JS import", () => {
    const mainCss = stripComments(read(MAIN_CSS))
    const cssImported = /@import\s+['"]\.\/fonts\.css['"]/.test(mainCss)
    let jsImported = false
    try {
      const mainJs = read(path.join(ROOT, 'src/main.js'))
      jsImported = /['"][^'"]*\/fonts\.css['"]/.test(mainJs)
    } catch { /* main.js absent — fall through to cssImported */ }
    expect(
      cssImported || jsImported,
      'fonts.css must be wired into the bundle (main.css @import or main.js import)',
    ).toBe(true)
  })
})

describe('#335 Group E — contain: layout on the two biggest shifters', () => {
  it("About.vue .about-hero rule block contains contain: layout", () => {
    const src = stripComments(read(ABOUT_VUE))
    // Find the .about-hero rule block (selector line ending in { ... }) and
    // assert `contain:` with `layout` appears inside its declarations.
    const block = src.match(/\.about-hero\s*\{([^}]*)\}/)
    expect(block, '.about-hero rule block not found').not.toBeNull()
    expect(block[1]).toMatch(/contain:[^;]*layout/)
  })

  it("Home.vue .whatwedo rule block contains contain: layout", () => {
    const src = stripComments(read(HOME_VUE))
    const block = src.match(/\.whatwedo\s*\{([^}]*)\}/)
    expect(block, '.whatwedo rule block not found').not.toBeNull()
    expect(block[1]).toMatch(/contain:[^;]*layout/)
  })
})

describe('#335 Group G — async SelfDrivingDemo wrapper reserves its min-height', () => {
  // The DOMINANT actual CLS source (re-diagnosed from the saved layout-shifts
  // audit, which named the SAME elements + SAME scores before and after the
  // font fix) is async-component reflow: SelfDrivingDemo is loaded via
  // defineAsyncComponent on Home, and its .self-driving-section wrapper had
  // NO min-height, so before the chunk arrived every section below it was
  // positioned too high and shifted down ~280-360px when the chunk rendered
  // (the .whatwedo 0.1116 hit on Home, the .cyber-footer 0.0968 hit on About).
  // The fix reserves the demo's min-height on the eagerly-rendered wrapper so
  // the below-the-demo layout is correct from first paint.
  it("Home.vue .self-driving-section reserves min-height (clamp 280px floor)", () => {
    const src = stripComments(read(HOME_VUE))
    const block = src.match(/\.self-driving-section\s*\{([^}]*)\}/)
    expect(block, '.self-driving-section rule block not found').not.toBeNull()
    expect(block[1]).toMatch(/min-height:\s*clamp\(\s*280px/)
  })

  it("About.vue .self-driving-section reserves min-height (clamp 280px floor)", () => {
    const src = stripComments(read(ABOUT_VUE))
    const block = src.match(/\.self-driving-section\s*\{([^}]*)\}/)
    expect(block, '.self-driving-section rule block not found').not.toBeNull()
    expect(block[1]).toMatch(/min-height:\s*clamp\(\s*280px/)
  })
})

describe('#335 Group H — About hero figure reserves image aspect-ratio', () => {
  // The About CLS cluster (.hero-content 0.0746 mobile + .cyber-footer
  // 0.0968/0.1422 + .about-hero::before 0.0904) traces to the hero <figure>
  // collapsing to 0px before the eager WebP decodes, then expanding and
  // pushing everything below it down. Reserving the source aspect-ratio
  // (800x480) on the figure fixes the whole cluster in one rule.
  it("About.vue .about-hero__figure reserves aspect-ratio (800 / 480)", () => {
    const src = stripComments(read(ABOUT_VUE))
    const block = src.match(/\.about-hero__figure\s*\{([^}]*)\}/)
    expect(block, '.about-hero__figure rule block not found').not.toBeNull()
    expect(block[1]).toMatch(/aspect-ratio:\s*800\s*\/\s*480/)
  })
})

describe('#335 Group I — App.vue main-content reserves viewport for the footer', () => {
  // The dominant About CLS source (re-diagnosed from the saved layout-shifts
  // audit) was the GLOBAL footer shifting when a lazy route chunk (About,
  // Services, ...) rendered after first paint. App.vue's <main> had flex:1
  // but no min-height, so while a lazy chunk was loading the router-view was
  // empty, main collapsed, and the footer rode up the page — then dropped to
  // its real position when the chunk rendered (0.0968 desktop / 0.1422 mobile
  // on /about). Reserving min-height:100vh on main pins the footer at-or-below
  // the fold from the first frame. This was the single load-bearing rule that
  // took all 4 route×device combos to CLS < 0.1.
  it("App.vue .main-content reserves min-height: 100vh", () => {
    const src = stripComments(read(path.join(ROOT, 'src/App.vue')))
    const block = src.match(/\.main-content\s*\{([^}]*)\}/)
    expect(block, '.main-content rule block not found').not.toBeNull()
    expect(block[1]).toMatch(/min-height:\s*100vh/)
  })
})

describe('#335 Group F — no-regression: font tokens unchanged', () => {
  // The @font-face family names MUST match the variables.css tokens so the
  // var(--font-display) / var(--font-body) consumers actually resolve to the
  // self-hosted faces. If someone "cleans up" the tokens to drop the family
  // name, every font-family: var(--font-*) declaration silently falls back.
  it("variables.css STILL defines --font-display as 'Orbitron'", () => {
    const src = stripComments(read(VARIABLES_CSS))
    expect(src).toMatch(/--font-display:\s*'Orbitron'/)
  })

  it("variables.css STILL defines --font-body as 'Rajdhani'", () => {
    const src = stripComments(read(VARIABLES_CSS))
    expect(src).toMatch(/--font-body:\s*'Rajdhani'/)
  })
})
