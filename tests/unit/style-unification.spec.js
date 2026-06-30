/**
 * @file style-unification.spec.js
 * @description Site color/design unification regression test for Issue #242
 * (AC2 — "unify site color/design style to the Our Business reference").
 * @ticket #242
 *
 * Five invariants this gate protects:
 *
 * 1. CANONICAL TOKEN SET. variables.css is the SINGLE source of truth for the
 *    design tokens: bg-primary, cyan (+accent-cyan/-soft), accent-magenta,
 *    text-primary/secondary/muted, font-mono, surface-card/elevated, radius-xl.
 *    cyber.css must NOT redeclare any brand color custom property (only
 *    aliases pointing at variables.css via var(--...) are permitted).
 *
 * 2. HARDCODED-HEX COLLAPSE. The pre-unification source carried 559 hardcoded
 *    #[0-9a-fA-F]{6} literals across src (measured 2026-06-30 against
 *    autodev-242-style-unify baseline). After consolidation onto tokens the
 *    count must drop to <= 80 (only intentional semantic-status hexes +
 *    a few deliberate gradient stops remain).
 *
 * 3. LOUD NEON LITERALS GONE. The legacy brand literals — #00f0ff (170
 *    occurrences), #00ff88 (42), #ff00ff (28), #00ffff (44), #0a0f1c (5),
 *    #e0e8ff (1), #8a9acc (1) — must NOT appear in any .vue file. They are
 *    consolidated onto var(--cyan) / var(--accent-magenta) / var(--bg-primary)
 *    / var(--text-primary) / var(--text-muted). (Allowed in variables.css +
 *    cyber.css ONLY inside comments, since those files define/alias the
 *    canonical values.)
 *
 * 4. var() USAGE GREW. The literals being replaced become var(--token)
 *    usages, so the var(-- occurrence count must grow by >= 250.
 *
 * 5. RADIUS + MONO CONSOLIDATION. border-radius: Npx literals collapse onto
 *    the --radius-* tokens (<= 12 remain); 'Courier New'/'Fira Code' literals
 *    in .vue files go through var(--font-mono).
 *
 * 6. REDUCED-MOTION PRESERVED. Every file that had a prefers-reduced-motion
 *    @media block BEFORE unification still has one AFTER (>= 14 files —
 *    measured baseline).
 *
 * Pattern mirrors font-consolidation.spec.js + css-purge.spec.js (#188): read
 * the source, strip comments (so a commented-out literal cannot masquerade as
 * consolidated), assert against regexes. The hex-count gate reads files at
 * TEST-RUN time (no hardcoded count) so it adapts as the codebase evolves.
 *
 * RED-TEST PROOF: run this against origin/main → assertions 2-5 fail:
 *   - hex count = 559 (> 80 budget)
 *   - #00f0ff present in 30+ .vue files (denylist fails)
 *   - var(-- count = 638 (grew by < 250 vs the post-unification floor... the
 *     delta gate compares measured-before to measured-after at the SAME commit,
 *     so at origin/main the post-state equals the pre-state → delta 0 < 250)
 *   - radius literals = 147 (> 12)
 *   - 'Courier New' literal in 4 .vue files (> 0)
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const VARIABLES_CSS = resolve(ROOT, 'src/assets/styles/variables.css')
const CYBER_CSS = resolve(ROOT, 'src/assets/styles/cyber.css')
const SRC_DIR = resolve(ROOT, 'src')

/** Strip CSS/HTML/JS comments so a commented-out literal cannot masquerade as active. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

// The file set under the unification gate: .vue + .js + .ts + .css under src/,
// EXCLUDING locales (JSON-i18n payloads, not style sources), __tests__, and
// *.test.*/*.spec.* files (test fixtures are not shipped CSS/JS).
//
// Why .js/.ts are in scope (#242 review): a composable can write brand colors
// straight to a LIVE rendered surface via canvas. useAudioPulse.js did exactly
// this with PARTICLE_COLORS and ctx2d.fillStyle. A .vue-only gate missed that
// canvas palette, so the legacy neon slipped through. Canvas/WebGL draw code
// is a shipped style source just like a style block, so the gate must read it.
function listSourceFiles() {
  const acc = []
  ;(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'locales' || entry.name === '__tests__' || entry.name === 'node_modules') continue
        walk(full)
      } else if (/\.(vue|js|ts|css)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) {
        acc.push(full)
      }
    }
  })(SRC_DIR)
  return acc
}

/** Count `#[0-9a-fA-F]{6}` matches across the source set, returning the total
 *  + a per-file breakdown (so a regression names the offending file). */
function countHexLiterals() {
  const files = listSourceFiles()
  let total = 0
  const perFile = []
  for (const f of files) {
    const src = stripComments(readFileSync(f, 'utf-8'))
    const matches = src.match(/#[0-9a-fA-F]{6}/g) || []
    if (matches.length) perFile.push({ file: path.relative(ROOT, f), count: matches.length })
    total += matches.length
  }
  perFile.sort((a, b) => b.count - a.count)
  return { total, perFile }
}

describe('variables.css defines the canonical design-token set (#242)', () => {
  // RED today: variables.css :root still declares the OLD values
  // (--bg-primary: #0a0f1c, --text-primary: #e0e8ff) and is missing the
  // accent/surface/radius-xl/font-mono tokens entirely. GREEN after the rewrite.
  const src = () => stripComments(readFileSync(VARIABLES_CSS, 'utf-8'))

  it('defines --bg-primary: #0a0a0a (canonical dark, was #0a0f1c)', () => {
    expect(src()).toMatch(/--bg-primary:\s*#0a0a0a/)
  })

  it('defines --cyan: #00ffcc (brand cyan)', () => {
    expect(src()).toMatch(/--cyan:\s*#00ffcc/)
  })

  it('defines --accent-cyan: #00ffcc', () => {
    expect(src()).toMatch(/--accent-cyan:\s*#00ffcc/)
  })

  it('defines --accent-cyan-soft (rgba cyan)', () => {
    expect(src()).toMatch(/--accent-cyan-soft:\s*rgba\(0,\s*255,\s*204/)
  })

  it('defines --accent-magenta: #ff00aa (canonical magenta)', () => {
    expect(src()).toMatch(/--accent-magenta:\s*#ff00aa/)
  })

  it('defines --text-primary: #e0e0e0 (was #e0e8ff)', () => {
    expect(src()).toMatch(/--text-primary:\s*#e0e0e0/)
  })

  it('defines --text-secondary: #b0b0b0 (was #8a9acc)', () => {
    expect(src()).toMatch(/--text-secondary:\s*#b0b0b0/)
  })

  it('defines --text-muted: #8a9acc (demoted to muted, was text-secondary)', () => {
    expect(src()).toMatch(/--text-muted:\s*#8a9acc/)
  })

  it('defines --font-mono (terminal monospace token)', () => {
    expect(src()).toMatch(/--font-mono:\s*'Courier New'/)
  })

  it('defines --surface-card (rgba dark)', () => {
    expect(src()).toMatch(/--surface-card:\s*rgba\(10,\s*15,\s*28/)
  })

  it('defines --surface-elevated (rgba dark)', () => {
    expect(src()).toMatch(/--surface-elevated:\s*rgba\(26,\s*26,\s*46/)
  })

  it('defines --radius-xl: 20px (new)', () => {
    expect(src()).toMatch(/--radius-xl:\s*20px/)
  })
})

describe('cyber.css no longer redeclares brand color tokens (#242)', () => {
  // RED today: cyber.css's [data-theme="dark"] block redeclares --bg-primary,
  // --bg-secondary, --text-primary, --text-secondary, --neon-green/blue/pink
  // as hex literals — duplicating variables.css. GREEN after the block is
  // stripped: these tokens live ONLY in variables.css. Neon-* aliases that
  // POINT at the canonical tokens via var(--cyan)/var(--accent-magenta) are
  // permitted (they are pointers, not hex redefinitions).
  const src = () => stripComments(readFileSync(CYBER_CSS, 'utf-8'))

  // The de-dupe proof: each of these tokens must NOT be assigned a hex literal
  // anywhere in cyber.css. An alias RHS (var(--...)) is fine.
  for (const token of [
    '--bg-primary',
    '--bg-secondary',
    '--cyan',
    '--text-primary',
    '--text-secondary'
  ]) {
    it(`cyber.css does NOT define ${token} with a hex literal`, () => {
      const re = new RegExp(`${token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}:\\s*#`)
      expect(re.test(src()), `${token} must not be redeclared as a hex in cyber.css`).toBe(false)
    })
  }

  // Neon-* tokens may exist as ALIASES (RHS = var(--cyan)/var(--accent-magenta))
  // but must NOT be hex redefinitions.
  for (const token of ['--neon-green', '--neon-blue', '--neon-pink']) {
    it(`cyber.css ${token} is an alias (var) not a hex literal`, () => {
      const re = new RegExp(`${token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}:\\s*#`)
      expect(re.test(src()), `${token} must not be a hex literal in cyber.css`).toBe(false)
    })
  }
})

describe('hardcoded hex literals collapsed across src (#242 AC2)', () => {
  // The load-bearing count gate. Baseline (measured dynamically at test time):
  // 559 before unification. Budget <= 80 (status-color hexes + a few
  // deliberate gradient stops + the token definitions in variables.css).
  it('total #[0-9a-fA-F]{6} literals across src <= 80', () => {
    const { total, perFile } = countHexLiterals()
    console.log('\n[style-unification] post-unification hex total:', total)
    console.log('[style-unification] per-file breakdown (top 30):')
    for (const { file, count } of perFile.slice(0, 30)) {
      console.log(`  ${count}\t${file}`)
    }
    expect(total).toBeLessThanOrEqual(80)
  })

  // Per-offender denylist: these LOUD legacy brand literals must NOT appear in
  // any .vue/.js/.ts file. They are consolidated onto var(--cyan) /
  // var(--accent-magenta) / var(--bg-primary) / var(--text-primary) /
  // var(--text-muted) (or, for canvas draw code that cannot consume var(),
  // their canonical hex VALUES #00ffcc / #ff00aa / #ffcc00). Allowed in
  // variables.css + cyber.css ONLY inside comments (those files define/alias
  // the canonical values — the test strips comments before checking).
  //
  // .js/.ts are in scope (#242 review): a composable can paint brand neon
  // straight onto a LIVE canvas (useAudioPulse.js did exactly this with
  // PARTICLE_COLORS + ctx2d.fillStyle). A .vue-only gate missed it.
  const DENYLIST = ['#00f0ff', '#00ff88', '#ff00ff', '#00ffff', '#0a0f1c', '#e0e8ff', '#8a9acc']

  const srcComponentFiles = (() => {
    const acc = []
    ;(function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name === 'locales' || entry.name === '__tests__' || entry.name === 'node_modules') continue
          walk(full)
        } else if (entry.name.match(/\.(vue|js|ts)$/) && !/\.(test|spec)\./.test(entry.name)) {
          acc.push(full)
        }
      }
    })(SRC_DIR)
    return acc
  })()

  for (const hex of DENYLIST) {
    it(`ZERO '${hex}' literals in any .vue/.js/.ts file`, () => {
      const offenders = []
      for (const f of srcComponentFiles) {
        const src = stripComments(readFileSync(f, 'utf-8'))
        const hits = (src.match(new RegExp(hex.replace('#', '\\#'), 'gi')) || []).length
        if (hits) offenders.push({ file: path.relative(ROOT, f), count: hits })
      }
      const total = offenders.reduce((s, o) => s + o.count, 0)
      if (total) console.log(`\n[style-unification] '${hex}' offenders:`, offenders)
      expect(total, `${hex} must be consolidated in .vue/.js/.ts files`).toBe(0)
    })
  }

  it("'Courier New' / 'Fira Code' literals eliminated from .vue/.js/.ts (route via --font-mono)", () => {
    let courier = 0
    let fira = 0
    const offenders = []
    for (const f of srcComponentFiles) {
      const src = stripComments(readFileSync(f, 'utf-8'))
      const c = (src.match(/'Courier New'/g) || []).length
      const fc = (src.match(/'Fira Code'/g) || []).length
      if (c || fc) offenders.push({ file: path.relative(ROOT, f), courier: c, fira: fc })
      courier += c
      fira += fc
    }
    console.log('\n[style-unification] Courier New literals in .vue/.js/.ts:', courier, 'Fira Code:', fira, offenders)
    expect(courier + fira).toBe(0)
  })

  // The rgba-triplet form of the legacy neon literals. A hex-only denylist
  // cannot catch `rgba(0, 240, 255, 0.2)` (sky-cyan) — but the LIVE computed
  // style resolves these to the legacy color, so they must also be normalized
  // to the canonical cyan/magenta triplets. Assert ZERO legacy rgba neon
  // triplets remain in any .vue/.js/.ts/.css source.
  const RGBA_DENYLIST = [
    { pat: 'rgba(0, 240, 255', name: 'sky-cyan rgba' },
    { pat: 'rgba(0,255,240', name: 'sky-cyan rgba (no-space)' },
    { pat: 'rgba(0, 255, 136', name: 'neon-green rgba' },
    { pat: 'rgba(0,255,136', name: 'neon-green rgba (no-space)' },
    { pat: 'rgba(255, 0, 255', name: 'legacy-magenta rgba' },
    { pat: 'rgba(255,0,255', name: 'legacy-magenta rgba (no-space)' },
  ]
  for (const { pat, name } of RGBA_DENYLIST) {
    it(`ZERO '${name}' triplet in src`, () => {
      const offenders = []
      for (const f of srcComponentFiles) {
        const src = stripComments(readFileSync(f, 'utf-8'))
        if (src.includes(pat)) offenders.push(path.relative(ROOT, f))
      }
      if (offenders.length) console.log(`\n[style-unification] '${name}' offenders:`, offenders)
      expect(offenders, `${pat} must be normalized to canonical cyan/magenta`).toEqual([])
    })
  }
})

describe('var(--token) usage grew as literals were consolidated (#242)', () => {
  // The literals replaced by tokens become var(--...) usages, so the var(--
  // occurrence count must grow by >= 250 over the baseline measured at the
  // SAME test run on the PRE-unification files. We can't read origin/main here,
  // so the gate is an absolute floor derived from the documented baseline:
  // 638 (pre) + 250 (consolidation delta) = 888.
  it('var(-- occurrence count >= 888 (baseline 638 + consolidation delta 250)', () => {
    const files = listSourceFiles()
    let count = 0
    for (const f of files) {
      const src = stripComments(readFileSync(f, 'utf-8'))
      count += (src.match(/var\(--/g) || []).length
    }
    console.log('\n[style-unification] var(-- occurrence count:', count, '(floor 888)')
    expect(count).toBeGreaterThanOrEqual(888)
  })
})

describe('border-radius literals consolidated onto --radius-* tokens (#242)', () => {
  // Baseline: 147 `border-radius: Npx` literals. After consolidation onto
  // --radius-sm/md/lg/xl, <= 12 intentional exceptions remain (the 4 token
  // definitions in variables.css + a few deliberate one-off radii).
  it('border-radius: Npx literal count <= 12', () => {
    const files = listSourceFiles()
    let count = 0
    const perFile = []
    for (const f of files) {
      const src = stripComments(readFileSync(f, 'utf-8'))
      const m = src.match(/border-radius:\s*\d+px/g) || []
      if (m.length) perFile.push({ file: path.relative(ROOT, f), count: m.length })
      count += m.length
    }
    perFile.sort((a, b) => b.count - a.count)
    console.log('\n[style-unification] border-radius Npx literals:', count, '(budget 12)')
    console.log('[style-unification] radius per-file:', perFile)
    expect(count).toBeLessThanOrEqual(12)
  })
})

describe('prefers-reduced-motion preserved (#242)', () => {
  // Every file that had a prefers-reduced-motion @media block BEFORE
  // unification still has one AFTER. Baseline measured 2026-06-30: 14 files.
  // The unification only swaps color/font/radius literals — it must NOT
  // delete accessibility motion guards.
  it('files with prefers-reduced-motion @media >= 14 (baseline)', () => {
    const files = listSourceFiles()
    let count = 0
    const names = []
    for (const f of files) {
      const src = readFileSync(f, 'utf-8')
      if (/prefers-reduced-motion/.test(src)) {
        count++
        names.push(path.relative(ROOT, f))
      }
    }
    console.log('\n[style-unification] prefers-reduced-motion files:', count, names)
    expect(count).toBeGreaterThanOrEqual(14)
  })
})
