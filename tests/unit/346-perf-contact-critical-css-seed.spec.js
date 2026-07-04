/**
 * @file tests/unit/346-perf-contact-critical-css-seed.spec.js
 * @description Source-of-fix gate for Issue #346 Commit 3 — add a critical
 * `.section-title` font rule to the inline `<style>` seed in index.html.
 *
 * Diagnosis (from #346 mobile LCP capture): /contact LCP=2871ms (score 93).
 * The /contact LCP element is an `<h2 class="section-title">`. Its
 * font-family (Orbitron via `var(--font-display)`) is currently delivered by
 * the deferred route-chunk CSS — so the h2 cannot paint with the correct
 * font until that chunk loads, hydrates, and applies the rule. Adding a
 * `.section-title{font-family:var(--font-display)...}` rule to the inline
 * seed in index.html lets the h2 paint in Orbitron immediately from the
 * initial HTML document, bypassing the route chunk for that one rule.
 *
 * The existing seed already defines `--font-display`, h1/h2/h3 generic
 * rules, and #340's removed-main rule comment — this test asserts the seed
 * ALSO carries a specific `.section-title` rule.
 *
 * @ticket #346
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')
const INDEX_HTML_PATH = resolve(ROOT, 'index.html')

describe('#346 Commit 3 — index.html seed carries .section-title font rule', () => {
  let styleBlock
  let stripped
  beforeAll(() => {
    const html = readFileSync(INDEX_HTML_PATH, 'utf-8')
    // Extract the inline <style>...</style> block content.
    const m = html.match(/<style>([\s\S]*?)<\/style>/)
    expect(m, 'index.html must have an inline <style> block').toBeDefined()
    styleBlock = m[1]
    // Strip CSS comments so a commented-out rule cannot pass.
    stripped = styleBlock.replace(/\/\*[\s\S]*?\*\//g, '')
  })

  it('defines a .section-title rule with font-family: var(--font-display)', () => {
    const ruleRegex = /\.section-title\s*\{[^}]*font-family\s*:\s*var\(--font-display\)/
    expect(
      stripped,
      'index.html inline seed must include `.section-title { font-family: var(--font-display); ... }` so /contact LCP h2 paints in Orbitron without waiting on the route chunk CSS (#346)',
    ).toMatch(ruleRegex)
  })
})
