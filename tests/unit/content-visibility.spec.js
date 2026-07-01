/**
 * @file content-visibility.spec.js
 * @description Source-grep guard for the content-visibility:auto perf win
 * (Issue #253 AC #3 — no visual jumps / CLS).
 * @ticket #253
 *
 * content-visibility: auto lets the browser skip rendering/layout/paint for
 * offscreen subtrees (big perf win for long pages), but it INTRODUCES layout
 * shift (CLS regression — the exact AC #3 anti-goal) UNLESS every such rule
 * also carries a contain-intrinsic-size so the browser reserves the box's
 * height before the subtree is rendered.
 *
 * This spec enforces the CLS guard at the SOURCE level for the two views this
 * ticket touches (Home.vue + About.vue):
 *   1. every `content-visibility:\s*auto` declaration MUST sit in a rule block
 *      that ALSO contains a `contain-intrinsic-size` declaration (same block);
 *   2. each file must have at least one such rule (the perf win is actually
 *      applied, not just allowed).
 *
 * Source-grep (not computed-style) because content-visibility is a static CSS
 * property — there is no runtime variance to assert, and a DOM test would
 * couple this guard to the live render path unnecessarily.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const VIEWS_DIR = resolve(__dirname, '../../src/views')

function readView(name) {
  return readFileSync(resolve(VIEWS_DIR, name), 'utf8')
}

/**
 * Extract every CSS rule block (the text between a `{` and its matching `}`) as
 * a string, ignoring the selector. We split on `}` at the top level of the
 * <style> scope — sufficient for the flat, non-nested rule blocks these views
 * use (no @nest, no SCSS-style nesting).
 *
 * We deliberately operate only on the <style> body, NOT the <template>, so a
 * `content-visibility` string in HTML/JS is not mistaken for a CSS declaration.
 */
function extractCssRuleBlocks(source) {
  const styleMatch = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)
  if (!styleMatch) return []
  let css = styleMatch[1]
  // Strip /* ... */ comments FIRST. A comment that mentions the literal
  // declaration (e.g. an explanatory "we do NOT apply content-visibility:auto
  // here because this module is interactive") must not be mistaken for a real
  // declaration — without this, the "every cv:auto rule has contain-intrinsic-
  // size" guard false-positives on prose that merely references the property.
  css = css.replace(/\/\*[\s\S]*?\*\//g, '')
  // Split into rule blocks on the closing brace.
  return css
    .split('}')
    .map((block) => block + '}') // re-add the brace so declarations are detectable
}

const CV_AUTO_RE = /content-visibility\s*:\s*auto/i
const CIS_RE = /contain-intrinsic-size\s*:/i

describe('content-visibility CLS guard (#253 AC3)', () => {
  const files = ['Home.vue', 'About.vue']

  for (const file of files) {
    it(`${file} has at least one content-visibility:auto rule (the perf win is applied)`, () => {
      const blocks = extractCssRuleBlocks(readView(file))
      const cvBlocks = blocks.filter((b) => CV_AUTO_RE.test(b))
      expect(cvBlocks.length).toBeGreaterThan(0)
    })

    it(`${file}: every content-visibility:auto rule also has contain-intrinsic-size (no CLS)`, () => {
      const blocks = extractCssRuleBlocks(readView(file))
      const cvBlocks = blocks.filter((b) => CV_AUTO_RE.test(b))
      for (const block of cvBlocks) {
        expect(
          CIS_RE.test(block),
          `Rule block with content-visibility:auto is missing contain-intrinsic-size:\n${block}`,
        ).toBe(true)
      }
    })
  }
})
