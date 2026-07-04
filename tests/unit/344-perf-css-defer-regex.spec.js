/**
 * @file tests/unit/344-perf-css-defer-regex.spec.js
 * @description Hermetic dual-build-variant gate for Issue #344
 * (deferEntryCss `transformIndexHtml` regex must match BOTH the prod base
 * subpath href AND the CI audit `--base=/` href).
 *
 * The companion 340 test gates the BUILT dist/index.html (prod base only).
 * It cannot run locally (rollup native binding broken in shared node_modules),
 * and it only exercises the prod-base href shape
 * `/KTechAICyberWeb/assets/index-HASH.css`. CI also runs a Lighthouse audit
 * variant built with `--base=/`, which makes Vite emit
 * `/assets/index-HASH.css` (zero chars before `/assets/`). The original
 * regex `[^"']+\/assets\/` required >=1 char before `/assets/`, so it
 * silently failed to match the audit build — entry CSS stayed
 * render-blocking in the audited output (iter-80 build-variant gap).
 *
 * This test is hermetic: it drives the plugin's `transformIndexHtml` hook
 * directly against sample HTML strings, so it runs under plain `vitest run`
 * with no build dependency. It covers both base variants in both attribute
 * orders (rel-first and href-first), negative cases (must not over-match),
 * and a context-invariance case (only the entry link is rewritten when
 * surrounded by non-entry and third-party links).
 *
 * @ticket #344
 */
import { describe, it, expect } from 'vitest'
import { deferEntryCss } from '../../vite.config.js'

const plugin = deferEntryCss()
const transform = (html) => plugin.transformIndexHtml(html)

// Helper: assert the three required rewrite artifacts are present AND the
// original blocking <link rel="stylesheet"> is gone (outside <noscript>).
function expectDeferred(html, href) {
  const out = transform(html)

  // 1. preload pointing at the SAME href. Assert one <link> element that has
  //    BOTH rel="preload" AND href="<href>" AND as="style", in any order. Use
  //    a regex on href (to enforce it sits inside a <link>) plus substring
  //    containment on the literal href to avoid escape bugs.
  const preloadLink = (out.match(/<link\b[^>]*rel=["']preload["'][^>]*>/gi) || []).find(
    (l) => l.includes(`href="${href}"`) && /\bas=["']style["']/i.test(l),
  )
  expect(
    preloadLink,
    `expected a <link rel="preload" ... href="${href}" ... as="style"> element; full output:\n${out}`,
  ).toBeDefined()

  // 2. the async-onload rel-swap handler
  expect(out, 'expected output to contain the onload rel-swap handler').toMatch(
    /onload=["']this\.onload=null;this\.rel=['"]stylesheet['"]["']/,
  )

  // 3. the <noscript> fallback stylesheet at the SAME href
  const noscriptMatch = (out.match(/<noscript>[^<]*<link\b[^>]*>[^<]*<\/noscript>/gi) || []).find(
    (l) => l.includes(`href="${href}"`) && /\brel=["']stylesheet["']/i.test(l),
  )
  expect(
    noscriptMatch,
    `expected a <noscript><link rel="stylesheet" href="${href}"></noscript> element; full output:\n${out}`,
  ).toBeDefined()

  // 4. the original blocking <link rel="stylesheet"> is GONE outside <noscript>.
  // Strip <noscript>...</noscript> first, then classify remaining <link>
  // elements by their top-level rel= attribute — none should include
  // 'stylesheet'. (The preload link's onload HANDLER contains the literal
  // text rel='stylesheet' INSIDE a quoted attr value, which is not a
  // top-level rel= attribute — \brel= on the element skips it.)
  const stripped = out.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '')
  const linkMatches = stripped.match(/<link\b[^>]*>/gi) || []
  const blockingLinks = linkMatches.filter((l) => {
    const relMatch = l.match(/\brel=["']([^"']*)["']/i)
    if (!relMatch) return false
    return relMatch[1].split(/\s+/).includes('stylesheet')
  })
  expect(
    blockingLinks,
    'a render-blocking <link rel="stylesheet"> remains outside <noscript>: ' +
      JSON.stringify(blockingLinks),
  ).toEqual([])
}

describe('#344 — deferEntryCss transformIndexHtml — dual base-variant coverage', () => {
  describe('positive cases (entry link is rewritten to preload + noscript)', () => {
    it('P1: prod base, rel-first', () => {
      const html = `<link rel="stylesheet" crossorigin href="/KTechAICyberWeb/assets/index-Abc.css">`
      expectDeferred(html, '/KTechAICyberWeb/assets/index-Abc.css')
    })

    it('P2: audit base (base=/), rel-first — THE BUG CASE', () => {
      const html = `<link rel="stylesheet" crossorigin href="/assets/index-Abc.css">`
      expectDeferred(html, '/assets/index-Abc.css')
    })

    it('P3: prod base, href-first', () => {
      const html = `<link crossorigin href="/KTechAICyberWeb/assets/index-Abc.css" rel="stylesheet">`
      expectDeferred(html, '/KTechAICyberWeb/assets/index-Abc.css')
    })

    it('P4: audit base (base=/), href-first — second angle of the bug', () => {
      const html = `<link crossorigin href="/assets/index-Abc.css" rel="stylesheet">`
      expectDeferred(html, '/assets/index-Abc.css')
    })
  })

  describe('negative cases (non-entry / non-matching links returned unchanged)', () => {
    it('N1: third-party absolute URL — returned unchanged', () => {
      const html = `<link rel="stylesheet" href="https://fonts.example.com/x.css">`
      expect(transform(html)).toBe(html)
    })

    it('N2: non-entry asset chunk — returned unchanged', () => {
      const html = `<link rel="stylesheet" href="/assets/vendor-abc.css">`
      expect(transform(html)).toBe(html)
    })

    it('N3: not a stylesheet (rel=icon) — returned unchanged', () => {
      const html = `<link rel="icon" href="/assets/index-Abc.css">`
      expect(transform(html)).toBe(html)
    })
  })

  describe('context invariance (only the entry link is rewritten)', () => {
    it('C1: entry link embedded among non-entry and third-party links', () => {
      const entryLink = `<link rel="stylesheet" crossorigin href="/assets/index-Abc.css">`
      const vendorLink = `<link rel="stylesheet" href="/assets/vendor-abc.css">`
      const fontLink = `<link rel="stylesheet" href="https://fonts.example.com/x.css">`
      const html = `<head>\n  ${fontLink}\n  ${entryLink}\n  ${vendorLink}\n</head>`

      const out = transform(html)

      // The entry link IS swapped: preload + noscript present at the entry href.
      expect(
        out,
        'expected a preload <link> pointing at the entry href',
      ).toContain(`<link rel="preload" href="/assets/index-Abc.css" as="style"`)
      expect(
        out,
        'expected a <noscript> fallback pointing at the entry href',
      ).toContain(`<noscript><link rel="stylesheet" href="/assets/index-Abc.css"></noscript>`)

      // The OTHER links are byte-identical (still present unchanged in output).
      expect(out).toContain(vendorLink)
      expect(out).toContain(fontLink)
    })
  })
})
