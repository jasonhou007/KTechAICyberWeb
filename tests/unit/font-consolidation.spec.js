/**
 * @file font-consolidation.spec.js
 * @description Font-variable consolidation regression test for Issue #188.
 * @ticket #188
 *
 * Two invariants this gate protects:
 *
 * 1. CORRECT FONT VARIABLE VALUES. variables.css historically declared
 *    --font-display: 'Clash Display' and --font-body: 'Satoshi' — fonts that
 *    are NEVER @font-face loaded and never <link>-ed (only Orbitron + Rajdhani
 *    are loaded via the Google Fonts link in index.html). Every component that
 *    wrote `font-family: var(--font-display)` therefore resolved to the
 *    fallback (system-ui) — i.e. the cyber display font was silently broken
 *    across ~30 components. #188 corrects the variable values to the fonts
 *    that are actually loaded.
 *
 * 2. CONSOLIDATION ONTO THE VARIABLES. 259 hardcoded `font-family: 'Orbitron'`
 *    (117) + `'Rajdhani'` (142) declarations across ~57 .vue scoped styles are
 *    replaced with var(--font-display)/var(--font-body). The 4 intentional
 *    `'Courier New'` terminal-monospace declarations (NeuralCore,
 *    NeuralTerminal, SolutionForge, cyber.css body) are preserved.
 *
 * Pattern mirrors PacketRoute.visual-ac.test.ts (#184): read the source,
 * strip comments (so a commented-out hardcoded font cannot masquerade as
 * consolidated), assert against regexes.
 *
 * RED-TEST PROOF: against origin/main @ c672d06:
 *   - variables.css has 'Clash Display'/'Satoshi' (assertions fail)
 *   - 117 + 142 = 259 hardcoded font-family hits in scoped styles (assertions fail)
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const VARIABLES_CSS = resolve(ROOT, 'src/assets/styles/variables.css')
const SRC_DIR = resolve(ROOT, 'src')

/** Strip comments so they cannot masquerade as active CSS. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

/** Recursively collect all .vue files under a directory. */
function listVueFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      listVueFiles(full, acc)
    } else if (entry.name.endsWith('.vue')) {
      acc.push(full)
    }
  }
  return acc
}

describe('font variable values corrected (#188)', () => {
  // RED today: 'Clash Display' / 'Satoshi' (never loaded). GREEN after fix:
  // 'Orbitron' / 'Rajdhani' (loaded via Google Fonts link in index.html).
  it("variables.css defines --font-display as 'Orbitron'", () => {
    const src = stripComments(readFileSync(VARIABLES_CSS, 'utf-8'))
    expect(src).toMatch(/--font-display:\s*'Orbitron'/)
  })

  it("variables.css defines --font-body as 'Rajdhani'", () => {
    const src = stripComments(readFileSync(VARIABLES_CSS, 'utf-8'))
    expect(src).toMatch(/--font-body:\s*'Rajdhani'/)
  })
})

describe('scoped styles consolidated onto font variables (#188)', () => {
  // For each .vue, strip comments then assert ZERO hardcoded Orbitron/Rajdhani
  // font-family declarations. (The variable definitions live in variables.css,
  // not in .vue files, so any 'Orbitron'/'Rajdhani' literal inside a .vue is a
  // missed consolidation site.)
  const vueFiles = listVueFiles(SRC_DIR)

  it('found .vue files to scan (sanity)', () => {
    expect(vueFiles.length).toBeGreaterThan(50)
  })

  it("ZERO scoped styles hardcode font-family: 'Orbitron' (baseline 116 pure hardcodes)", () => {
    const offenders = []
    for (const f of vueFiles) {
      const src = stripComments(readFileSync(f, 'utf-8'))
      const matches = src.match(/font-family:\s*'Orbitron'/g) || []
      if (matches.length) offenders.push({ file: path.relative(ROOT, f), count: matches.length })
    }
    const total = offenders.reduce((s, o) => s + o.count, 0)
    console.log('\n[font-consolidation] Orbitron pure hardcodes remaining:', total, offenders)
    expect(total).toBe(0)
  })

  it("ZERO scoped styles hardcode font-family: 'Rajdhani' (baseline 140 pure hardcodes)", () => {
    const offenders = []
    for (const f of vueFiles) {
      const src = stripComments(readFileSync(f, 'utf-8'))
      const matches = src.match(/font-family:\s*'Rajdhani'/g) || []
      if (matches.length) offenders.push({ file: path.relative(ROOT, f), count: matches.length })
    }
    const total = offenders.reduce((s, o) => s + o.count, 0)
    console.log('\n[font-consolidation] Rajdhani pure hardcodes remaining:', total, offenders)
    expect(total).toBe(0)
  })

  it("NO 'Orbitron'/'Rajdhani' literal remains anywhere in .vue scoped styles (incl. var fallbacks)", () => {
    // Stricter gate mirroring the plan's final grep: after consolidation +
    // simplifying the var(--font-display, 'Orbitron', ...) fallbacks, NO
    // 'Orbitron'/'Rajdhani' literal should appear in any .vue file's scoped
    // <style>. (The only legitimate remaining sites are variables.css
    // definitions + the Google Fonts <link> in index.html, neither of which
    // is a .vue file.)
    const offenders = []
    for (const f of vueFiles) {
      const src = stripComments(readFileSync(f, 'utf-8'))
      const hits = (src.match(/'Orbitron'|'Rajdhani'/g) || []).length
      if (hits) offenders.push({ file: path.relative(ROOT, f), count: hits })
    }
    const total = offenders.reduce((s, o) => s + o.count, 0)
    console.log('\n[font-consolidation] any Orbitron/Rajdhani literal remaining in .vue:', total, offenders)
    expect(total).toBe(0)
  })

  it("does NOT over-purge: 'Courier New' terminal monospace preserved (>= 4)", () => {
    // NeuralCore, NeuralTerminal, SolutionForge terminal blocks + cyber.css
    // body — intentional monospace. Proves consolidation was targeted, not a
    // blanket font-family rewrite.
    let count = 0
    for (const f of vueFiles) {
      const src = stripComments(readFileSync(f, 'utf-8'))
      const matches = src.match(/'Courier New'/g) || []
      count += matches.length
    }
    // Also count cyber.css (not a .vue but is an intentional Courier New site).
    const cyberSrc = stripComments(
      readFileSync(resolve(ROOT, 'src/assets/styles/cyber.css'), 'utf-8')
    )
    count += (cyberSrc.match(/'Courier New'/g) || []).length
    console.log('\n[font-consolidation] Courier New preserved count:', count)
    expect(count).toBeGreaterThanOrEqual(4)
  })

  it('consolidation REPLACED (not deleted): var(--font-display) usages grew (>= 139)', () => {
    // If someone deletes the Orbitron lines instead of replacing them with
    // var(--font-display), this count collapses. Baseline bare-form usages =
    // 22 (2 more exist in var-fallback form, simplified to bare in #188);
    // +116 consolidated Orbitron hardcodes + 1 fallback-converted = 139.
    let count = 0
    for (const f of vueFiles) {
      const src = stripComments(readFileSync(f, 'utf-8'))
      count += (src.match(/var\(--font-display\)/g) || []).length
    }
    console.log('\n[font-consolidation] var(--font-display) usages:', count)
    expect(count).toBeGreaterThanOrEqual(139)
  })

  it('consolidation REPLACED (not deleted): var(--font-body) usages grew (>= 140)', () => {
    // Baseline bare-form var(--font-body) = 11 (2 more in var-fallback form);
    // +140 consolidated Rajdhani hardcodes - 2 fallback-converted = 149.
    // Threshold set conservatively at 140.
    let count = 0
    for (const f of vueFiles) {
      const src = stripComments(readFileSync(f, 'utf-8'))
      count += (src.match(/var\(--font-body\)/g) || []).length
    }
    console.log('\n[font-consolidation] var(--font-body) usages:', count)
    expect(count).toBeGreaterThanOrEqual(140)
  })
})
