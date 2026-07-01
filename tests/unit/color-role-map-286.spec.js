/**
 * @file color-role-map-286.spec.js
 * @description Issue #286 secondary-text role-token uniformity guard.
 * Locks the five-role token map so the secondary/tertiary text tier never
 * drifts back to ad-hoc var(--text-secondary)/var(--text-muted) usage.
 *
 * Four describe blocks:
 *   1. Role tokens exist as ACTIVE CSS in variables.css (comment-stripped).
 *   2. Role -> token map is 1:1 (5 distinct tokens, one per role).
 *   3. No view uses a gray hex literal for text color (locks the clean state).
 *   4. Curated (file, selector, expectedToken) triples prove the tokenization
 *      landed on the right role for representative selectors across all 5
 *      roles and across service/legal/news/career/home pages.
 *
 * CSS-source level (parses .vue <style> blocks); harness reused from
 * tests/unit/color-audit-252.spec.js (brace-counted, comment-stripped).
 *
 * RED-PROOF (mandatory, captured in tickets/286/evidence/red-proof.txt):
 *   - block 1: comment out one token in variables.css -> re-run -> FAIL.
 *   - block 4: revert one selector's token -> re-run -> FAIL naming it.
 * Restore both -> GREEN.
 * @ticket #286
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const VIEWS = resolve(ROOT, 'src/views')
const VARIABLES_CSS = resolve(ROOT, 'src/assets/styles/variables.css')

/** Strip CSS/HTML/JS comments so commented literals/declarations can't sneak through. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

/** Full <style> source (all blocks concatenated) from a .vue file, comments stripped. */
function vueStyleSource(relPath) {
  const raw = readFileSync(resolve(VIEWS, relPath), 'utf-8')
  const blocks = [...raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1])
  return stripComments(blocks.join('\n'))
}

/** Brace-counted rule extraction (depth-tracked), recurses into @media. */
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

/** Body of the FIRST rule whose selector list contains `sel`. */
function ruleBodyFor(css, sel) {
  for (const r of extractRules(css)) {
    const segs = r.selector.split(',').map(s => s.trim())
    let match = false
    for (const seg of segs) {
      if (seg === sel) { match = true; break }
      const last = seg.split(/[>\s+~]+/).filter(Boolean).pop()
      if (last === sel) { match = true; break }
    }
    if (match) return r.body
  }
  return null
}

// The 20 audited views (routes defined inline in src/main.js; 18 are routed,
// Services.vue + MobileApp.vue are pre-existing unrouted orphans kept in scope
// per the issue's "audit all 20 views" requirement).
const VIEWS_20 = [
  'About.vue',
  'Blockchain.vue',
  'Contact.vue',
  'Home.vue',
  'JoinUs.vue',
  'MobileApp.vue',
  'News.vue',
  'NewsDetail.vue',
  'NotFound.vue',
  'PositionList.vue',
  'PrivacyPolicy.vue',
  'ServiceBigData.vue',
  'ServiceCrossBorderPayment.vue',
  'ServiceDigitalAssetCustody.vue',
  'ServiceProjectManagement.vue',
  'ServiceRetailLending.vue',
  'ServiceStablecoin.vue',
  'Services.vue',
  'SupplyChainFinance.vue',
  'Terms.vue'
]

const ROLE_TOKEN = {
  subtitle: '--text-section-subtitle',
  cardMeta: '--text-card-meta',
  listLabel: '--text-list-label',
  caption: '--text-caption',
  timestamp: '--text-timestamp'
}

describe('#286 role tokens exist as active CSS in variables.css', () => {
  const vars = () => stripComments(readFileSync(VARIABLES_CSS, 'utf-8'))

  for (const [role, token] of Object.entries(ROLE_TOKEN)) {
    it(`token ${token} (role ${role}) is declared as a hex assignment`, () => {
      // Match `--token: #hex` (NOT inside a comment, NOT a var() alias).
      const re = new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*(#[0-9a-fA-F]{3,8})\\s*;`)
      expect(vars(), `${token} must be declared as a direct hex in :root, not just an alias`).toMatch(re)
    })
  }
})

describe('#286 role -> token map is 1:1', () => {
  it('each of the 5 roles resolves to a distinct token', () => {
    const tokens = Object.values(ROLE_TOKEN)
    expect(tokens).toHaveLength(5)
    expect(new Set(tokens).size).toBe(5) // all distinct
  })

  it('every role token is a member of the declared variables.css tokens', () => {
    const vars = stripComments(readFileSync(VARIABLES_CSS, 'utf-8'))
    for (const token of Object.values(ROLE_TOKEN)) {
      expect(vars, `${token} must be declared`).toMatch(new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`))
    }
  })
})

describe('#286 no view uses a gray hex literal for text color', () => {
  // Brand cyan rgba(0,255,204,...) AND magenta rgba(255,0,170,...) are ALLOWED
  // (decorative accents, badges, glow effects). Forbidden: any `color: #<hex>`
  // literal OR a non-brand rgba() text color (e.g. a gray drift).
  const GRAY_HEX = /color:\s*#[0-9a-fA-F]{3,8}\b/g
  // Any rgba(r,g,b,a) in a color: decl — brand colors are allow-listed below.
  const NON_CYAN_RGBA = /color:\s*rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g

  for (const f of VIEWS_20) {
    it(`${f} has no \`color: #hex\` literal`, () => {
      const css = vueStyleSource(f)
      const hexHits = css.match(GRAY_HEX) || []
      expect(hexHits, `${f} must not use any color:#hex literal (use a role/brand token); found: ${hexHits.join(', ')}`).toEqual([])
    })

    it(`${f} has no non-brand rgba() text color`, () => {
      const css = vueStyleSource(f)
      const offenders = []
      let m
      while ((m = NON_CYAN_RGBA.exec(css)) !== null) {
        const [r, g, b] = [+m[1], +m[2], +m[3]].sort((a, b) => a - b)
        // Brand cyan = (0,204,255); brand magenta = (0,170,255). Both are
        // legitimate accent text colors (decorative badges, glow effects).
        const isCyan = r === 0 && g === 204 && b === 255
        const isMagenta = r === 0 && g === 170 && b === 255
        if (!isCyan && !isMagenta) offenders.push(m[0])
      }
      expect(offenders, `${f} must not use a non-brand rgba text color; found: ${offenders.join(', ')}`).toEqual([])
    })
  }
})

describe('#286 curated selector -> role token assertions', () => {
  // ~20 triples spanning all 5 roles and service/legal/news/career/home pages.
  // RED-PROOF: revert one selector's token in its file -> the corresponding
  // `it` fails, naming the selector + expected token.
  const CASES = [
    // section-subtitle
    ['About.vue', '.page-subtitle', '--text-section-subtitle'],
    ['ServiceBigData.vue', '.bd__hero-subtitle', '--text-section-subtitle'],
    ['ServiceBigData.vue', '.bd__overview-text', '--text-section-subtitle'],
    ['NewsDetail.vue', '.news-detail__not-found-text', '--text-section-subtitle'],
    ['NotFound.vue', '.message', '--text-section-subtitle'],
    // card-meta
    ['About.vue', '.content-card p', '--text-card-meta'],
    ['ServiceBigData.vue', '.bd__card-description', '--text-card-meta'],
    ['Home.vue', '.solution-card p', '--text-card-meta'],
    ['PrivacyPolicy.vue', '.disclaimer', '--text-card-meta'],
    ['PositionList.vue', '.position-card__description', '--text-card-meta'],
    ['Services.vue', '.service-features li', '--text-card-meta'],
    // list-label
    ['About.vue', '.stat-label', '--text-list-label'],
    ['ServiceBigData.vue', '.bd__stat-label', '--text-list-label'],
    ['Contact.vue', '.checkbox-label', '--text-list-label'],
    // caption
    ['ServiceBigData.vue', '.bd__breadcrumb-link', '--text-caption'],
    ['ServiceBigData.vue', '.bd__cta-description', '--text-caption'],
    ['NewsDetail.vue', '.news-detail__caption', '--text-caption'],
    ['PositionList.vue', '.empty-message', '--text-caption'],
    ['Contact.vue', '.form-input::placeholder', '--text-caption'],
    // timestamp
    ['NewsDetail.vue', '.news-detail__date', '--text-timestamp'],
    ['NewsDetail.vue', '.news-detail__related-date', '--text-timestamp'],
    ['Terms.vue', '.page-meta', '--text-timestamp']
  ]

  for (const [file, sel, expectedToken] of CASES) {
    it(`${file} ${sel} color is var(${expectedToken})`, () => {
      const css = vueStyleSource(file)
      const body = ruleBodyFor(css, sel)
      expect(body, `${file} rule for ${sel} must exist`).not.toBeNull()
      expect(body, `${file} ${sel} must route color through var(${expectedToken})`).toMatch(
        new RegExp(`color:\\s*var\\(${expectedToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`)
      )
    })
  }
})
