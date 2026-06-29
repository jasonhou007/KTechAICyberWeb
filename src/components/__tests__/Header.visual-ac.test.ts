/**
 * @file Header.visual-ac.test.ts
 * @description CSS-source gate for Header.vue a11y WCAG 2.5.8 target-size.
 * @ticket #190 - residual a11y (R1)
 *
 * Lighthouse re-measurement flagged the mobile hamburger `.nav-toggle` button
 * at 22.6 x 22px, below the WCAG 2.5.8 "target size (minimum)" 24 x 24px rule.
 * The source declares `.nav-toggle { height: 22px }` (line ~352), so the
 * rendered hit target is under the minimum on its short axis.
 *
 * DOM tests cannot SEE CSS — a height revert passes every DOM test (iter-13
 * lesson). This gate reads the Header.vue SOURCE, strips comments so a
 * commented-out rule cannot masquerade as an active one (iter-15 lesson), and
 * asserts the declared `.nav-toggle` height is >= 24px.
 *
 * Pattern mirrors CyberOpsHud.visual-ac.test.ts (#182): read the .vue source,
 * strip comments, assert the active CSS rule.
 *
 * RED-TEST PROOF: setting `.nav-toggle { height: 22px }` (the original failing
 * value) makes this test FAIL; setting it to 24px or higher makes it PASS.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const componentPath = path.resolve(__dirname, '../Header.vue')

/** Strip comments so they cannot masquerade as active CSS. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

describe('Header.vue — target-size CSS-source gate (#190 R1)', () => {
  let source: string

  beforeAll(() => {
    const raw = fs.readFileSync(componentPath, 'utf-8')
    source = stripComments(raw)
    expect(source, 'Header.vue source must be readable').toBeTruthy()
  })

  // --------------------------------------------------------------------------
  // WCAG 2.5.8 "Target Size (Minimum)" requires every interactive target to be
  // at least 24x24 CSS pixels (with the AA-equivalent Lighthouse threshold).
  // The `.nav-toggle` hamburger is mobile-only (display:flex inside the
  // @media (max-width:768px) block; display:none at desktop). Its declared
  // width (28px) already passes; the height was 22px (the regression).
  // RED-TEST PROOF: reverting height to 22px makes this fail.
  // --------------------------------------------------------------------------
  it('.nav-toggle declares a height >= 24px (WCAG 2.5.8 target-size minimum)', () => {
    // Match the ACTIVE .nav-toggle rule block. There are two `.nav-toggle`
    // blocks in the file: the base rule (display:none + width/height) and the
    // mobile override (display:flex). The width/height live in the base rule;
    // the override only flips display, so we capture the FIRST block.
    const block = source.match(/\.nav-toggle\s*\{([\s\S]*?)\n\}/)
    expect(block, '.nav-toggle rule must exist').not.toBeNull()

    const heightDecl = block![1].match(/height:\s*(\d+(?:\.\d+)?)px/)
    expect(heightDecl, '.nav-toggle must declare a height in px').not.toBeNull()

    const height = parseFloat(heightDecl![1])
    expect(
      height,
      `.nav-toggle height ${height}px is below the 24px WCAG target-size minimum`,
    ).toBeGreaterThanOrEqual(24)
  })

  it('.nav-toggle declares a width >= 24px (WCAG 2.5.8 target-size minimum)', () => {
    // Guards against a future width regression flipping the OTHER axis under 24.
    const block = source.match(/\.nav-toggle\s*\{([\s\S]*?)\n\}/)
    expect(block, '.nav-toggle rule must exist').not.toBeNull()

    const widthDecl = block![1].match(/width:\s*(\d+(?:\.\d+)?)px/)
    expect(widthDecl, '.nav-toggle must declare a width in px').not.toBeNull()

    const width = parseFloat(widthDecl![1])
    expect(
      width,
      `.nav-toggle width ${width}px is below the 24px WCAG target-size minimum`,
    ).toBeGreaterThanOrEqual(24)
  })

  // --------------------------------------------------------------------------
  // #190 R4 (coordinator re-measurement): even with width:28px + height:24px
  // declared, Lighthouse STILL reported the rendered button at 22.6 x 24px.
  // Root cause: .nav-toggle is a flex child of .nav (display:flex;
  // justify-content:space-between). Flex items default to flex-shrink:1, so the
  // container compresses the button BELOW its declared 28px width. The canonical
  // fix is flex-shrink:0 on the base .nav-toggle rule. A pure DOM test cannot
  // see CSS (iter-13 lesson), so this reads the source block and asserts the
  // active declaration.
  // RED-TEST PROOF: removing `flex-shrink: 0` from the .nav-toggle rule makes
  // this test FAIL; re-adding it makes it PASS.
  // --------------------------------------------------------------------------
  it('.nav-toggle declares flex-shrink: 0 (prevent flex parent squeezing the 28px width)', () => {
    const block = source.match(/\.nav-toggle\s*\{([\s\S]*?)\n\}/)
    expect(block, '.nav-toggle rule must exist').not.toBeNull()

    // flex-shrink:0 — the canonical fix. Must be present in the ACTIVE rule
    // (comments already stripped by beforeAll, so a commented-out copy will not
    // match).
    expect(
      block![1],
      '.nav-toggle must declare flex-shrink: 0 so the flex parent (.nav ' +
        'display:flex) cannot squeeze the declared 28px width below the 24px ' +
        'WCAG target-size minimum (coordinator observed 22.6px rendered)',
    ).toMatch(/flex-shrink\s*:\s*0/)
  })
})
