/**
 * @file tests/unit/340-perf-css-defer-pattern.spec.js
 * @description Build-output gate for Issue #340 Step 2 (defer the entry CSS
 * bundle via preload + async-onload pattern with a <noscript> fallback).
 *
 * Scope: this gate covers the PROD-BASE build variant only — the built
 * dist/index.html uses the base subpath '/KTechAICyberWeb/assets/...'. The
 * CI Lighthouse audit variant (built with --base=/, which emits
 * '/assets/index-HASH.css' with zero chars before /assets/) is covered
 * hermetically by 344-perf-css-defer-regex.spec.js, which drives the
 * plugin's transformIndexHtml hook directly (no build dependency).
 *
 * The Vite-emitted `<link rel="stylesheet" href="/KTechAICyberWeb/assets/index-HASH.css">`
 * is render-blocking: the browser stops parsing the HTML until the sheet
 * downloads + parses. The web-standard pattern to make it non-blocking
 * (without dropping the styles when JS is disabled) is to rewrite the link as:
 *
 *   <link rel="preload" href="...index-HASH.css" as="style"
 *         onload="this.onload=null;this.rel='stylesheet'">
 *   <noscript><link rel="stylesheet" href="...index-HASH.css"></noscript>
 *
 * The browser preloads the sheet at low priority WITHOUT blocking render;
 * when it loads, the onload handler flips rel to 'stylesheet' so the rules
 * apply. Users without JS get the original render-blocking <link> via <noscript>
 * (acceptable because without JS the SPA cannot run anyway — the page is just
 * the dark background + #app div).
 *
 * This is implemented as a `transformIndexHtml` Vite plugin with
 * `enforce: 'post'` so it runs AFTER Vite has resolved the hashed bundle URL
 * and injected the production `<link rel="stylesheet">`. The source index.html
 * stays authorable; only the built dist/index.html gets the rewrite.
 *
 * This test runs ONLY when `dist/index.html` exists (post-build CI path),
 * mirroring the `describe.skipIf(!existsSync(...))` pattern in css-purge.spec.js.
 *
 * @ticket #340
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')
const DIST_HTML_PATH = resolve(ROOT, 'dist/index.html')

// describe.skipIf: when no build is present (the standard `vitest run` CI path
// does not build first), the suite no-ops cleanly — same guard pattern as
// css-purge.spec.js.
describe.skipIf(!existsSync(DIST_HTML_PATH))('#340 Step 2 — built dist/index.html defers the entry CSS bundle', () => {
  let html
  beforeAll(() => {
    html = readFileSync(DIST_HTML_PATH, 'utf-8')
  })

  it('dist/index.html contains a preload for the entry CSS chunk', () => {
    // The preload is what makes the sheet non-render-blocking: the browser
    // fetches it without blocking HTML parsing. Assert both the rel=preload
    // AND the as=style attribute (the latter is required for preload
    // prioritization correctness).
    expect(html).toMatch(/<link[^>]*rel=["']preload["'][^>]*as=["']style["'][^>]*>/)
  })

  it('the preload link points at the hashed entry CSS chunk (assets/index-*.css)', () => {
    // The preload must target the SAME hashed chunk Vite emitted as the
    // original render-blocking <link>. A preload to a different URL would be
    // a wasted fetch. assets/index-HASH.css is the Vite-emitted entry chunk
    // under the base subpath. Match a single <link> element that has BOTH
    // rel="preload" AND href=".../assets/index-*.css" (in any order) — the
    // regex captures one link element and asserts both attrs are present.
    const linkMatches = html.match(/<link\b[^>]*>/gi) || []
    const preloadEntryLink = linkMatches.find((l) =>
      /rel=["']preload["']/i.test(l) && /href=["'][^"']*assets\/index-[^"']*\.css["']/i.test(l),
    )
    expect(
      preloadEntryLink,
      'no <link rel="preload" href=".../assets/index-*.css"> found in dist/index.html — the preload does not target the entry CSS chunk',
    ).toBeDefined()
  })

  it('dist/index.html contains the async-onload rel-swap handler on the preload', () => {
    // `onload="this.onload=null;this.rel='stylesheet'"` is the standard
    // pattern that flips the preload into an active stylesheet once it loads.
    // Without this handler the sheet would be preloaded but never applied.
    // Allow either single or double quotes around the rel value.
    expect(html).toMatch(/onload=["']this\.onload=null;this\.rel=['"]stylesheet['"]["']/)
  })

  it('dist/index.html contains a <noscript> fallback stylesheet for the entry chunk', () => {
    // The <noscript> fallback preserves the styles for users with JS
    // disabled. Without it, no-JS users would see an unstyled page (the
    // preload never fires the onload swap because JS is off). Assert the
    // fallback link is INSIDE <noscript> and points at the same hashed chunk.
    expect(html).toMatch(/<noscript>\s*<link[^>]*rel=["']stylesheet["'][^>]*assets\/index-[^"']*\.css[^>]*>\s*<\/noscript>/)
  })

  it('dist/index.html does NOT contain a render-blocking stylesheet <link> outside <noscript>', () => {
    // After the rewrite, the ONLY standalone `rel="stylesheet"` link in the
    // built HTML must be the one inside <noscript>. A render-blocking
    // stylesheet <link> in the main flow would mean the rewrite failed / the
    // original Vite injection is still present.
    //
    // CAUTION: the preload link's onload HANDLER contains the literal text
    // `rel='stylesheet'` (inside the onload="..." attribute value), so a
    // naive `<link[^>]*rel="stylesheet"` regex matches the preload link too
    // (the [^>]* greedily walks through the onload attribute's content).
    // The robust check is: enumerate every <link> element, classify each by
    // its TOP-LEVEL rel attribute (the rel= that appears as a link attribute,
    // NOT inside an onload="..." handler), and assert none outside <noscript>
    // has rel="stylesheet" as its primary rel token.
    const stripped = html.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '')
    const linkMatches = stripped.match(/<link\b[^>]*>/gi) || []
    // For each link, extract the rel attribute value. The regex
    // /\brel=["']([^"']*)["']/ captures the FIRST rel= on the element, which
    // is the link's actual rel (the onload handler's rel= is inside a quoted
    // attr value, not a top-level rel= attr — and even if a naive regex saw
    // it, it's preceded by `;this.` so \brel= would NOT match it as a word
    // boundary rel attr).
    const blockingLinks = linkMatches.filter((l) => {
      const relMatch = l.match(/\brel=["']([^"']*)["']/i)
      if (!relMatch) return false
      const rels = relMatch[1].split(/\s+/)
      return rels.includes('stylesheet')
    })
    expect(
      blockingLinks,
      'a render-blocking <link rel="stylesheet"> remains in dist/index.html outside <noscript> — the defer rewrite did not apply. Found: ' +
        JSON.stringify(blockingLinks),
    ).toEqual([])
  })
})
