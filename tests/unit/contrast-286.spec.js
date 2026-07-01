/**
 * @file contrast-286.spec.js
 * @description Issue #286 AC#4 — WCAG contrast no-regression gate.
 *
 * Spawns `node scripts/contrast-audit.mjs` as a child process, parses its
 * stdout summary, and asserts that the FAIL set is the same pre-existing set
 * of decorative brand-cyan separator rules (rgba(0,255,204,0.5) at 4.31:1) that
 * existed BEFORE #286. This makes the no-regression check a permanent CI gate:
 * if a future change introduces a new below-AA text/bg pair, this test fails.
 *
 * Pre-existing baseline (captured in evidence/contrast-before.txt):
 *   PASS 331 / FAIL 9 — 8 `*-breadcrumb-separator` + 1 `.news-detail__separator`,
 *   all decorative cyan brand accents (out of #286 secondary-text scope).
 *
 * @ticket #286
 */
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const AUDIT = resolve(ROOT, 'scripts/contrast-audit.mjs')

/** Run the audit and return its full stdout. */
function runAudit() {
  return execFileSync('node', [AUDIT], {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024
  })
}

/** Parse the FAIL rows out of the audit's stdout.
 *  Each row: file | selector | color-decl | resolved-fg | resolved-bg | ratio | thr | large */
function parseFailRows(stdout) {
  const rows = []
  let inFailSection = false
  for (const line of stdout.split('\n')) {
    if (/FAILING pairs/i.test(line)) { inFailSection = true; continue }
    if (!inFailSection) continue
    // the table ends at the next ## section header
    if (/^##\s/.test(line.trim())) break
    // data rows start with src/
    const m = line.match(/^\s*(src\/[^\s|]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/)
    if (m) {
      rows.push({ file: m[1].trim(), selector: m[2].trim(), colorDecl: m[3].trim() })
    }
  }
  return rows
}

/** Parse the "PASS: N   FAIL: N" summary line. */
function parseSummary(stdout) {
  const m = stdout.match(/PASS:\s*(\d+)\s+FAIL:\s*(\d+)/)
  if (!m) throw new Error('could not parse PASS/FAIL summary from contrast-audit output')
  return { pass: +m[1], fail: +m[2] }
}

describe('#286 contrast-audit no-regression gate', () => {
  const stdout = runAudit()

  it('contrast-audit runs and emits a PASS/FAIL summary', () => {
    const summary = parseSummary(stdout)
    expect(summary.pass).toBeGreaterThanOrEqual(0)
    expect(summary.fail).toBeGreaterThanOrEqual(0)
    // #286 baseline: 340 total pairs (331 PASS + 9 FAIL). Guard the total so a
    // silent drop in audited selectors is caught.
    expect(summary.pass + summary.fail).toBe(340)
  })

  it('FAIL count is <= 9 (pre-existing baseline)', () => {
    const summary = parseSummary(stdout)
    expect(summary.fail, `expected <=9 FAIL, got ${summary.fail}`).toBeLessThanOrEqual(9)
  })

  it('every failing selector is a decorative brand-cyan separator (pre-existing set)', () => {
    // The pre-existing #286 baseline is 9 decorative separator rules that use
    // the brand cyan rgba(0,255,204,0.5) at 4.31:1 (8 *-breadcrumb-separator +
    // 1 .news-detail__separator). They are cyan brand accents, not secondary
    // text, and out of #286 scope. A NEW fail of any other kind is a regression.
    const fails = parseFailRows(stdout)
    const offenders = fails.filter(r => {
      const isSeparator = /separator$/.test(r.selector)
      const isBrandCyan = /rgba\(\s*0\s*,\s*255\s*,\s*204\s*,\s*0\.5\s*\)/.test(r.colorDecl)
      return !(isSeparator && isBrandCyan)
    })
    expect(
      offenders,
      `non-(brand-cyan-separator) FAILs appeared (regression): ${JSON.stringify(offenders)}`
    ).toEqual([])
    // All 9 pre-existing failures must still be present (no FAILs silently dropped).
    expect(fails.length, 'expected all 9 pre-existing separator FAILs').toBe(9)
  })
})
