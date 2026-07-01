// scripts/tokenize-285-replace.mjs
// One-shot scripted replace of inline brand rgba(0,255,204,A) /
// rgba(255,0,170,A) glow/shadow/border/gradient literals onto the 16 alpha-step
// tokens added in #285 STEP 1. ANCHORED per-alpha regexes so 0.1 does NOT match
// 0.15/0.18. Long-tail alphas are deliberately untouched (see variables.css
// long-tail comment). Whole-shadow canonical `box-shadow: 0 0 20px rgba(...0.3);`
// collapses onto the existing --shadow-glow-cyan/-magenta tokens.
//
// Idempotent: re-running on already-tokenized source is a no-op (no rgba literal
// of a canonical alpha remains to match).
//
// Usage: node scripts/tokenize-285-replace.mjs          # apply
//        node scripts/tokenize-285-replace.mjs --dry-run # report counts only
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative, join } from 'node:path'

const ROOT = resolve(process.cwd())
const SRC = resolve(ROOT, 'src')
const DRY = process.argv.includes('--dry-run')

// Canonical alpha -> token suffix (must mirror tests/unit/style-tokenize-285.spec.js).
const CYAN = [
  ['0.05', '05'], ['0.1', '10'], ['0.15', '15'], ['0.2', '20'], ['0.3', '30'],
  ['0.4', '40'], ['0.5', '50'], ['0.6', '60'], ['0.8', '80'],
]
const MAGENTA = [
  ['0.1', '10'], ['0.15', '15'], ['0.2', '20'], ['0.3', '30'],
  ['0.4', '40'], ['0.5', '50'], ['0.6', '60'],
]

// Anchored per-alpha regex. The `\)` anchor is load-bearing: it stops 0.1 from
// matching 0.15/0.18 (the only difference between the two is the trailing `5`/`8`
// before the close paren). Whitespace-tolerant to match the codebase's mixed
// `rgba(0,255,204,0.1)` / `rgba(0, 255, 204, 0.1)` forms.
function rgbaRe(r, g, b, alpha) {
  const a = alpha.replace('.', '\\.')
  return new RegExp(`rgba\\(\\s*${r},\\s*${g},\\s*${b},\\s*${a}\\s*\\)`, 'g')
}

// Whole-shadow canonical: an entire `box-shadow: 0 0 20px <rgba...0.3>;` collapses
// onto the existing --shadow-glow-cyan / --shadow-glow-magenta tokens (variables
// .css lines 84-85). Whitespace-tolerant.
const WHOLE_SHADOW_CYAN = /box-shadow:\s*0\s+0\s+20px\s+rgba\(\s*0,\s*255,\s*204,\s*0\.3\s*\)\s*;/g
const WHOLE_SHADOW_MAGENTA = /box-shadow:\s*0\s+0\s+20px\s+rgba\(\s*255,\s*0,\s*170,\s*0\.3\s*\)\s*;/g

function isSource(p) {
  return /\.(vue|js|ts|css)$/.test(p) && !/\.(test|spec)\./.test(p)
}

function walk(dir, acc) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'locales' || e.name === '__tests__' || e.name === 'node_modules') continue
      walk(full, acc)
    } else if (isSource(e.name)) {
      // variables.css is the canonical TOKEN SOURCE — its rgba literals ARE the
      // token definitions. Replacing them would replace the definitions with
      // references to themselves (broken var() recursion). Exclude it.
      if (full.endsWith('assets/styles/variables.css')) continue
      acc.push(full)
    }
  }
  return acc
}

function applyReplacements(src) {
  let out = src
  const stats = { cyan: 0, magenta: 0, wholeCyan: 0, wholeMagenta: 0 }

  // 1) Whole-shadow canonical FIRST (so a `0 0 20px rgba(...0.3);` collapses to
  //    one token instead of leaving a half-replaced `0 0 20px var(--accent-...)`).
  out = out.replace(WHOLE_SHADOW_CYAN, (m) => { stats.wholeCyan += 1; return 'box-shadow: var(--shadow-glow-cyan);' })
  out = out.replace(WHOLE_SHADOW_MAGENTA, (m) => { stats.wholeMagenta += 1; return 'box-shadow: var(--shadow-glow-magenta);' })

  // 2) Per-alpha color-in-place. Each canonical rgba -> its token. Anchored, so
  //    long-tail alphas (0.03/0.06/0.18/0.35...) are never matched.
  for (const [alpha, suffix] of CYAN) {
    out = out.replace(rgbaRe(0, 255, 204, alpha), () => { stats.cyan += 1; return `var(--accent-cyan-alpha-${suffix})` })
  }
  for (const [alpha, suffix] of MAGENTA) {
    out = out.replace(rgbaRe(255, 0, 170, alpha), () => { stats.magenta += 1; return `var(--accent-magenta-alpha-${suffix})` })
  }

  return { out, stats }
}

const files = walk(SRC, [])
let grand = { cyan: 0, magenta: 0, wholeCyan: 0, wholeMagenta: 0 }
let touched = 0
const perFile = []

for (const f of files) {
  const before = readFileSync(f, 'utf-8')
  const { out, stats } = applyReplacements(before)
  const changed = out !== before
  const total = stats.cyan + stats.magenta + stats.wholeCyan + stats.wholeMagenta
  if (total > 0) perFile.push({ file: relative(ROOT, f), ...stats })
  if (changed) {
    touched += 1
    grand.cyan += stats.cyan
    grand.magenta += stats.magenta
    grand.wholeCyan += stats.wholeCyan
    grand.wholeMagenta += stats.wholeMagenta
    if (!DRY) writeFileSync(f, out, 'utf-8')
  }
}

perFile.sort((a, b) => (b.cyan + b.magenta + b.wholeCyan + b.wholeMagenta) - (a.cyan + a.magenta + a.wholeCyan + a.wholeMagenta))
console.log(`[${DRY ? 'DRY-RUN' : 'APPLIED'}] files touched: ${touched}`)
console.log(`  cyan color-in-place:        ${grand.cyan}`)
console.log(`  magenta color-in-place:     ${grand.magenta}`)
console.log(`  whole-shadow -> glow-cyan:  ${grand.wholeCyan}`)
console.log(`  whole-shadow -> glow-magenta:${grand.wholeMagenta}`)
console.log(`  TOTAL replacements:         ${grand.cyan + grand.magenta + grand.wholeCyan + grand.wholeMagenta}`)
console.log('--- top 15 files ---')
for (const p of perFile.slice(0, 15)) {
  console.log(`  ${p.file}: cyan=${p.cyan} mag=${p.magenta} wCyan=${p.wholeCyan} wMag=${p.wholeMagenta}`)
}
