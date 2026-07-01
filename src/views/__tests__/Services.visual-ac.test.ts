/**
 * @file Services.visual-ac.test.ts
 * @description Visual-AC CSS-source gate for the Services index H1 glitch-text
 * — seizure-safety only (#271). The full Services rendering/behavior suite
 * lives in Services.test.ts; this file is the photosafety gate added by #271.
 * @ticket #271
 *
 * WHY: the Services page H1 (`<h1 class="neon-text glitch-text">`) auto-mounts
 * on every Services page load. Its `.glitch-text::before/::after` pseudo-
 * elements previously carried `animation: glitch 0.3s infinite` = 3.33Hz — OVER
 * the <3Hz WCAG 2.3.1 (Three Flashes) photosensitivity ceiling. This is the
 * same transform-based strobe defect class as SolutionForge (#271) and the
 * exact bug the #234 steps()+infinite audit missed (no `steps()` → slipped
 * through). #271 makes it one-shot (`forwards`).
 *
 * DOM tests cannot SEE CSS — an `infinite` revert passes every DOM test
 * (iter-13/15 lesson). This gate reads the source, strips comments, and
 * asserts the glitch-text pseudo-layers are seizure-safe. It mirrors
 * SolutionForge.visual-ac.test.ts AC5(c) and the repo-wide
 * strobe-audit.test.ts gate (which is the catch-all).
 *
 * RED-TEST PROOF (brace-counted, comment-stripped — iter-13/15/42/43):
 *   * revert `.glitch-text::before` to `animation: glitch 0.3s infinite`
 *     -> the `forwards` check fails AND the `infinite`-absent check fails.
 *     This is the exact regression this gate exists to catch.
 *   * delete the `@media (prefers-reduced-motion: reduce)` guard
 *     -> the reduced-motion assertion fails.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const componentPath = path.resolve(__dirname, '../Services.vue')

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

/** Brace-counted rule-body extractor (iter-43 pattern). */
function extractRuleBody(src: string, startRe: RegExp, open: string, close: string): string {
  const m = src.match(startRe)
  if (!m || m.index === undefined) return ''
  let i = m.index + m[0].length - 1
  let depth = 0
  let out = ''
  for (; i < src.length; i++) {
    const ch = src[i]
    if (ch === open) { depth++; if (depth === 1) continue }
    if (ch === close) { depth--; if (depth === 0) break }
    if (depth >= 1) out += ch
  }
  return out
}

describe('Services.vue H1 glitch-text — seizure-safety visual-AC gate (#271)', () => {
  let source: string

  beforeAll(() => {
    const raw = fs.readFileSync(componentPath, 'utf-8')
    source = stripComments(raw)
    expect(source, 'Services.vue source must be readable').toBeTruthy()
    expect(source.length).toBeGreaterThan(1000)
  })

  it('#271 glitch-text pseudo-layers are seizure-safe (one-shot forwards, no infinite)', () => {
    // The H1 carries the glitch-text class (auto-mounted on every Services load).
    expect(source).toMatch(/<h1[^>]*glitch-text/)

    // Brace-counted bodies for the standalone ::before / ::after rules.
    // Selector anchored at a rule boundary so the shared
    // `.glitch-text::before, .glitch-text::after { content... }` rule (which
    // carries no animation) does not match.
    const beforeRule = extractRuleBody(
      source,
      /(?:^|\})\s*\.glitch-text::before\b\s*\{/,
      '{',
      '}',
    )
    const afterRule = extractRuleBody(
      source,
      /(?:^|\})\s*\.glitch-text::after\b\s*\{/,
      '{',
      '}',
    )
    expect(beforeRule, '.glitch-text::before rule body must be extractable').toBeTruthy()
    expect(afterRule, '.glitch-text::after rule body must be extractable').toBeTruthy()

    // forwards = one-shot reveal that holds the final frame (non-strobe).
    expect(beforeRule!).toMatch(/forwards/)
    expect(afterRule!).toMatch(/forwards/)

    // The bare `infinite` keyword must NOT appear in either glitch-text rule.
    expect(beforeRule!, 'Services glitch-text::before must NOT be an infinite strobe (#271 <3Hz)')
      .not.toMatch(/\binfinite\b/)
    expect(afterRule!, 'Services glitch-text::after must NOT be an infinite strobe (#271 <3Hz)')
      .not.toMatch(/\binfinite\b/)
  })

  it('#271 reduced-motion: a @media (prefers-reduced-motion: reduce) guard kills the glitch-text animation', () => {
    expect(source).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/)
    // The reduced-motion block must set animation: none on the glitch-text
    // pseudo-layers (brace-counted extraction of the @media body).
    const mediaBody = extractRuleBody(
      source,
      /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/,
      '{',
      '}',
    )
    expect(mediaBody, 'reduced-motion @media body must be extractable').toBeTruthy()
    expect(mediaBody).toMatch(/glitch-text/)
    expect(mediaBody).toMatch(/animation:\s*none/)
  })
})
