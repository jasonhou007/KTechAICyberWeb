/**
 * @file App.footer-a11y.test.ts
 * @description CSS-source a11y gate for the App.vue footer (#190).
 * @ticket #190
 *
 * Lighthouse flagged two footer a11y audits:
 *  - link-in-text-block: footer links #00f0ff contrast 1.53:1 vs surrounding
 *    text AND no non-color distinguisher (text-decoration:none).
 *  - color-contrast: footer status #1a1a2e on #39393e = 1.48:1 (no explicit
 *    color on .footer-status, inheritance computed to a failing value).
 *
 * DOM tests cannot SEE CSS (jsdom does not resolve computed stylesheets
 * reliably), so this gate reads the App.vue SOURCE, strips comments, and
 * asserts each a11y fix is DECLARED as active CSS. Pattern mirrors
 * CyberOpsHud.visual-ac.test.ts (#182).
 *
 * RED-TEST PROOF: reverting text-decoration:none on .footer-link fails the
 * underline assertion; removing the explicit color on .footer-status fails the
 * contrast assertion.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const componentPath = path.resolve(__dirname, '../App.vue')

/** Strip comments so they cannot masquerade as active CSS. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

/**
 * WCAG 2.x relative luminance + contrast ratio. Used to verify the declared
 * footer-status color clears 4.5:1 against the footer background. Pure
 * functions on hex triples — no DOM dependency.
 */
function srgbToLinear(channel: number): number {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
function relativeLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error(`bad hex: ${hex}`)
  const r = parseInt(m[1].slice(0, 2), 16)
  const g = parseInt(m[1].slice(2, 4), 16)
  const b = parseInt(m[1].slice(4, 6), 16)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}
function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA)
  const lb = relativeLuminance(hexB)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('App.vue footer a11y CSS-source gate (#190)', () => {
  let source: string

  beforeAll(() => {
    const raw = fs.readFileSync(componentPath, 'utf-8')
    source = stripComments(raw)
    expect(source, 'App.vue source must be readable').toBeTruthy()
  })

  // --------------------------------------------------------------------------
  // Audit 4 — link-in-text-block: footer links need a persistent underline (a
  // non-color distinguisher) since the link color contrasts poorly with the
  // surrounding footer text.
  // RED-TEST PROOF: reverting text-decoration:none on .footer-link fails this.
  // --------------------------------------------------------------------------
  describe('Audit 4 — link-in-text-block (footer link underline)', () => {
    it('.footer-link rule declares text-decoration: underline (persistent non-color distinguisher)', () => {
      const block = source.match(/\.footer-link\s*\{([\s\S]*?)\}/)
      expect(block, '.footer-link rule must exist').not.toBeNull()
      expect(block![1]).toMatch(/text-decoration:\s*underline/)
    })

    it('.footer-link color differs from .footer-text color (non-color distinguisher ALSO present)', () => {
      const linkBlock = source.match(/\.footer-link\s*\{([\s\S]*?)\}/)
      const textBlock = source.match(/\.footer-text\s*\{([\s\S]*?)\}/)
      expect(linkBlock, '.footer-link rule must exist').not.toBeNull()
      expect(textBlock, '.footer-text rule must exist').not.toBeNull()
      const linkColor = linkBlock![1].match(/color:\s*(#[0-9a-f]{3,8}|var\([^)]+\))/i)
      const textColor = textBlock![1].match(/color:\s*(#[0-9a-f]{3,8}|var\([^)]+\))/i)
      expect(linkColor, '.footer-link must declare a color').not.toBeNull()
      expect(textColor, '.footer-text must declare a color').not.toBeNull()
      expect(linkColor![1]).not.toBe(textColor![1])
    })
  })

  // --------------------------------------------------------------------------
  // Audit 5 — color-contrast: .footer-status must declare an explicit color
  // (not rely on inheritance) AND that color must clear 4.5:1 against the
  // footer background.
  // RED-TEST PROOF: removing the explicit color from .footer-status fails the
  // first assertion; using a low-contrast color fails the ratio assertion.
  // --------------------------------------------------------------------------
  describe('Audit 5 — color-contrast (footer status explicit color)', () => {
    it('.footer-status rule declares an explicit color (not relying on inheritance)', () => {
      const block = source.match(/\.footer-status\s*\{([\s\S]*?)\}/)
      expect(block, '.footer-status rule must exist').not.toBeNull()
      expect(block![1]).toMatch(/color:\s*(#[0-9a-f]{3,8}|var\([^)]+\))/i)
    })

    it('.footer-status declared color clears 4.5:1 against the footer background (dark theme)', () => {
      // The footer background is rgba(10,10,15,0.8) over a dark page bg, which
      // approximates to #0a0a0f. We compute against that. The .footer-status
      // color is consumed via a CSS var (#242 tokenized it to var(--text-primary));
      // the canonical value of --text-primary is #e0e0e0 (defined in variables.css).
      // We resolve the var to that canonical literal to compute the ratio statically.
      const statusBlock = source.match(/\.footer-status\s*\{([\s\S]*?)\}/)
      expect(statusBlock, '.footer-status rule must exist').not.toBeNull()
      const colorDecl = statusBlock![1].match(/color:\s*(#[0-9a-f]{3,8}|var\([^)]+\))/i)
      expect(colorDecl, '.footer-status must declare a color').not.toBeNull()
      // Resolve var(--text-primary) -> canonical #e0e0e0 (variables.css). Any
      // other var fails loud (author must wire a known canonical token here).
      let fg = colorDecl![1]
      if (/var\(--text-primary\)/i.test(fg)) fg = '#e0e0e0'
      else if (/^var\(/i.test(fg)) {
        throw new Error(`.footer-status uses ${fg}; static ratio-check needs var(--text-primary)`)
      }
      const bg = '#0a0a0f'
      const ratio = contrastRatio(fg, bg)
      expect(ratio, `.footer-status ${fg} vs footer bg ${bg} = ${ratio.toFixed(2)}:1, need >= 4.5`).toBeGreaterThanOrEqual(4.5)
    })
  })
})
