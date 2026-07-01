/**
 * @file style-tokenize-285.spec.js
 * @description Tokenized rgba glow/shadow literal regression test for #285.
 * @ticket #285
 *
 * Four invariants this gate protects (mirrors the style-unification.spec.js
 * #242 idiom — read source, strip comments, assert against regexes):
 *
 * (a) TOKEN EXISTENCE — variables.css declares the 16 alpha-step tokens
 *     (9 cyan + 7 magenta). RED-PROOF: delete one def -> its test fails.
 *
 * (b) CONSUMER REPLACEMENT — every canonical-alpha rgba literal of the brand
 *     cyan (0,255,204) / magenta (255,0,170) is gone from src/ (comment-
 *     stripped count == 0). The 16 canonical alphas are exactly the ones with
 *     a token. Per-file breakdown logged on failure so a regression names the
 *     offending file. RED-PROOF: leave one literal un-replaced -> count > 0.
 *
 * (c) #0a0a14 ELIMINATED — the near-bg hex literal is gone across the whole
 *     repo (src/ tests/ e2e/ scripts/), routed through --bg-primary.
 *
 * (d) LONG-TAIL INFORMATIONAL (NOT a hard gate) — logs the residual rare-alpha
 *     literal count so a reviewer sees the omission is deliberate (rare one-off
 *     alphas stay literal; see variables.css long-tail comment).
 *
 * RED state right now (before STEP 4 bulk replace): (a) PASSES (tokens added in
 * STEP 1), (b) FAILS (literals still inline), (c) FAILS (Contact.vue still has
 * #0a0a14). STEP 4+5 drive (b) and (c) GREEN.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const VARIABLES_CSS = resolve(ROOT, 'src/assets/styles/variables.css')
const SRC_DIR = resolve(ROOT, 'src')

// Canonical alpha -> token suffix map (the 16 tokens from #285).
const CYAN_ALPHAS = [
  ['0.05', '05'],
  ['0.1', '10'],
  ['0.15', '15'],
  ['0.2', '20'],
  ['0.3', '30'],
  ['0.4', '40'],
  ['0.5', '50'],
  ['0.6', '60'],
  ['0.8', '80'],
]
const MAGENTA_ALPHAS = [
  ['0.1', '10'],
  ['0.15', '15'],
  ['0.2', '20'],
  ['0.3', '30'],
  ['0.4', '40'],
  ['0.5', '50'],
  ['0.6', '60'],
]

// Long-tail alphas deliberately NOT tokenized (informational count only).
const CYAN_LONG_TAIL = [
  '0.01', '0.02', '0.03', '0.04', '0.06', '0.08', '0.12', '0.18',
  '0.25', '0.35', '0.45', '0.85', '0.9', '0.95',
]
const MAGENTA_LONG_TAIL = [
  '0', '0.04', '0.05', '0.07', '0.08', '0.12', '0.25', '0.35', '0.45',
  '0.7', '0.8', '0.9',
]

/** Strip CSS/HTML/JS comments so a commented-out literal cannot masquerade. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

// Source file set under the gate: .vue/.js/.ts/.css under src/, excluding
// locales/__tests__/node_modules, spec/test fixtures, and variables.css (the
// canonical TOKEN SOURCE — its rgba literals ARE the token definitions that
// the consumers route through, so it is intentionally never counted as a
// "consumer"). Mirrors the style-unification #242 idiom.
function listSourceFiles(dir = SRC_DIR) {
  const acc = []
  ;(function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'locales' || entry.name === '__tests__' || entry.name === 'node_modules') continue
        walk(full)
      } else if (/\.(vue|js|ts|css)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) {
        if (full.endsWith('assets/styles/variables.css')) continue
        acc.push(full)
      }
    }
  })(dir)
  return acc
}

/** Build a precise, anchored regex for one rgb triple + alpha. The `\)` anchor
 *  prevents `0.1` from matching `0.15` / `0.18` — the load-bearing safety rule
 *  of the #285 scripted replace. */
function rgbaRegex(r, g, b, alpha) {
  const aEsc = alpha.replace('.', '\\.')
  return new RegExp(`rgba\\(\\s*${r},\\s*${g},\\s*${b},\\s*${aEsc}\\s*\\)`, 'g')
}

/** Count comment-stripped occurrences of one rgba literal across src/, with a
 *  per-file breakdown so a failure names the offending file. */
function countRgba(r, g, b, alpha) {
  const re = rgbaRegex(r, g, b, alpha)
  let total = 0
  const perFile = []
  for (const f of listSourceFiles()) {
    const src = stripComments(readFileSync(f, 'utf-8'))
    const matches = src.match(re) || []
    if (matches.length) perFile.push({ file: path.relative(ROOT, f), count: matches.length })
    total += matches.length
  }
  perFile.sort((a, b) => b.count - a.count)
  return { total, perFile }
}

describe('#285 (a) variables.css declares the 16 alpha-step tokens', () => {
  const src = () => stripComments(readFileSync(VARIABLES_CSS, 'utf-8'))

  it.each(CYAN_ALPHAS)(
    'defines --accent-cyan-alpha-%s == rgba(0, 255, 204, %s)',
    (alpha, suffix) => {
      const aEsc = alpha.replace('.', '\\.')
      expect(src()).toMatch(
        new RegExp(`--accent-cyan-alpha-${suffix}:\\s*rgba\\(0,\\s*255,\\s*204,\\s*${aEsc}\\)`)
      )
    }
  )

  it.each(MAGENTA_ALPHAS)(
    'defines --accent-magenta-alpha-%s == rgba(255, 0, 170, %s)',
    (alpha, suffix) => {
      const aEsc = alpha.replace('.', '\\.')
      expect(src()).toMatch(
        new RegExp(`--accent-magenta-alpha-${suffix}:\\s*rgba\\(255,\\s*0,\\s*170,\\s*${aEsc}\\)`)
      )
    }
  )
})

describe('#285 (b) canonical-alpha brand rgba literals are gone from src/', () => {
  it.each(CYAN_ALPHAS)(
    'no rgba(0, 255, 204, %s) literal remains (cyan alpha-%s)',
    (alpha, suffix) => {
      const { total, perFile } = countRgba(0, 255, 204, alpha)
      expect(
        total,
        `expected 0 cyan alpha-${suffix} literals, found ${total}: ${
          perFile.map((p) => `${p.file} (${p.count})`).join(', ')
        }`
      ).toBe(0)
    }
  )

  it.each(MAGENTA_ALPHAS)(
    'no rgba(255, 0, 170, %s) literal remains (magenta alpha-%s)',
    (alpha, suffix) => {
      const { total, perFile } = countRgba(255, 0, 170, alpha)
      expect(
        total,
        `expected 0 magenta alpha-${suffix} literals, found ${total}: ${
          perFile.map((p) => `${p.file} (${p.count})`).join(', ')
        }`
      ).toBe(0)
    }
  )
})

describe('#285 (c) near-bg #0a0a14 literal eliminated from the whole repo', () => {
  // Whole-repo scope (iter-37): src/ + tests/ + e2e/ + scripts/. Comment-stripped.
  const SCOPES = ['src', 'tests', 'e2e', 'scripts']

  it('no #0a0a14 literal anywhere in src/tests/e2e/scripts (comment-stripped)', () => {
    const hits = []
    for (const scope of SCOPES) {
      const scopeDir = resolve(ROOT, scope)
      if (!fs.existsSync(scopeDir)) continue
      ;(function walk(d) {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
          const full = path.join(d, entry.name)
          if (entry.isDirectory()) {
            if (entry.name === 'node_modules') continue
            walk(full)
          } else if (/\.(vue|js|ts|css|html|json|md)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) {
            const src = stripComments(readFileSync(full, 'utf-8'))
            if (/#[0-9a-fA-F]{6}/.test(src) && src.match(/#0a0a14/gi)) {
              hits.push(path.relative(ROOT, full))
            }
          }
        }
      })(scopeDir)
    }
    expect(hits, `#0a0a14 still present in: ${hits.join(', ')}`).toEqual([])
  })
})

describe('#285 (d) long-tail rare-alpha literals — informational (NOT a gate)', () => {
  // These stay literal by design. Logged so a reviewer sees the deliberate
  // omission; not asserted (would force a token-per-occurrence inflation).
  it('logs the residual cyan + magenta long-tail literal counts', () => {
    const cyanCounts = CYAN_LONG_TAIL.map((a) => `${a}=${countRgba(0, 255, 204, a).total}`)
    const magentaCounts = MAGENTA_LONG_TAIL.map((a) => `${a}=${countRgba(255, 0, 170, a).total}`)
    // eslint-disable-next-line no-console
    console.log(
      `[#285 long-tail] cyan rare alphas kept literal: ${cyanCounts.join(', ')} | ` +
      `magenta rare alphas kept literal: ${magentaCounts.join(', ')}`
    )
    expect(true).toBe(true)
  })
})
