#!/usr/bin/env node
/**
 * @file check-i18n-keys.mjs
 * @description i18n invariant check (no deps, Node ESM). TWO invariants:
 *
 * PASS 1 — referenced-but-missing: loads src/locales/en.json + zh.json, walks
 *   every .vue/.js/.ts file under src/, extracts every `t('dotted.key')`
 *   literal call, and asserts each key resolves (nested dot-lookup) in BOTH en
 *   and zh. Catches typos / deleted keys still called via t().
 *
 * PASS 2 — defined-but-unreferenced (ORPHAN): every locale leaf must be reached
 *   by at least one t() call. A leaf is "referenced" if EITHER:
 *     (a) its full dotted path appears as a string literal somewhere in src/
 *         (covers static t() calls, registry `i18nKey:` fields, and
 *         pushSystem('a.b.c') pushes — all of these are literals fed to t() at
 *         runtime); OR
 *     (b) one of its ANCESTOR prefixes appears as a literal prefix (covers
 *         dynamic concatenation like t('terminal.mobile.chips.' + name), where
 *         the literal 'terminal.mobile.chips.' prefix marks all
 *         terminal.mobile.chips.* leaves as reached).
 *   Any leaf matching neither is flagged as an orphan.
 *
 * Heuristic trade-off (PASS 2b): the prefix rule OVER-approximates — if one
 * sibling leaf is reached dynamically, all siblings are considered referenced.
 * This can hide a true orphan but never false-flags a wired key, which is the
 * property that keeps the build green on legitimate dynamic wiring. PASS 2a
 * (full literal) catches the common exact cases (registry i18nKey, pushSystem).
 *
 * Exits non-zero with a list of any missing keys AND/OR orphans; exits 0 if both
 * invariants are clean. This is the invariant coder/evaluator agents should run
 * before merge. It complements (but is stricter than)
 * tests/unit/no-raw-i18n-placeholders.spec.js: the spec only catches raw keys
 * that actually render with 3+ dotted segments, whereas this script catches
 * EVERY t('...') literal at the source level, plus dead translated keys.
 *
 * Usage:  node scripts/check-i18n-keys.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'src')
const LOCALES = join(SRC, 'locales')

// --- Load locales ----------------------------------------------------------
function loadJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

const en = loadJson(join(LOCALES, 'en.json'))
const zh = loadJson(join(LOCALES, 'zh.json'))

// --- Nested dot-path lookup ------------------------------------------------
// Mirrors useLanguage.js getNestedValue(): walks the dotted path; returns
// undefined if any segment is missing or the value is not a string/number
// (objects/arrays are not valid leaf translations).
function resolveKey(obj, dottedPath) {
  const segments = dottedPath.split('.')
  let current = obj
  for (const seg of segments) {
    if (current === null || typeof current !== 'object' || !(seg in current)) {
      return undefined
    }
    current = current[seg]
  }
  // A valid translation leaf is a primitive string (or number). An object
  // midway through the tree is NOT a resolvable value — t() would return the
  // raw key, which is exactly the failure we want to catch.
  if (typeof current === 'string' || typeof current === 'number') {
    return current
  }
  return undefined
}

// --- Recursive source-file walker (.vue + .js + .ts) -----------------------
// We scan JS/TS too (not just .vue) because i18n keys are also passed to t()
// at runtime from data modules (e.g. terminalCommands.js `i18nKey:` fields) and
// composables (pushSystem('terminal.boot.line1')). Limiting to .vue would miss
// those and falsely flag their leaves as orphan.
function walkSrcFiles(dir, acc = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return acc
  }
  for (const name of entries) {
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      // Skip node_modules / dist / .git if they ever appear under src, and
      // __tests__ dirs (test fixtures intentionally reference nonexistent keys
      // to exercise the missing-key fallback — they are NOT production refs).
      if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue
      if (name === '__tests__') continue
      walkSrcFiles(full, acc)
    } else if (
      (name.endsWith('.vue') || name.endsWith('.js') || name.endsWith('.ts')) &&
      !name.endsWith('.test.ts') && !name.endsWith('.test.js') &&
      !name.endsWith('.spec.ts') && !name.endsWith('.spec.js')
    ) {
      // Skip .test/.spec files for the same reason as __tests__ dirs above.
      acc.push(full)
    }
  }
  return acc
}

// --- Extract t('...') literals --------------------------------------------
// Matches: t('dotted.key'), t("dotted.key"), t(`dotted.key`) where the key is
// at least one segment of letters/digits/underscores joined by dots. We capture
// only static string literals — dynamic/concatenated keys cannot be checked
// statically and are intentionally skipped (this is the same limitation any
// static i18n linter has).
//
// The key body allows [A-Za-z0-9_] segments separated by dots, and requires at
// least one dot (a bare single-word key like t('title') is not a namespaced
// i18n key in this codebase and is ignored).
const T_CALL_PATTERN = /\bt\(\s*['"`]([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)['"`]/g

function extractKeys(source) {
  const keys = []
  let m
  // Reset lastIndex in case the regex was used before (it's stateful with /g).
  T_CALL_PATTERN.lastIndex = 0
  while ((m = T_CALL_PATTERN.exec(source)) !== null) {
    keys.push(m[1])
  }
  return keys
}

// --- Extract EVERY dotted string literal (for dynamic-ref + orphan check) --
// For the orphan-leaf check we need more than just t('...') calls: i18n keys
// are also fed to t() dynamically, e.g.
//   - registry fields:   i18nKey: 'terminal.commands.help.response'
//   - system pushes:     pushSystem('terminal.boot.line1')
//   - concatenated:      t('terminal.mobile.chips.' + name)
// We collect two sets:
//   1. fullLiteralKeys — complete dotted string literals (covers registry +
//      pushSystem + static t() calls). A leaf is referenced if it appears here.
//   2. literalPrefixes  — every prefix of those literals ending in '.' (covers
//      concatenated refs: the literal 'terminal.mobile.chips.' prefix marks all
//      leaves under terminal.mobile.chips.* as referenced, since at least one
//      is reached dynamically). This is a conservative over-approximation: it
//      can hide a true orphan if a sibling leaf is never actually built at
//      runtime, but it never FALSE-FLAGS a wired key, which is the property we
//      need (the check must not break the build on legitimate dynamic wiring).
const DOTTED_LITERAL_PATTERN = /['"`]([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+)['"`]/gi

function extractAllDottedLiterals(source) {
  const full = new Set()
  let m
  DOTTED_LITERAL_PATTERN.lastIndex = 0
  while ((m = DOTTED_LITERAL_PATTERN.exec(source)) !== null) {
    full.add(m[1])
  }
  return full
}

// Build the set of literal prefixes (a.b.c. for every full literal a.b.c).
function prefixesOf(dotted) {
  const out = new Set()
  const segs = dotted.split('.')
  for (let i = 1; i < segs.length; i++) {
    out.add(segs.slice(0, i).join('.') + '.')
  }
  return out
}

// --- Walk a locale JSON tree into a flat list of leaf dotted-paths ----------
function collectLeaves(obj, prefix = '', acc = []) {
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      collectLeaves(v, path, acc)
    } else {
      acc.push(path)
    }
  }
  return acc
}

// --- Main ------------------------------------------------------------------
const srcFiles = walkSrcFiles(SRC)

// PASS 1 — referenced-but-missing: every static t('...') literal must resolve
// in BOTH locales. (This is the original invariant; it catches typos / deleted
// keys that are still called.)
/** @type {Array<{file: string, key: string, missingIn: string[]}>} */
const violations = []
let totalKeysChecked = 0
const seenPerFile = new Map()

// Also accumulate the union of ALL dotted string literals across src/ — used by
// the orphan check in PASS 2 (covers dynamic refs via registry fields,
// pushSystem(), and t('prefix' + var) concatenation).
const allLiteralKeys = new Set()
const allLiteralPrefixes = new Set()

for (const file of srcFiles) {
  const source = readFileSync(file, 'utf8')
  const keys = extractKeys(source)
  const rel = relative(ROOT, file).split(sep).join('/')
  const deduped = [...new Set(keys)]
  for (const key of deduped) {
    totalKeysChecked += 1
    const missingIn = []
    if (resolveKey(en, key) === undefined) missingIn.push('en')
    if (resolveKey(zh, key) === undefined) missingIn.push('zh')
    if (missingIn.length > 0) {
      violations.push({ file: rel, key, missingIn })
    }
  }
  seenPerFile.set(rel, deduped.length)

  // Feed the orphan-check reference sets from THIS file's dotted literals.
  for (const lit of extractAllDottedLiterals(source)) {
    allLiteralKeys.add(lit)
    for (const p of prefixesOf(lit)) allLiteralPrefixes.add(p)
  }
}

// PASS 2 — defined-but-unreferenced (ORPHAN) leaves: every locale leaf should
// be reached by at least one t() call (static OR dynamic). A leaf is referenced
// if its full path is a literal key, OR its parent prefix is a literal prefix
// (the dynamic-concatenation case: t('terminal.mobile.chips.' + name) makes the
// 'terminal.mobile.chips.' prefix literal, covering all chips.* leaves).
//
// Heuristic trade-off (documented): the prefix rule OVER-approximates — if one
// sibling leaf is reached dynamically, all siblings are considered referenced.
// This can hide a true orphan but never false-flags a wired key, which is the
// property that keeps the build green on legitimate dynamic wiring. The full-
// literal rule (registry i18nKey, pushSystem) catches the common exact cases.
const enLeaves = collectLeaves(en)
const zhLeaves = collectLeaves(zh)

/** @type {Array<{key: string, locale: string}>} */
const orphans = []
function isReferenced(leaf) {
  if (allLiteralKeys.has(leaf)) return true
  // Check every ancestor prefix: if 'a.b.' is a literal prefix, leaf 'a.b.c' is
  // considered dynamically referenced.
  const segs = leaf.split('.')
  for (let i = 1; i < segs.length; i++) {
    if (allLiteralPrefixes.has(segs.slice(0, i).join('.') + '.')) return true
  }
  return false
}
for (const leaf of enLeaves) {
  if (!isReferenced(leaf)) orphans.push({ key: leaf, locale: 'en' })
}
for (const leaf of zhLeaves) {
  if (!isReferenced(leaf)) orphans.push({ key: leaf, locale: 'zh' })
}
// Dedupe: report each orphan key once (it's an orphan in both locales typically).
const orphanKeys = [...new Set(orphans.map((o) => o.key))].sort()

const hasMissingViolations = violations.length > 0
const hasOrphans = orphanKeys.length > 0

if (!hasMissingViolations && !hasOrphans) {
  const fileCount = srcFiles.length
  console.log(
    `i18n keys OK: ${totalKeysChecked} unique t() key(s) across ${fileCount} source file(s) all resolve in en.json + zh.json; no orphan leaves (${enLeaves.length} en / ${zhLeaves.length} zh leaves all referenced).`
  )
  process.exit(0)
}

if (hasMissingViolations) {
  console.error(`i18n key check FAILED: ${violations.length} missing key(s).\n`)
  console.error('Missing keys (file -> key [missing in]):')
  for (const v of violations) {
    console.error(`  ${v.file} -> ${v.key}  [missing in: ${v.missingIn.join(', ')}]`)
  }
  console.error(
    `\nTotal: ${violations.length} missing-key violation(s) across ${srcFiles.length} source file(s).`,
  )
}

if (hasOrphans) {
  console.error(`\ni18n ORPHAN check FAILED: ${orphanKeys.length} defined-but-unreferenced leaf key(s).\n`)
  console.error('Orphan keys (defined + translated but never t()-referenced):')
  for (const k of orphanKeys) {
    console.error(`  ${k}`)
  }
  console.error(
    `\nThese keys are dead weight. Either wire them via t() (statically or via a\n` +
      `dynamic prefix like t('a.b.' + name)), or delete them from BOTH en.json and\n` +
      `zh.json. See scripts/check-i18n-keys.mjs header for the dynamic-ref heuristic.`,
  )
}

process.exit(1)
