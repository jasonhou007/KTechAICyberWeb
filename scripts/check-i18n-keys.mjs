#!/usr/bin/env node
/**
 * @file check-i18n-keys.mjs
 * @description i18n invariant check (no deps, Node ESM).
 *
 * Loads src/locales/en.json + zh.json, walks every .vue file under src/, extracts
 * every `t('dotted.key')` literal call, and asserts each key resolves (nested
 * dot-lookup) in BOTH en and zh. Exits non-zero with a list of any missing
 * keys; exits 0 if clean.
 *
 * This is the invariant coder/evaluator agents should run before merge. It
 * complements (but is stricter than) tests/unit/no-raw-i18n-placeholders.spec.js:
 * the spec only catches raw keys that actually render with 3+ dotted segments,
 * whereas this script catches EVERY t('...') literal at the source level,
 * including keys used in computed/attributes/non-rendered branches.
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

// --- Recursive .vue file walker -------------------------------------------
function walkVueFiles(dir, acc = []) {
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
      // Skip node_modules / dist / .git if they ever appear under src.
      if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue
      walkVueFiles(full, acc)
    } else if (name.endsWith('.vue')) {
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

// --- Main ------------------------------------------------------------------
const vueFiles = walkVueFiles(SRC)

/** @type {Array<{file: string, key: string, missingIn: string[]}>} */
const violations = []
let totalKeysChecked = 0
const seenPerFile = new Map()

for (const file of vueFiles) {
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
}

if (violations.length === 0) {
  const fileCount = vueFiles.length
  console.log(
    `i18n keys OK: ${totalKeysChecked} unique t() key(s) across ${fileCount} .vue file(s) all resolve in en.json + zh.json.`
  )
  process.exit(0)
}

console.error(`i18n key check FAILED: ${violations.length} missing key(s).\n`)
console.error('Missing keys (file -> key [missing in]):')
for (const v of violations) {
  console.error(`  ${v.file} -> ${v.key}  [missing in: ${v.missingIn.join(', ')}]`)
}
console.error(`\nTotal: ${violations.length} violation(s) across ${vueFiles.length} .vue file(s).`)
process.exit(1)
