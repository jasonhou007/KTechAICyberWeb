/**
 * @file seo.test.ts
 * @description Unit tests for SEO utilities (src/utils/seo.js)
 * @ticket #114 - TEST-038: SEO Utils (seo.js) Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - getRouteMeta: per-route title/description, canonical, og/twitter fields, fallback
 * - getStructuredData: JSON-LD validity, route-specific schema, serializability
 * - getSitemapRoutes: shape, coverage of primary pages
 * - Edge Cases: missing params, purity (no input mutation), determinism
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Existing implementation satisfies tests
 * 3. Refactor: Test code organized for clarity and maintainability
 *
 * These are pure functions of `route` — no mocks required.
 * Canonical URLs are derived from a SITE_URL constant + route.path,
 * not from window.location, so no window stub is needed.
 */

import { describe, it, expect } from 'vitest'
import seo, { getRouteMeta, getStructuredData, getSitemapRoutes } from '../seo.js'

// ---------------------------------------------------------------------------
// Expected constants — mirror the values defined in seo.js so that tests
// document expected behavior independently of the module internals.
// ---------------------------------------------------------------------------
const SITE_URL = 'https://jasonhou007.github.io/KTechAICyberWeb'
const LOCALE = 'zh_CN'
const SITE_NAME = 'KTech'

// Helper: build a minimal but realistic Vue Router route object
const makeRoute = (path: string) => ({ path })

// ---------------------------------------------------------------------------
// Module shape
// ---------------------------------------------------------------------------
describe('seo.js module', () => {
  it('exports the three primary functions as named exports', () => {
    expect(typeof getRouteMeta).toBe('function')
    expect(typeof getStructuredData).toBe('function')
    expect(typeof getSitemapRoutes).toBe('function')
  })

  it('provides a default export with the functions and site constants', () => {
    expect(seo).toBeDefined()
    expect(typeof seo.getRouteMeta).toBe('function')
    expect(typeof seo.getStructuredData).toBe('function')
    expect(typeof seo.getSitemapRoutes).toBe('function')
    expect(seo.SITE_URL).toBe(SITE_URL)
    expect(seo.SITE_NAME).toBe(SITE_NAME)
    expect(typeof seo.DEFAULT_DESCRIPTION).toBe('string')
    expect(seo.DEFAULT_DESCRIPTION.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// getRouteMeta(route)
// ---------------------------------------------------------------------------
describe('getRouteMeta(route)', () => {
  describe('home route ("/")', () => {
    const meta = getRouteMeta(makeRoute('/'))

    it('returns a site-default title containing the brand', () => {
      expect(meta.title).toBe('KTech | 金融科技创新')
    })

    it('returns a non-empty route-specific description', () => {
      expect(typeof meta.description).toBe('string')
      expect(meta.description.length).toBeGreaterThan(0)
      expect(meta.description).toContain('开泰')
    })

    it('sets og:type to "website"', () => {
      expect(meta.ogType).toBe('website')
    })

    it('sets og:locale to the configured locale', () => {
      expect(meta.ogLocale).toBe(LOCALE)
    })

    it('sets og:site_name to the brand', () => {
      expect(meta.ogSiteName).toBe(SITE_NAME)
    })

    it('sets an absolute canonical URL for the route', () => {
      expect(meta.canonical).toBe(`${SITE_URL}/`)
      expect(meta.canonical).toMatch(/^https:\/\//)
    })

    it('sets og:url equal to the canonical URL', () => {
      expect(meta.ogUrl).toBe(`${SITE_URL}/`)
      expect(meta.ogUrl).toBe(meta.canonical)
    })

    it('sets a summary_large_image twitter card', () => {
      expect(meta.twitterCard).toBe('summary_large_image')
    })

    it('exposes a twitter:site handle', () => {
      expect(meta.twitterSite).toBe('@ktech_fintech')
    })

    it('provides non-empty og:image and twitter:image for known routes', () => {
      expect(meta.ogImage).toBe(`${SITE_URL}/og-image-home.jpg`)
      expect(meta.twitterImage).toBe(`${SITE_URL}/twitter-image-home.jpg`)
    })

    it('includes non-empty keywords', () => {
      expect(typeof meta.keywords).toBe('string')
      expect(meta.keywords.length).toBeGreaterThan(0)
    })
  })

  describe('/about route', () => {
    const meta = getRouteMeta(makeRoute('/about'))

    it('returns an about-specific title distinct from home', () => {
      expect(meta.title).toBe('关于我们 - KTech')
      expect(meta.title).not.toBe('KTech | 金融科技创新')
    })

    it('returns an about-specific description distinct from home', () => {
      expect(meta.description).toContain('愿景')
    })

    it('sets an absolute canonical URL for /about', () => {
      expect(meta.canonical).toBe(`${SITE_URL}/about`)
      expect(meta.ogUrl).toBe(meta.canonical)
    })

    it('sets about-specific og:image / twitter:image', () => {
      expect(meta.ogImage).toBe(`${SITE_URL}/og-image-about.jpg`)
      expect(meta.twitterImage).toBe(`${SITE_URL}/twitter-image-about.jpg`)
    })
  })

  describe('/news route', () => {
    const meta = getRouteMeta(makeRoute('/news'))

    it('returns a news-specific title distinct from home and about', () => {
      expect(meta.title).toBe('News & Updates - KTech')
      expect(meta.title).not.toContain('关于')
    })

    it('returns a news-specific description in English', () => {
      expect(meta.description).toContain('news')
    })

    it('sets an absolute canonical URL for /news', () => {
      expect(meta.canonical).toBe(`${SITE_URL}/news`)
      expect(meta.ogUrl).toBe(meta.canonical)
    })

    it('sets news-specific og:image / twitter:image', () => {
      expect(meta.ogImage).toBe(`${SITE_URL}/og-image-news.jpg`)
      expect(meta.twitterImage).toBe(`${SITE_URL}/twitter-image-news.jpg`)
    })
  })

  describe('/news/:slug (news detail) route', () => {
    // seo.js does not carry a specific entry for dynamic news detail paths,
    // so the function must still return sensible fallback meta without crashing.
    const meta = getRouteMeta(makeRoute('/news/some-article'))

    it('does not crash and returns an object', () => {
      expect(meta).toBeInstanceOf(Object)
    })

    it('falls back to a non-empty brand title', () => {
      expect(typeof meta.title).toBe('string')
      expect(meta.title.length).toBeGreaterThan(0)
    })

    it('falls back to a non-empty description', () => {
      expect(typeof meta.description).toBe('string')
      expect(meta.description.length).toBeGreaterThan(0)
    })

    it('uses an absolute canonical URL that reflects the full path', () => {
      expect(meta.canonical).toBe(`${SITE_URL}/news/some-article`)
      expect(meta.canonical).toMatch(/^https:\/\//)
      expect(meta.ogUrl).toBe(meta.canonical)
    })

    it('still provides a valid og:type and twitter:card', () => {
      expect(meta.ogType).toBe('website')
      expect(meta.twitterCard).toBe('summary_large_image')
    })
  })

  describe('unknown / 404 route fallback', () => {
    const meta = getRouteMeta(makeRoute('/this-route-does-not-exist'))

    it('returns sensible fallback meta without crashing', () => {
      expect(meta).toBeInstanceOf(Object)
      expect(typeof meta.title).toBe('string')
      expect(meta.title.length).toBeGreaterThan(0)
    })

    it('falls back to the default brand title', () => {
      expect(meta.title).toBe(SITE_NAME)
    })

    it('falls back to a non-empty default description', () => {
      expect(typeof meta.description).toBe('string')
      expect(meta.description.length).toBeGreaterThan(0)
    })

    it('still sets a valid absolute canonical URL', () => {
      expect(meta.canonical).toBe(`${SITE_URL}/this-route-does-not-exist`)
      expect(meta.canonical).toMatch(/^https:\/\//)
    })

    it('still provides default og:image / twitter:image', () => {
      expect(meta.ogImage).toBe(`${SITE_URL}/og-image-default.jpg`)
      expect(meta.twitterImage).toBe(`${SITE_URL}/og-image-default.jpg`)
    })

    it('still returns og:type and twitter:card', () => {
      expect(meta.ogType).toBe('website')
      expect(meta.twitterCard).toBe('summary_large_image')
    })
  })

  describe('canonical URL is always absolute', () => {
    it('is absolute for every primary route', () => {
      const paths = ['/', '/about', '/news', '/nonexistent']
      paths.forEach((p) => {
        const meta = getRouteMeta(makeRoute(p))
        expect(meta.canonical).toMatch(/^https:\/\/[^/]+\//)
        expect(meta.canonical.endsWith(p)).toBe(true)
      })
    })
  })
})

// ---------------------------------------------------------------------------
// getStructuredData(route)
// ---------------------------------------------------------------------------
describe('getStructuredData(route)', () => {
  describe('return shape', () => {
    const data = getStructuredData(makeRoute('/'))

    it('returns an array', () => {
      expect(Array.isArray(data)).toBe(true)
    })

    it('returns a non-empty array', () => {
      expect(data.length).toBeGreaterThan(0)
    })

    it('every entry is a valid JSON-LD object with @context and @type', () => {
      data.forEach((entry) => {
        expect(entry).toBeInstanceOf(Object)
        expect(entry['@context']).toBe('https://schema.org')
        expect(typeof entry['@type']).toBe('string')
        expect((entry['@type'] as string).length).toBeGreaterThan(0)
      })
    })
  })

  describe('home route ("/") schema', () => {
    const data = getStructuredData(makeRoute('/'))
    const types = data.map((e) => e['@type'])

    it('includes an Organization schema', () => {
      expect(types).toContain('Organization')
    })

    it('includes a WebSite schema', () => {
      expect(types).toContain('WebSite')
    })

    it('includes a WebPage schema', () => {
      expect(types).toContain('WebPage')
    })

    it('includes a BreadcrumbList schema', () => {
      expect(types).toContain('BreadcrumbList')
    })

    it('Organization schema points at the site URL and carries a logo', () => {
      const org = data.find((e) => e['@type'] === 'Organization') as Record<string, unknown>
      expect(org.url).toBe(SITE_URL)
      expect(typeof org.logo).toBe('string')
      expect(String(org.logo)).toMatch(/^https:\/\//)
    })
  })

  describe('route-specific schema', () => {
    it('WebPage schema name/description reflect the route meta for /about', () => {
      const data = getStructuredData(makeRoute('/about'))
      const webpage = data.find((e) => e['@type'] === 'WebPage') as Record<string, unknown>
      expect(webpage.name).toContain('关于')
    })

    it('WebPage schema url reflects the requested path', () => {
      const data = getStructuredData(makeRoute('/about'))
      const webpage = data.find((e) => e['@type'] === 'WebPage') as Record<string, unknown>
      expect(webpage.url).toBe(`${SITE_URL}/about`)
    })

    it('BreadcrumbList grows for sub-pages (not home)', () => {
      const homeBc = getStructuredData(makeRoute('/')).find(
        (e) => e['@type'] === 'BreadcrumbList'
      ) as Record<string, { itemListElement: unknown[] }>
      const aboutBc = getStructuredData(makeRoute('/about')).find(
        (e) => e['@type'] === 'BreadcrumbList'
      ) as Record<string, { itemListElement: unknown[] }>
      expect(homeBc.itemListElement.length).toBe(1)
      expect(aboutBc.itemListElement.length).toBeGreaterThan(1)
    })
  })

  describe('serializability', () => {
    it('every entry is JSON.stringify-safe (does not throw)', () => {
      const data = getStructuredData(makeRoute('/'))
      expect(() => {
        data.forEach((entry) => JSON.stringify(entry))
      }).not.toThrow()
    })

    it('the whole array round-trips through JSON.parse(JSON.stringify(...))', () => {
      const data = getStructuredData(makeRoute('/news'))
      const roundTripped = JSON.parse(JSON.stringify(data))
      expect(roundTripped).toHaveLength(data.length)
    })
  })
})

// ---------------------------------------------------------------------------
// getSitemapRoutes()
// ---------------------------------------------------------------------------
describe('getSitemapRoutes()', () => {
  const routes = getSitemapRoutes()

  it('returns an array', () => {
    expect(Array.isArray(routes)).toBe(true)
  })

  it('returns a non-empty array', () => {
    expect(routes.length).toBeGreaterThan(0)
  })

  it('every entry has the expected shape (path string + sitemap fields)', () => {
    routes.forEach((entry) => {
      expect(typeof entry.path).toBe('string')
      expect(entry.path.length).toBeGreaterThan(0)
      expect(entry.path.startsWith('/')).toBe(true)
      expect(entry).toHaveProperty('changefreq')
      expect(entry).toHaveProperty('priority')
    })
  })

  it('covers the home route', () => {
    expect(routes.map((r) => r.path)).toContain('/')
  })

  it('covers the about route', () => {
    expect(routes.map((r) => r.path)).toContain('/about')
  })

  it('covers the news route', () => {
    expect(routes.map((r) => r.path)).toContain('/news')
  })

  it('assigns numeric priorities between 0 and 1', () => {
    routes.forEach((entry) => {
      expect(typeof entry.priority).toBe('number')
      expect(entry.priority).toBeGreaterThanOrEqual(0)
      expect(entry.priority).toBeLessThanOrEqual(1)
    })
  })

  it('home has the highest priority', () => {
    const home = routes.find((r) => r.path === '/')
    expect(home).toBeDefined()
    routes.forEach((entry) => {
      expect((home as { priority: number }).priority).toBeGreaterThanOrEqual(entry.priority)
    })
  })
})

// ---------------------------------------------------------------------------
// Edge cases & robustness
// ---------------------------------------------------------------------------
describe('Edge cases and robustness', () => {
  describe('missing / empty route params', () => {
    it('getRouteMeta defaults a missing path to "/"', () => {
      const meta = getRouteMeta({} as { path: string })
      expect(meta.canonical).toBe(`${SITE_URL}/`)
    })

    it('getRouteMeta handles an empty-string path', () => {
      const meta = getRouteMeta(makeRoute(''))
      expect(meta.canonical).toBe(`${SITE_URL}/`)
      expect(typeof meta.title).toBe('string')
    })

    it('getStructuredData handles a missing path without throwing', () => {
      expect(() => getStructuredData({} as { path: string })).not.toThrow()
      const data = getStructuredData({} as { path: string })
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    it('getRouteMeta handles a news-detail route without crashing even with no params', () => {
      const meta = getRouteMeta(makeRoute('/news/'))
      expect(meta).toBeInstanceOf(Object)
      expect(meta.canonical).toBe(`${SITE_URL}/news/`)
    })
  })

  describe('purity (no input mutation)', () => {
    it('getRouteMeta does not mutate the input route object', () => {
      const route = makeRoute('/about')
      const snapshot = { ...route }
      getRouteMeta(route)
      expect(route).toEqual(snapshot)
    })

    it('getStructuredData does not mutate the input route object', () => {
      const route = makeRoute('/news/some-article')
      const snapshot = { ...route }
      getStructuredData(route)
      expect(route).toEqual(snapshot)
    })
  })

  describe('determinism (same input -> same output)', () => {
    it('getRouteMeta is deterministic across repeated calls', () => {
      const a = getRouteMeta(makeRoute('/about'))
      const b = getRouteMeta(makeRoute('/about'))
      expect(a).toEqual(b)
    })

    it('getStructuredData is deterministic across repeated calls', () => {
      const a = getStructuredData(makeRoute('/news'))
      const b = getStructuredData(makeRoute('/news'))
      expect(a).toEqual(b)
    })

    it('getSitemapRoutes is deterministic across repeated calls', () => {
      const a = getSitemapRoutes()
      const b = getSitemapRoutes()
      expect(a).toEqual(b)
    })

    it('output contains no Date/random-derived values (string fields are stable)', () => {
      // Determinism guard: the produced meta for a fixed route must be a deep
      // equal match regardless of timing, which holds only if no time/random
      // values leak into the output.
      const meta = getRouteMeta(makeRoute('/about'))
      const serialized = JSON.stringify(meta)
      // Re-running moments later must yield the identical serialized form.
      expect(JSON.stringify(getRouteMeta(makeRoute('/about')))).toBe(serialized)
    })
  })
})
