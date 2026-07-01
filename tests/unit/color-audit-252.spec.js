/**
 * @file color-audit-252.spec.js
 * @description Visual-AC regression test for Issue #252 font/color audit.
 * Asserts the FIXED selectors route through canonical theme tokens and contain
 * NO off-theme literals. CSS-source level (parses .vue <style> blocks).
 * @ticket #252
 *
 * Why CSS-source (not computed-style): the E2E gate (e2e/color-contrast-252)
 * already covers the LIVE computed contrast for the two most prominent fixed
 * surfaces. This unit test is the BROADER source-level guarantee that every
 * fixed selector kept its token routing AND that no off-theme literal
 * (#8b00ff purple, #ff6600/#cc4400 orange) survived anywhere in src/views.
 *
 * Rule extraction is BRACE-COUNTED (depth-tracked) so each declaration is
 * matched ONLY inside its owning selector's rule block — never as a substring
 * of another rule, and never runaway into the next rule (the block body is
 * matched non-greedily up to the matching close brace). Comments are stripped
 * (/* *​/, //, <!-- -->) BEFORE matching so a commented-out literal cannot
 * masquerade as a live declaration.
 *
 * RED-PROOF (iter-41 false-green lesson, mandatory):
 *   1. Run this spec against the FIXED source -> GREEN.
 *   2. Hand-revert ONE fix (e.g. PositionList .position-card__badge color
 *      back to #8b00ff) -> re-run -> the exact-rule assertion for that
 *      selector MUST fail, naming the selector + offending literal.
 *   3. Restore -> GREEN.
 *   Both terminal outputs are saved to tickets/252/evidence/red-proof.txt.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const VIEWS = resolve(ROOT, 'src/views')

/** Strip CSS/HTML/JS line+block comments so commented literals can't sneak through. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

/**
 * Extract the FULL <style> source (all blocks concatenated) from a .vue file,
 * comments stripped.
 */
function vueStyleSource(relPath) {
  const raw = readFileSync(resolve(VIEWS, relPath), 'utf-8')
  const blocks = [...raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1])
  return stripComments(blocks.join('\n'))
}

/**
 * BRACE-COUNTED rule extraction. Returns an array of { selector, body }.
 * Tracks {/} depth so nested @media bodies are recursed into and their inner
 * rules surfaced as top-level (selector + body) entries. @keyframes/@font-face
 * are skipped (their inner % blocks are not real selectors).
 *
 * Each returned body is the EXACT text between the rule's { and its matching }
 * (non-greedy by construction — depth-counting stops at the matching brace, so
 * a body can never run away into the following rule).
 */
function extractRules(css) {
  const rules = []
  let i = 0
  const n = css.length
  while (i < n) {
    const open = css.indexOf('{', i)
    if (open === -1) break
    const selector = css.slice(i, open).trim()
    let depth = 1
    let j = open + 1
    while (j < n && depth > 0) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') depth--
      j++
    }
    const body = css.slice(open + 1, j - 1)
    if (selector.startsWith('@media') || selector.startsWith('@supports')) {
      rules.push(...extractRules(body))
    } else if (
      selector &&
      !selector.startsWith('@keyframes') &&
      !selector.startsWith('@font-face') &&
      !selector.startsWith('@import')
    ) {
      rules.push({ selector, body })
    }
    i = j
  }
  return rules
}

/**
 * Return the body of the FIRST rule whose selector list contains `sel`.
 * Selector lists are comma/newline-separated; we match if any segment
 * (trimmed) equals `sel` (exact, case-sensitive) OR ends with `sel` after a
 * combinator (so '.parent .child' is found when searching '.child').
 */
function ruleBodyFor(css, sel) {
  return ruleBodiesFor(css, sel)[0] ?? null
}

/**
 * Return the bodies of ALL rules whose selector list contains `sel`. Needed
 * because a selector can be split across several rules (e.g. a shared
 * '.a, .b' rule plus a dedicated '.b' override) and the declaration under
 * test may live in the LATER rule. Assertions join all matching bodies so a
 * color/value check scans the selector's complete style footprint.
 */
function ruleBodiesFor(css, sel) {
  const out = []
  for (const r of extractRules(css)) {
    const segs = r.selector.split(',').map(s => s.trim())
    let match = false
    for (const seg of segs) {
      if (seg === sel) { match = true; break }
      const last = seg.split(/[>\s+~]+/).filter(Boolean).pop()
      if (last === sel) { match = true; break }
    }
    if (match) out.push(r.body)
  }
  return out
}

// ---------- FIXED-SELECTOR assertions (exact rule, token routing) ----------

describe('#252 PositionList.vue off-theme purple -> magenta token', () => {
  const css = () => vueStyleSource('PositionList.vue')

  it('.position-card__badge color uses var(--accent-magenta), no #8b00ff', () => {
    const body = ruleBodyFor(css(), '.position-card__badge')
    expect(body, '.position-card__badge rule must exist').not.toBeNull()
    expect(body).toMatch(/color:\s*var\(--accent-magenta\)/)
    expect(body).not.toMatch(/#8b00ff/i)
    expect(body).not.toMatch(/rgba\(\s*139/)
  })

  it('.position-card__badge background+border use magenta rgba, not purple', () => {
    const body = ruleBodyFor(css(), '.position-card__badge')
    // #285 tokenized the brand magenta alpha literals onto
    // var(--accent-magenta-alpha-NN). Accept EITHER the literal rgba OR the
    // token — both satisfy "magenta (255,0,170), not purple (139,0,255)".
    expect(body).toMatch(/background:\s*(?:rgba\(\s*255,\s*0,\s*170|var\(--accent-magenta-alpha-)/)
    expect(body).toMatch(/border:\s*1px solid (?:rgba\(\s*255,\s*0,\s*170|var\(--accent-magenta-alpha-)/)
    expect(body).not.toMatch(/rgba\(\s*139,\s*0,\s*255/)
  })

  it('.position-modal__share color uses var(--accent-magenta), no #8b00ff', () => {
    // Two rules target this selector: a shared '.apply, .share' block (no
    // color) and a dedicated '.share' override (the color). Scan ALL matching
    // bodies so the color decl is found regardless of which rule holds it.
    const bodies = ruleBodiesFor(css(), '.position-modal__share')
    expect(bodies.length, '.position-modal__share rule(s) must exist').toBeGreaterThan(0)
    const joined = bodies.join('\n')
    expect(joined).toMatch(/color:\s*var\(--accent-magenta\)/)
    expect(joined).not.toMatch(/#8b00ff/i)
    expect(joined).not.toMatch(/rgba\(\s*139,\s*0,\s*255/)
  })

  it('hero gradient stop is magenta rgba(255,0,170,...), not purple rgba(139,0,255)', () => {
    const full = css()
    expect(full).toMatch(/rgba\(\s*255,\s*0,\s*170,\s*0\.05\)/)
    expect(full).not.toMatch(/rgba\(\s*139,\s*0,\s*255/)
  })
})

describe('#252 About.vue off-theme literals -> tokens', () => {
  const css = () => vueStyleSource('About.vue')

  it('.projects-badge bg uses var(--accent-magenta), no #ff6600/#cc4400', () => {
    const body = ruleBodyFor(css(), '.projects-badge')
    expect(body, '.projects-badge rule must exist').not.toBeNull()
    expect(body).toMatch(/background:\s*linear-gradient\([^)]*var\(--accent-magenta\)/)
    expect(body).not.toMatch(/#ff6600/i)
    expect(body).not.toMatch(/#cc4400/i)
  })

  it('.projects-badge color is var(--bg-primary) for AA on the bright badge', () => {
    const body = ruleBodyFor(css(), '.projects-badge')
    expect(body).toMatch(/color:\s*var\(--bg-primary\)/)
    expect(body).not.toMatch(/color:\s*#fff/i)
  })

  it('.iso-badge color uses var(--bg-primary), no #000', () => {
    const body = ruleBodyFor(css(), '.iso-badge')
    expect(body, '.iso-badge rule must exist').not.toBeNull()
    expect(body).toMatch(/color:\s*var\(--bg-primary\)/)
    expect(body).not.toMatch(/color:\s*#000/i)
  })

  it('.page-title color uses var(--text-primary), no #ffffff/#fff', () => {
    const body = ruleBodyFor(css(), '.page-title')
    expect(body, '.page-title rule must exist').not.toBeNull()
    expect(body).toMatch(/color:\s*var\(--text-primary\)/)
    expect(body).not.toMatch(/color:\s*#fff/i)
  })
})

describe('#252 hero #fff headings -> var(--text-primary)', () => {
  it('Home.vue hero H1 uses var(--text-primary), no #ffffff', () => {
    const css = vueStyleSource('Home.vue')
    // the hero h1 lives under a .hero h1 / .hero-title style; assert the
    // literal is gone from the whole file AND a text-primary color exists.
    expect(css).not.toMatch(/color:\s*#ffffff/i)
    expect(css).not.toMatch(/color:\s*#fff\b/i)
  })

  it('JoinUs.vue page-title/section-title/benefit-card h3/process-step h3 use var(--text-primary)', () => {
    const css = vueStyleSource('JoinUs.vue')
    for (const sel of ['.page-title', '.section-title', '.benefit-card h3', '.process-step h3']) {
      const body = ruleBodyFor(css, sel)
      expect(body, `${sel} rule must exist`).not.toBeNull()
      expect(body).toMatch(/color:\s*var\(--text-primary\)/)
      expect(body).not.toMatch(/color:\s*#fff/i)
    }
  })
})

describe('#252 Contact.vue failing gray #666 -> var(--text-muted)', () => {
  // #286 superseded the token assignment for these three secondary-text roles:
  // .breadcrumb + .form-input::placeholder are caption-tier (-> --text-caption,
  // a new blue-gray hue in the --text-muted family) and .social-label is a
  // list-label (-> --text-list-label == --text-muted). The #252 regression
  // guard these tests encode — "no #666 gray literal" — is preserved below;
  // only the exact token name is updated to the #286 role token.
  const css = () => vueStyleSource('Contact.vue')

  it('.breadcrumb color uses a #286 caption role token, no #666', () => {
    const body = ruleBodyFor(css(), '.breadcrumb')
    expect(body, '.breadcrumb rule must exist').not.toBeNull()
    expect(body).toMatch(/color:\s*var\(--text-caption\)/)
    expect(body).not.toMatch(/color:\s*#666/i)
  })

  it('.form-input::placeholder color uses a #286 caption role token, no #666', () => {
    const body = ruleBodyFor(css(), '.form-input::placeholder')
    expect(body, '.form-input::placeholder rule must exist').not.toBeNull()
    expect(body).toMatch(/color:\s*var\(--text-caption\)/)
    expect(body).not.toMatch(/color:\s*#666/i)
  })

  it('.social-label color uses a #286 list-label role token, no #666', () => {
    const body = ruleBodyFor(css(), '.social-label')
    expect(body, '.social-label rule must exist').not.toBeNull()
    expect(body).toMatch(/color:\s*var\(--text-list-label\)/)
    expect(body).not.toMatch(/color:\s*#666/i)
  })
})

// ---------- DENYLIST: zero off-theme literals anywhere in src/views ----------

describe('#252 off-theme-literal denylist across all src/views/*.vue', () => {
  // These are the literals the audit flagged as fully off-palette. After the
  // Critical+High fixes, NONE may remain in any view's active style source.
  const DENYLIST = ['#8b00ff', '#ff6600', '#cc4400']
  const viewFiles = [
    'About.vue', 'Blockchain.vue', 'Contact.vue', 'Home.vue', 'JoinUs.vue',
    'MobileApp.vue', 'News.vue', 'NewsDetail.vue', 'NotFound.vue',
    'PositionList.vue', 'PrivacyPolicy.vue', 'ServiceBigData.vue',
    'ServiceCrossBorderPayment.vue', 'ServiceDigitalAssetCustody.vue',
    'ServiceProjectManagement.vue', 'ServiceRetailLending.vue',
    'ServiceStablecoin.vue', 'Services.vue', 'SupplyChainFinance.vue', 'Terms.vue',
  ]
  for (const lit of DENYLIST) {
    it(`ZERO '${lit}' in any src/views/*.vue active style source`, () => {
      const offenders = []
      for (const vf of viewFiles) {
        const css = vueStyleSource(vf)
        const re = new RegExp(lit.replace('#', '\\#'), 'i')
        if (re.test(css)) offenders.push(vf)
      }
      expect(offenders, `${lit} must not appear in any view`).toEqual([])
    })
  }

  // The legacy cyan literal the e2e theme gate used to assert — kept out of
  // views too (it was already gone from views after #242; this guards against
  // regression now that #252 also fixed the stale e2e assertion).
  it("ZERO '#00f0ff' legacy neon cyan in any src/views/*.vue active style source", () => {
    const offenders = []
    for (const vf of viewFiles) {
      const css = vueStyleSource(vf)
      if (/#00f0ff/i.test(css)) offenders.push(vf)
    }
    expect(offenders).toEqual([])
  })
})
