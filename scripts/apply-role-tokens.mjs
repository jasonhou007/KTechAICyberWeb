#!/usr/bin/env node
/**
 * apply-role-tokens.mjs — Issue #286 AC#3 token applier.
 *
 * Reads the role-token matrix produced by `scripts/role-token-audit.mjs`
 * (piped on stdin as TSV) and rewrites every `color: var(--text-{from})`
 * declaration at the recorded (file, line) to its target role token.
 *
 * The replacement is LINE-TARGETED + TOKEN-SPECIFIC: at the recorded line we
 * swap exactly `color: var(--text-{from})` -> `color: var(--text-role-token)`,
 * so a site that already matches a different token on the same line is left
 * untouched and a mismatch (line moved / token changed) is reported as an
 * error rather than silently mis-editing.
 *
 * Usage: node scripts/role-token-audit.mjs | node scripts/apply-role-tokens.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const VIEWS = resolve(ROOT, 'src/views')

const stdin = readFileSync(0, 'utf-8').trim().split('\n')
const rows = []
for (const line of stdin) {
  // matrix rows look like: File.vue<TAB>Lnnn<TAB>selector<TAB>var(--text-X)<TAB>var(--text-Y)<TAB>[role]
  // skip stderr/summary lines
  const parts = line.split('\t')
  if (parts.length < 6) continue
  const [file, lineNoRaw, sel, fromDecl, toDecl, roleRaw] = parts
  if (!file.endsWith('.vue')) continue
  const lineNo = parseInt(lineNoRaw.replace(/^L/, ''), 10)
  if (!Number.isFinite(lineNo)) continue
  const fromMatch = fromDecl.match(/var\(--text-(secondary|muted)\)/)
  const toMatch = toDecl.match(/var\((--[\w-]+)\)/)
  if (!fromMatch || !toMatch) continue
  rows.push({ file, lineNo, from: fromMatch[1], to: toMatch[1], sel, role: roleRaw.replace(/[\[\]]/g, '') })
}

const byFile = {}
for (const r of rows) (byFile[r.file] ||= []).push(r)

let applied = 0
const errors = []
for (const [file, sites] of Object.entries(byFile)) {
  const path = resolve(VIEWS, file)
  const lines = readFileSync(path, 'utf-8').split('\n')
  // sort descending so multi-edits in the same file don't shift earlier line numbers
  // (line numbers are 1-based; array is 0-based)
  sites.sort((a, b) => b.lineNo - a.lineNo)
  for (const s of sites) {
    const idx = s.lineNo - 1
    const before = lines[idx]
    if (before === undefined) {
      errors.push(`${file}:${s.lineNo} out-of-range (selector ${s.sel})`)
      continue
    }
    const fromRe = new RegExp(`color:\\s*var\\(--text-${s.from}\\)`)
    if (!fromRe.test(before)) {
      errors.push(`${file}:${s.lineNo} expected var(--text-${s.from}) not found; line is: ${before.trim()} (selector ${s.sel})`)
      continue
    }
    lines[idx] = before.replace(fromRe, `color: var(${s.to})`)
    applied++
  }
  writeFileSync(path, lines.join('\n'))
}

process.stderr.write(`APPLIED ${applied} / ${rows.length} swaps\n`)
if (errors.length) {
  process.stderr.write(`ERRORS ${errors.length}:\n`)
  for (const e of errors) process.stderr.write('  ' + e + '\n')
  process.exit(1)
}
