/**
 * @file tests/unit/340-perf-news-image-preload.spec.js
 * @description Source gate for Issue #340 Step 3 (preload the /news first-card
 * LCP image, which has Load Delay = 3154ms = 83% of /news LCP).
 *
 * Diagnosis (from #340 Lighthouse audits): even with eager + fetchpriority=high
 * (#334 Fix E), the /news first-card image Load Delay is 3154ms because the
 * SPA must parse ~100KB JS + hydrate before the <img> is in the DOM — the
 * browser cannot discover it from the initial HTML. A
 * `<link rel="preload" as="image">` in <head> lets the parser start the fetch
 * on first paint, before the JS bundle even arrives.
 *
 * #374 RATIONALE UPDATE: the /news first-card image changed from a 258x258
 * raster to a purpose-built SVG illustration (iso27001-shield.svg). A vector
 * has no intrinsic pixel width, so the
 * responsive-srcset rationale (#340's original imagesrcset+imagesizes mirror
 * of NewsCard's raster branch) no longer applies: NewsCard/NewsDetail emit NO
 * srcset/sizes for .svg paths, and the preload is a plain
 * `href="/images/news/iso27001-shield.svg"` with NO imagesrcset/imagesizes.
 * (The /about hero preload above it keeps imagesrcset+imagesizes — that image
 * is still a raster.)
 *
 * ITER-53 DEFENSE (string-literal drift): the expected href is DERIVED from
 * source (src/data/news.json[0].image) by a separate test below, so a future
 * edit to news.json that does not update index.html fails the suite visibly.
 *
 * @ticket #340
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')
const INDEX_HTML_PATH = resolve(ROOT, 'index.html')
const NEWS_JSON_PATH = resolve(ROOT, 'src/data/news.json')

/** Read index.html source (the SOURCE file is authorable; the preload is added there). */
function readIndexHtml() {
  return readFileSync(INDEX_HTML_PATH, 'utf-8')
}

/**
 * Programmatically re-derive the expected news preload from source:
 *   - firstNewsImage = news.json[0].image
 *   - isVector      = firstNewsImage endsWith('.svg')
 * For a vector first card (#374), NewsCard emits no srcset/sizes, so the
 * preload must be a plain `href` with no imagesrcset/imagesizes.
 * This catches drift: if news.json[0].image changes but index.html's preload
 * is not updated, the derived test fails — surfacing the mismatch.
 */
function deriveExpectedPreload() {
  const news = JSON.parse(readFileSync(NEWS_JSON_PATH, 'utf-8'))
  const firstNewsImage = news[0].image
  const isVector = firstNewsImage.toLowerCase().endsWith('.svg')
  return { firstNewsImage, isVector }
}

/**
 * Extract the NEWS preload <link> block (the one whose href/imagesrcset
 * references /images/news/), as opposed to the /about hero preload which
 * legitimately keeps imagesrcset+imagesizes for its raster variants.
 */
function newsPreloadBlock(html) {
  const links = html.match(/<link[^>]*rel=["']preload["'][^>]*as=["']image["'][^>]*>/g) || []
  return links.find((l) => l.includes('/images/news/')) || null
}

describe('#340 Step 3 — /news first-card image preload in index.html <head>', () => {
  let html
  beforeAll(() => {
    html = readIndexHtml()
  })

  it('index.html <head> contains a <link rel="preload" as="image"> for the news LCP image', () => {
    expect(newsPreloadBlock(html), 'expected a news preload-as=image link in index.html').not.toBeNull()
  })

  it('the news preload has fetchpriority="high" (marks it as the LCP candidate)', () => {
    const block = newsPreloadBlock(html)
    expect(block, 'expected a news preload-as=image link in index.html').not.toBeNull()
    expect(block).toMatch(/fetchpriority=["']high["']/i)
  })

  it('the news preload href matches the derived news.json[0].image (iter-53 drift guard)', () => {
    // DERIVED test: re-derive the expected href from news.json[0].image and
    // assert the index.html news preload points at it. If news.json changes
    // without updating index.html, this fails.
    const { firstNewsImage, isVector } = deriveExpectedPreload()
    expect(isVector, 'the /news first card image is expected to be a vector (.svg) since #374').toBe(true)
    const block = newsPreloadBlock(html)
    expect(block, 'expected a news preload-as=image link in index.html').not.toBeNull()
    expect(
      block,
      `news preload missing href="${firstNewsImage}" (derived from news.json[0].image)`,
    ).toContain(`href="${firstNewsImage}"`)
  })

  it('the news preload has NO imagesrcset/imagesizes (vector first card — srcset is meaningless)', () => {
    // DERIVED test: for a vector first card, NewsCard emits no srcset/sizes,
    // so the preload must not carry imagesrcset/imagesizes either. A raster
    // first card would flip deriveExpectedPreload().isVector to false and
    // this whole contract would need revisiting in the same PR.
    const { isVector } = deriveExpectedPreload()
    expect(isVector, 'the /news first card image is expected to be a vector (.svg) since #374').toBe(true)
    const block = newsPreloadBlock(html)
    expect(block, 'expected a news preload-as=image link in index.html').not.toBeNull()
    expect(block).not.toMatch(/imagesrcset/i)
    expect(block).not.toMatch(/imagesizes/i)
  })

  it('the preload points at the iso27001-shield.svg first-card image (literal-contract guard)', () => {
    // LITERAL test: asserts the hardcoded expected first-card image path is
    // present in index.html. This is the contract the planner-specified
    // prompt called out; if the first news item changes to a different image
    // (and the derived test above is updated), this literal test must be
    // updated IN THE SAME PR so the change is explicit.
    expect(html).toContain('href="/images/news/iso27001-shield.svg"')
  })

  it('no imagesrcset on the news preload (literal-contract guard)', () => {
    // LITERAL test mirroring the derived no-imagesrcset assertion above, so
    // the vector contract is explicit even if news.json[0] changes.
    const block = newsPreloadBlock(html)
    expect(block, 'expected a news preload-as=image link in index.html').not.toBeNull()
    expect(block).not.toMatch(/imagesrcset/i)
  })
})
