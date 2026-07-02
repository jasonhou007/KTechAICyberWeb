/**
 * @file tests/unit/334-perf-image-priority.spec.js
 * @description Source-of-fix gate for Issue #334 phase 2 — LCP IMAGE PRIORITY.
 *
 * The first phase (#334 Fix A + B) made the font stylesheet non-blocking and
 * eliminated CSS @import chains. The AFTER Lighthouse capture showed LCP still
 * missed the <2500ms target on /about (4268ms) and /news (3523ms), and the
 * LCP-element phase breakdown pinpointed the residual bottleneck: the LCP
 * <img> is discovered LATE because it is rendered by the SPA only after JS
 * hydration. The image's own "Load Delay" dominates the LCP:
 *
 *   /about LCP = hero <img src="...about-who-we-are-800w.webp">
 *                Load Delay = 3058ms (72% of LCP)
 *   /news   LCP = first news card <img class="cyber-image__img">
 *                Load Delay = 2872ms (82% of LCP) — defaults to loading="lazy"
 *
 * The fix is to give the browser an EARLY, HIGH-PRIORITY fetch hint for the
 * LCP image IN PARALLEL with the JS bundle, instead of waiting for hydration:
 *
 *   (C) CyberImage gains a `fetchpriority` prop so callers can hint any image.
 *       The About hero (the /about LCP element) is marked eager + high.
 *   (D) index.html <head> preloads the About hero LCP image
 *       (rel=preload as=image fetchpriority=high) so the browser starts the
 *       fetch immediately on HTML parse, before the JS bundle even arrives.
 *   (E) NewsList marks ONLY the first card as an LCP candidate and passes
 *       eager + fetchpriority=high to that card's CyberImage; the rest stay
 *       lazy (preserves off-screen lazy-load on the remaining cards).
 *
 * These are SOURCE gates (iter-13 adapted to image priority): they assert the
 * fix exists as active markup/code. A green Lighthouse run is the final
 * evidence; the source gate is what prevents a future refactor from silently
 * reverting the hint.
 *
 * The tests are RED against the pre-fix code: CyberImage has no fetchpriority
 * prop, About hero has no fetchpriority, index.html has no image preload, and
 * NewsList renders NewsCard with no lcpCandidate prop.
 *
 * @ticket #334
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'

import CyberImage from '../../src/components/CyberImage.vue'
import About from '../../src/views/About.vue'
import NewsList from '../../src/components/NewsList.vue'
import NewsCard from '../../src/components/NewsCard.vue'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')
const INDEX_HTML = readFileSync(resolve(ROOT, 'index.html'), 'utf8')

// Minimal 3-article fixture for NewsList/NewsCard. NewsCard only reads
// {image, altKey, title, excerpt, date, category, slug} — values chosen so
// the CyberImage branch renders (article.image truthy). The first article
// uses the real raster path so imageSrcset is non-empty (exercises the
// non-vector branch); the others use SVG paths so they take the vector
// (empty-srcset) branch. Either way the CyberImage renders an <img>.
const NEWS_FIXTURE = [
  {
    id: 1,
    slug: 'lcp-first-card',
    title: 'First card (LCP candidate)',
    excerpt: 'Should render eager + fetchpriority=high.',
    date: '2024-01-15',
    category: 'Company News',
    image: '/images/news/news-iso27001-official.webp',
    altKey: 'news.articleAlts.iso27001',
  },
  {
    id: 2,
    slug: 'lcp-second-card',
    title: 'Second card (lazy)',
    excerpt: 'Should render default lazy, no fetchpriority.',
    date: '2024-02-01',
    category: 'Technology Updates',
    image: '/images/news/news-cybersecurity.svg',
    altKey: 'news.articleAlts.cybersecurity',
  },
  {
    id: 3,
    slug: 'lcp-third-card',
    title: 'Third card (lazy)',
    excerpt: 'Should render default lazy, no fetchpriority.',
    date: '2024-03-01',
    category: 'Industry Insights',
    image: '/images/news/news-blockchain.svg',
    altKey: 'news.articleAlts.blockchain',
  },
]

describe('#334 Fix C — CyberImage fetchpriority prop', () => {
  it('renders fetchpriority="high" on the <img> when the prop is passed', () => {
    const wrapper = mount(CyberImage, {
      props: {
        src: '/images/about/about-who-we-are.webp',
        alt: 'about hero',
        fetchpriority: 'high',
      },
    })
    const img = wrapper.find('img')
    expect(img.exists(), '<img> must render').toBe(true)
    expect(
      img.attributes('fetchpriority'),
      'fetchpriority="high" prop must reach the <img> as an attribute',
    ).toBe('high')
  })

  it('OMITS the fetchpriority attribute when the prop is absent (default "")', () => {
    // When the prop is not passed, the <img> must NOT carry a fetchpriority
    // attribute at all (an empty fetchpriority="" would be invalid markup and
    // would defeat the "absent prop => no attribute" contract — the same rule
    // CyberImage already follows for srcset/sizes).
    const wrapper = mount(CyberImage, {
      props: {
        src: '/images/about/about-who-we-are.webp',
        alt: 'about hero',
      },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(
      img.attributes('fetchpriority'),
      'no fetchpriority attribute when prop absent (undefined, not "")',
    ).toBeUndefined()
  })
})

describe('#334 Fix C+D — About hero LCP image is eager + fetchpriority=high (+ preloaded in index.html)', () => {
  it('About.vue hero CyberImage is passed eager AND fetchpriority="high"', () => {
    // Mount the real About view (no useLanguage mock — the composable is real)
    // and find the hero figure's CyberImage. The hero is the first CyberImage
    // in the .about-hero__figure. Assert it receives BOTH eager (Boolean true)
    // AND fetchpriority="high" — the combination that promotes the hero image
    // to a high-priority fetch so the browser does not wait for SPA hydration
    // to discover the LCP element.
    const wrapper = mount(About)
    const heroFigure = wrapper.find('.about-hero__figure')
    expect(heroFigure.exists(), 'hero figure must render').toBe(true)
    const heroCyberImage = heroFigure.findComponent(CyberImage)
    expect(heroCyberImage.exists(), 'hero CyberImage must render').toBe(true)
    expect(
      heroCyberImage.props('eager'),
      'hero CyberImage must be eager (above-the-fold LCP)',
    ).toBe(true)
    expect(
      heroCyberImage.props('fetchpriority'),
      'hero CyberImage must be fetchpriority="high" (LCP priority hint)',
    ).toBe('high')
  })

  it('index.html preloads the About hero LCP image with fetchpriority=high (parallel-with-JS fetch)', () => {
    // The preload hint in <head> is what lets the browser start fetching the
    // hero image IN PARALLEL with the JS bundle, instead of waiting for the
    // SPA to hydrate and render the <img>. Assert a <link rel=preload as=image
    // fetchpriority=high> pointing at the 800w variant (the one Lighthouse
    // flagged as the LCP element on /about) exists in index.html.
    const preloadMatch = INDEX_HTML.match(
      /<link[^>]*rel=["']preload["'][^>]*as=["']image["'][^>]*>/i,
    )
    expect(preloadMatch, 'expected a <link rel=preload as=image> in index.html').not.toBeNull()
    expect(
      /about-who-we-are-800w\.webp/i.test(preloadMatch[0]),
      'preload must target the 800w About hero image (the LCP element). Found: ' + preloadMatch[0],
    ).toBe(true)
    expect(
      /fetchpriority=["']high["']/i.test(preloadMatch[0]),
      'preload must carry fetchpriority=high (LCP priority). Found: ' + preloadMatch[0],
    ).toBe(true)
  })
})

describe('#334 Fix E — NewsList first card is the LCP candidate', () => {
  it('NewsList passes lcpCandidate=true ONLY to the first card', () => {
    // Mount NewsList with a 3-article fixture. The first NewsCard must receive
    // lcpCandidate=true (it holds the LCP image); the rest must receive false
    // (or have it absent) so they stay lazy and preserve off-screen lazy-load.
    const wrapper = mount(NewsList, {
      props: { articles: NEWS_FIXTURE, visibleCount: 3, isLoading: false },
    })
    const cards = wrapper.findAllComponents(NewsCard)
    expect(cards.length, '3 articles must render 3 cards').toBe(3)
    expect(
      cards[0].props('lcpCandidate'),
      'first card must be the LCP candidate (lcpCandidate=true)',
    ).toBe(true)
    expect(
      cards[1].props('lcpCandidate'),
      'second card must NOT be the LCP candidate',
    ).toBe(false)
    expect(
      cards[2].props('lcpCandidate'),
      'third card must NOT be the LCP candidate',
    ).toBe(false)
  })

  it('NewsCard passes eager + fetchpriority="high" to its CyberImage when lcpCandidate=true', () => {
    const wrapper = mount(NewsCard, {
      props: { article: NEWS_FIXTURE[0], lcpCandidate: true, isLoading: false },
    })
    const cyberImage = wrapper.findComponent(CyberImage)
    expect(cyberImage.exists(), 'card CyberImage must render').toBe(true)
    expect(
      cyberImage.props('eager'),
      'LCP-candidate card must pass eager to CyberImage',
    ).toBe(true)
    expect(
      cyberImage.props('fetchpriority'),
      'LCP-candidate card must pass fetchpriority="high" to CyberImage',
    ).toBe('high')
  })

  it('NewsCard leaves CyberImage at default (lazy, no fetchpriority) when lcpCandidate is false', () => {
    // Non-LCP cards must stay lazy (loading="lazy") and carry NO fetchpriority
    // hint — that is what preserves the off-screen lazy-load benefit on the
    // remaining cards. Asserting eager=false AND fetchpriority absent.
    const wrapper = mount(NewsCard, {
      props: { article: NEWS_FIXTURE[1], lcpCandidate: false, isLoading: false },
    })
    const cyberImage = wrapper.findComponent(CyberImage)
    expect(cyberImage.exists()).toBe(true)
    expect(
      cyberImage.props('eager'),
      'non-LCP card must NOT be eager (stays lazy)',
    ).toBe(false)
    expect(
      cyberImage.props('fetchpriority'),
      'non-LCP card must NOT carry a fetchpriority hint',
    ).toBe('')
  })
})
