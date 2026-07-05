/**
 * @file Header.navbar-green.test.ts
 * @description CSS-source gate for Header.vue navbar link color (#353).
 * @ticket #353 - unify navbar item color to brand cyan (green)
 *
 * The four direct router-links (Home, About Us, News, Contact) historically
 * inherited the gray `var(--text-secondary)` from the bare `.nav-links a` rule,
 * while the two dropdown triggers (Our Solutions, Join Us) and ALL hover/active
 * states already used brand cyan. The fix introduces a `--nav-link` semantic
 * token (== var(--cyan) == #00ffcc) and swaps the base `.nav-links a` color.
 *
 * DOM/computed tests cannot see CSS source (iter-13 lesson); comments must be
 * stripped so a commented-out rule cannot masquerade as active (iter-15
 * lesson). This gate reads Header.vue source, strips comments, isolates the
 * BARE `.nav-links a` block (NOT `.nav-links a:hover`, `:focus`, or
 * `.router-link-active`), and asserts its `color:` is `var(--nav-link)`.
 *
 * RED-PROOF: reverting the color to `var(--text-secondary)` makes this test
 * FAIL. The new token introduction alone (without the Header.vue swap) also
 * fails this test, because the bare block still resolves to --text-secondary.
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

describe('Header.vue — navbar link color gate (#353)', () => {
  let source: string

  beforeAll(() => {
    const raw = fs.readFileSync(componentPath, 'utf-8')
    source = stripComments(raw)
    expect(source, 'Header.vue source must be readable').toBeTruthy()
  })

  // --------------------------------------------------------------------------
  // #353 AC1: all navbar items use brand cyan (the "Contact green") by default.
  // The base color is set ONCE on the bare `.nav-links a` rule; the
  // hover/focus/active rules then keep or reinforce cyan. Asserting the bare
  // block's color is `var(--nav-link)` proves the default state is cyan.
  //
  // RED-PROOF: reverting the bare `.nav-links a { color: ... }` declaration to
  // `var(--text-secondary)` (the pre-#353 value) makes this test FAIL.
  // --------------------------------------------------------------------------
  it('bare .nav-links a block declares color: var(--nav-link) (not --text-secondary)', () => {
    // Isolate the BARE `.nav-links a { ... }` block. The selector must be
    // EXACTLY ".nav-links a" — followed by "{" — so this match does NOT capture
    // the descendant compound selectors (.nav-links a:hover, .nav-links a:focus,
    // .nav-links a.router-link-active, .nav-links a::after, etc.). Anchor on a
    // line start + the literal selector + "{"; the body ends at the next "\n}"
    // at column 0 (the closing brace of a top-level CSS rule).
    const blockMatch = source.match(/^\.nav-links\s+a\s*\{([\s\S]*?)\n\}/m)
    expect(blockMatch, 'bare .nav-links a rule must exist').not.toBeNull()

    const block = blockMatch![1]
    const colorDecl = block.match(/^\s*color:\s*([^;]+);/m)
    expect(colorDecl, '.nav-links a must declare a color').not.toBeNull()

    const value = colorDecl![1].trim()
    expect(
      value,
      `.nav-links a color must be var(--nav-link) (brand cyan); got "${value}"`,
    ).toBe('var(--nav-link)')
  })

  // --------------------------------------------------------------------------
  // Negative guard: the pre-fix value must NOT reappear in the bare block.
  // Catches a regression where the swap is reverted (leaves the new token
  // defined but unused on this rule). RED-PROOF identical to the test above.
  // --------------------------------------------------------------------------
  it('bare .nav-links a block does NOT declare color: var(--text-secondary)', () => {
    const blockMatch = source.match(/^\.nav-links\s+a\s*\{([\s\S]*?)\n\}/m)
    expect(blockMatch, 'bare .nav-links a rule must exist').not.toBeNull()
    const block = blockMatch![1]
    expect(
      block,
      'pre-#353 var(--text-secondary) must not return to the bare .nav-links a block',
    ).not.toMatch(/color:\s*var\(--text-secondary\)/)
  })
})
