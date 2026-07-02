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
// #260: load the real locale trees so the per-route titles describe block can
// build a true `t` (resolves dotted keys, returns the key on miss — mirroring
// useLanguage.t's contract). Vite resolves JSON imports natively.
import enLocale from '../../locales/en.json'
import zhLocale from '../../locales/zh.json'

// ---------------------------------------------------------------------------
// Expected constants — mirror the values defined in seo.js so that tests
// document expected behavior independently of the module internals.
// ---------------------------------------------------------------------------
const SITE_URL = 'https://jasonhou007.github.io/KTechAICyberWeb'
// #260 / #239: site default language is English, so the no-JS og:locale floor
// and getRouteMeta's no-`t` fallback locale are now en_US (was zh_CN before
// the default-language flip in #239).
const LOCALE = 'en_US'
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

  // -------------------------------------------------------------------------
  // #301 — /privacy and /terms og:image + twitter:image contract hardening.
  // seo.js emits per-route og/twitter URLs for these two routes (lines 145-156)
  // but the test suite never asserted them before #301. This is a hardening
  // block (not a RED): the implementation already satisfies it. The shape
  // mirrors the existing /about (lines 141-144) and /news (lines 164-167)
  // assertions.
  // -------------------------------------------------------------------------
  describe.each([
    { path: '/privacy', slug: 'privacy' },
    { path: '/terms', slug: 'terms' },
  ])('$path route og/twitter image contract (AC #301)', ({ path, slug }) => {
    const meta = getRouteMeta(makeRoute(path))

    it('emits a route-specific og:image', () => {
      expect(meta.ogImage).toBe(`${SITE_URL}/og-image-${slug}.jpg`)
    })

    it('emits a route-specific twitter:image', () => {
      expect(meta.twitterImage).toBe(`${SITE_URL}/twitter-image-${slug}.jpg`)
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

  // -------------------------------------------------------------------------
  // #260 — per-route document titles resolved via the i18n `t` translator.
  // The no-`t` calls above exercise the hardcoded fallbacks; these exercise the
  // LIVE path App.vue uses (getRouteMeta(route, t)). Each titleKey MUST resolve
  // to a real value (not a raw dotted key) and compose "name - KTech" (home
  // carries the brand in-value, so no suffix). A missing/unresolved key would
  // surface the raw "x.y.z" string as <title> — the assertion catches that.
  // -------------------------------------------------------------------------
  describe('per-route titles (AC #260)', () => {
    // Build a real `t` over en.json: resolves dotted keys, returns the key
    // itself when missing (mirrors useLanguage.t's missing-key contract).
    const en: Record<string, unknown> = enLocale as unknown as Record<string, unknown>
    const tEn = (key: string): string => {
      const val = key.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), en)
      return val == null ? key : String(val)
    }

    const cases: Array<{ path: string; expected: string; note?: string }> = [
      { path: '/', expected: 'KTech - Fintech Innovation' },
      { path: '/about', expected: 'About - KTech' },
      { path: '/news', expected: 'News & Updates - KTech' },
      { path: '/news/some-article', expected: 'News & Updates - KTech', note: 'news detail reuses /news title' },
      { path: '/services/supply-chain-finance', expected: 'Supply Chain Finance Solution - KTech' },
      { path: '/services/project-and-program-management', expected: 'Project Management - KTech', note: 'leaf-string key services.projectManagement' },
      { path: '/services/blockchain', expected: 'Blockchain Solutions - KTech', note: 'top-level blockchain.docTitle' },
      { path: '/services/big-data-ai', expected: 'Big Data & AI Solutions - KTech' },
      { path: '/services/retail-lending', expected: 'Retail Lending Solution - KTech' },
      { path: '/services/cross-border-payment', expected: 'Cross-Border Payment Solution - KTech' },
      { path: '/services/digital-asset-custody', expected: 'Digital Asset Custody Solution - KTech' },
      { path: '/services/stablecoin', expected: 'Stablecoin Solution - KTech' },
      { path: '/join-us', expected: 'Join Us - KTech' },
      { path: '/contact', expected: 'Contact - KTech' },
      { path: '/careers', expected: 'Careers - KTech' },
      { path: '/pulse', expected: 'Neon Pulse - KTech' },
      { path: '/this-route-does-not-exist', expected: 'Page Not Found - KTech', note: 'catch-all -> notFound.docTitle' },
    ]

    it.each(cases)(
      'resolves a real (non-raw-key) title for $path',
      ({ path, expected }) => {
        const meta = getRouteMeta(makeRoute(path), tEn as unknown as (k: string) => string)
        expect(meta.title).toBe(expected)
        // The title must NOT be a raw dotted key (the missing-key failure mode).
        expect(meta.title).not.toMatch(/^[a-z]+\.[a-zA-Z.]+$/)
      },
    )

    it('does NOT append the brand suffix for the home route (brand is in-value)', () => {
      const meta = getRouteMeta(makeRoute('/'), tEn as unknown as (k: string) => string)
      // home.docTitle is "KTech - Fintech Innovation" — not "KTech - Fintech Innovation - KTech".
      expect(meta.title.endsWith(' - KTech')).toBe(false)
    })

    it('composes the ZH brand suffix when the resolved value contains CJK', () => {
      // Build a zh translator and confirm the suffix brand flips to 开泰远景.
      const zh: Record<string, unknown> = zhLocale as unknown as Record<string, unknown>
      const tZh = (key: string): string => {
        const val = key.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), zh)
        return val == null ? key : String(val)
      }
      const meta = getRouteMeta(makeRoute('/about'), tZh as unknown as (k: string) => string)
      expect(meta.title).toBe('关于我们 - 开泰远景')
    })

    it('falls back to the hardcoded title when t is omitted (legacy contract)', () => {
      // The no-`t` path must keep returning the pre-#260 hardcoded strings so
      // existing assertions stay green.
      expect(getRouteMeta(makeRoute('/')).title).toBe('KTech | 金融科技创新')
      expect(getRouteMeta(makeRoute('/about')).title).toBe('关于我们 - KTech')
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
// getStructuredData(route, t, locale) — JSON-LD locale consistency (AC #300)
//
// #260 follow-up: the JSON-LD WebPage schema must agree with document.title
// (resolved from the same per-route i18n titleKey) and with the ACTIVE locale
// (BCP-47 hyphen form, distinct from og:locale's underscore form). The legacy
// no-arg contract (hardcoded name + zh-CN inLanguage) stays intact for backward
// compat. tEn/tZh mirror useLanguage.t — dotted-key lookup, returns the key on
// miss.
// ---------------------------------------------------------------------------
describe('getStructuredData(route, t, locale) — JSON-LD locale consistency (AC #300)', () => {
  const en: Record<string, unknown> = enLocale as unknown as Record<string, unknown>
  const tEn = (key: string): string => {
    const val = key.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), en)
    return val == null ? key : String(val)
  }
  const zh: Record<string, unknown> = zhLocale as unknown as Record<string, unknown>
  const tZh = (key: string): string => {
    const val = key.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), zh)
    return val == null ? key : String(val)
  }

  const findWebPage = (data: ReturnType<typeof getStructuredData>) =>
    data.find((e) => e['@type'] === 'WebPage') as Record<string, unknown>

  it('WebPage.name resolves to the localized en title when t is provided (AC #300)', () => {
    const webpage = findWebPage(getStructuredData(makeRoute('/about'), tEn as unknown as (k: string) => string, 'en'))
    expect(webpage.name).toBe('About - KTech')
  })

  it('WebPage.name resolves to the localized zh title when t is provided (AC #300)', () => {
    const webpage = findWebPage(getStructuredData(makeRoute('/about'), tZh as unknown as (k: string) => string, 'zh'))
    expect(webpage.name).toBe('关于我们 - 开泰远景')
  })

  it('inLanguage reflects the active en locale in hyphen BCP-47 form (AC #300)', () => {
    const webpage = findWebPage(getStructuredData(makeRoute('/about'), tEn as unknown as (k: string) => string, 'en'))
    expect(webpage.inLanguage).toBe('en-US')
  })

  it('inLanguage reflects the active zh locale in hyphen BCP-47 form (AC #300)', () => {
    const webpage = findWebPage(getStructuredData(makeRoute('/about'), tZh as unknown as (k: string) => string, 'zh'))
    expect(webpage.inLanguage).toBe('zh-CN')
  })

  it('inLanguage uses hyphen form distinct from og:locale underscore form (AC #300)', () => {
    const webpage = findWebPage(getStructuredData(makeRoute('/about'), tEn as unknown as (k: string) => string, 'en'))
    expect(webpage.inLanguage).toBe('en-US')
    expect(webpage.inLanguage).not.toBe('en_US')
  })

  // AC3: WebPage.name and document.title share a single source of truth — the
  // per-route titleKey resolved via getRouteMeta(route, t). Both must equal the
  // expected localized title across Home, About, and a Service route in BOTH
  // locales.
  it.each([
    { path: '/', locale: 'en', t: 'tEn', expected: 'KTech - Fintech Innovation' },
    { path: '/', locale: 'zh', t: 'tZh', expected: '开泰远景 - 金融科技创新' },
    { path: '/about', locale: 'en', t: 'tEn', expected: 'About - KTech' },
    { path: '/about', locale: 'zh', t: 'tZh', expected: '关于我们 - 开泰远景' },
    { path: '/services/supply-chain-finance', locale: 'en', t: 'tEn', expected: 'Supply Chain Finance Solution - KTech' },
    { path: '/services/supply-chain-finance', locale: 'zh', t: 'tZh', expected: '供应链金融解决方案 - 开泰远景' },
  ])(
    'WebPage.name matches the route\'s document.title source for $path in $locale (AC #300)',
    ({ path, locale, t, expected }) => {
      const translator = (t === 'tZh' ? tZh : tEn) as unknown as (k: string) => string
      const route = makeRoute(path)
      const webpage = findWebPage(getStructuredData(route, translator, locale))
      // Single source of truth: WebPage.name === getRouteMeta(route, t).title
      expect(webpage.name).toBe(getRouteMeta(route, translator).title)
      expect(webpage.name).toBe(expected)
    },
  )

  it('falls back to the legacy hardcoded name + zh-CN inLanguage when t and locale are omitted (backward compat, AC #300)', () => {
    const webpage = findWebPage(getStructuredData(makeRoute('/about')))
    expect(webpage.name).toBe('关于我们 - KTech')
    expect(webpage.inLanguage).toBe('zh-CN')
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
