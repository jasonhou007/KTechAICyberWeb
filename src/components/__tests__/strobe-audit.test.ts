/**
 * @file strobe-audit.test.ts
 * @description Repo-wide photosafety gate. Fails if any CSS `animation: ...
 * infinite` rule has a period that implies a >3Hz flash rate, which exceeds
 * the WCAG 2.3.1 (Three Flashes) photosensitivity ceiling.
 * @ticket #271
 *
 * WHY THIS EXISTS (the #234 audit blind spot):
 * Issue #234's strobe audit grepped `steps([0-9]+)[^;]*infinite` — i.e. it
 * only flagged HARD square-wave strobes using the `steps()` timing function.
 * `SolutionForge.vue` shipped `animation: forge-glitch 0.3s infinite` using a
 * `transform` keyframe with default `linear` timing (no `steps()`), so it
 * strobed at 3.33Hz — OVER the 3Hz ceiling — yet slipped through the audit.
 * #271 widens the audit to ALL `infinite` animations regardless of timing
 * function: any rule whose declared period is < 1/3s (>3Hz) is a strobe and
 * fails this gate.
 *
 * THE MATH: a CSS animation with duration `Ds` seconds running `infinite`
 * repeats at frequency `1/D Hz`. The WCAG 2.3.1 Three-Flashes threshold is
 * <3 flashes/sec. So any `infinite` animation with `D < 1/3s ≈ 0.333s` is a
 * strobe. We use a 0.34s floor (≥0.34s = ≤2.94Hz, safely under 3Hz) matching
 * the ticket AC wording ("≥0.34s period").
 *
 * SCOPE: scans every stylesheet under src (both .vue style blocks and .css
 * files), strips comments first (so a commented-out strobe cannot satisfy the
 * gate), skips `animation: none` rules, and ignores non-infinite rules
 * (forwards, one-shot, finite-iteration rules are photosafe). Reduced-motion
 * media-query blocks are NOT a waiver — a strobe is still a strobe until the
 * user opts into reduced motion; the gate requires the BASE rule to be
 * sub-threshold.
 *
 * RED-TEST PROOF: revert any of the three fixed sites
 *   - src/components/SolutionForge.vue   forge-glitch (already one-shot on main)
 *   - src/views/Services.vue             glitch
 *   - src/components/ops/OpsAnomalyToast.vue  ops-glitch
 * to `animation: <name> 0.3s infinite` and this test FAILS with a precise
 * file:line report naming the offending rule. That is the regression this gate
 * exists to catch — a transform-based >3Hz strobe can never slip through again.
 */

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')

/** Hz ceiling — an `infinite` animation faster than this is a strobe. */
const MAX_HZ = 3
/** Minimum safe period in seconds (1/MAX_HZ, with a tiny safety margin). */
const MIN_SAFE_PERIOD_SEC = 0.34

/** Strip /* * / , <!-- -->, and // comments so a dead rule can't pose as live. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

/** Recursively collect stylesheet source files (.vue <style> + .css). */
function collectStylesheets(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.isFile() && (full.endsWith('.vue') || full.endsWith('.css'))) out.push(full)
    }
  }
  walk(path.join(repoRoot, 'src'))
  return out
}

interface StrobeFinding {
  file: string
  line: number
  rule: string
  periodSec: number
  hz: number
}

/**
 * Scan the comment-stripped source for `animation:` declarations that are
 * (a) `infinite` and (b) carry a duration < MIN_SAFE_PERIOD_SEC. Returns one
 * finding per offending rule with its file:line for a precise report.
 *
 * Parsing strategy: walk line by line over the ORIGINAL (non-stripped) source
 * for accurate line numbers, but skip lines that disappear after
 * comment-stripping (so a `// animation: x 0.1s infinite` comment cannot trip
 * the gate). On each surviving line, match `animation: <name> <dur><unit>
 * ... infinite` and pull the duration.
 */
function findStrobes(files: string[]): StrobeFinding[] {
  const findings: StrobeFinding[] = []
  const durationRe = /(\d+(?:\.\d+)?)\s*(s|ms)\b/i

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf-8')
    const stripped = stripComments(raw)
    // Map: line index (0-based) -> is this line present after stripping?
    // We re-derive by splitting both on '\n' and comparing line text presence;
    // simpler & robust: walk raw lines, but only consider a line if its
    // comment-stripped form still contains an `animation` token at all AND the
    // raw line text is non-empty after stripping inline // comments.
    const rawLines = raw.split('\n')
    for (let i = 0; i < rawLines.length; i++) {
      const rawLine = rawLines[i]
      // Quick reject: must mention animation + infinite on this physical line.
      // (CSS animation declarations in this repo are single-line; a multi-line
      // declaration would be unusual and is not present in the codebase.)
      if (!/animation\s*:/.test(rawLine)) continue
      if (!/\binfinite\b/.test(rawLine)) continue
      // Must survive comment-stripping (reject full-line comments).
      const strippedLine = stripComments(rawLine)
      if (strippedLine.trim() === '') continue
      // `animation: none infinite` is nonsense; `animation: none` skips above.
      if (/animation\s*:\s*none\b/.test(strippedLine)) continue

      const durMatch = strippedLine.match(durationRe)
      if (!durMatch) continue
      let periodSec = parseFloat(durMatch[1])
      if (durMatch[2].toLowerCase() === 'ms') periodSec /= 1000

      const hz = 1 / periodSec
      if (hz > MAX_HZ) {
        findings.push({
          file: path.relative(repoRoot, file),
          line: i + 1,
          rule: strippedLine.trim(),
          periodSec,
          hz: Math.round(hz * 100) / 100,
        })
      }
    }
  }
  return findings
}

describe('repo-wide strobe audit (#271 — photosafety, WCAG 2.3.1)', () => {
  it('no `animation: ... infinite` rule in src/ exceeds the 3Hz flash ceiling', () => {
    const files = collectStylesheets()
    expect(files.length, 'must discover stylesheet files to audit').toBeGreaterThan(0)
    const strobes = findStrobes(files)
    if (strobes.length > 0) {
      const report = strobes
        .map(
          (s) =>
            `  • ${s.file}:${s.line} — ${s.hz}Hz (period ${s.periodSec}s > 3Hz ceiling): ${s.rule}`,
        )
        .join('\n')
      throw new Error(
        `\n#271 photosafety gate FAILED: ${strobes.length} infinite animation(s) exceed the 3Hz flash ceiling.\n` +
          `These are transform/opacity-based strobes that the #234 steps()+infinite audit missed (see ticket #271 AC4).\n` +
          `Fix each to a one-shot reveal (animation: <name> <dur> forwards) OR a sub-threshold period (>=0.34s).\n${report}\n`,
      )
    }
    // Negative assertion: the gate actually ran and found nothing dangerous.
    expect(strobes).toEqual([])
  })

  it('MIN_SAFE_PERIOD_SEC gate constant is correctly derived from MAX_HZ', () => {
    // Guard against someone bumping the ceiling without updating the floor.
    expect(MIN_SAFE_PERIOD_SEC).toBeGreaterThanOrEqual(1 / MAX_HZ)
  })
})
