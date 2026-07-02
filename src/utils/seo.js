/**
 * SEO Utilities
 * Provides SEO configuration for different pages and routes
 */

const SITE_URL = 'https://jasonhou007.github.io/KTechAICyberWeb'
const SITE_NAME = 'KTech'
const DEFAULT_DESCRIPTION = '开泰远景信息科技有限公司 - 专注于金融科技创新，提供项目管理、零售信贷、供应链金融、区块链技术等解决方案。'
const DEFAULT_KEYWORDS = '开泰远景信息科技,KTech,金融科技,区块链,供应链金融,零售信贷,开泰远景,深圳金融科技,跨境电商,项目管理'
// #239: site default language is English. og:locale must reflect the active
// language (App.vue overrides this per-route via the computed ogLocale from
// useLanguage), but the no-JS floor and any path that doesn't pass a `t`
// resolver should still default to en_US rather than the pre-#239 zh_CN.
const LOCALE = 'en_US'

// Brand suffix appended to composed document titles (separator ' - ').
// EN brand is "KTech"; ZH brand is "开泰远景". Picked at compose-time from the
// language the active t() resolves in (see resolveTitle below).
const BRAND = { en: 'KTech', zh: '开泰远景' }

/**
 * Map of route path -> i18n titleKey. getRouteMeta composes
 *   t(titleKey) + ' - ' + BRAND[lang]
 * for every route, EXCEPT home which carries the full brand in its value
 * (home.docTitle already reads "KTech - Fintech Innovation" / "开泰远景 - 金融科技创新"
 * so no suffix is appended — otherwise the brand would appear twice).
 *
 * Service routes have INCONSISTENT locale shapes — 6 are objects with a
 * `.title` sub-key; `services.projectManagement` is a LEAF STRING. The
 * `/services/blockchain` route maps to the top-level `blockchain.docTitle`
 * key added in #260 (the services.* namespace has no blockchain entry). The
 * keys below were verified against src/locales/{en,zh}.json.
 *
 * Dynamic / special routes (handled in getRouteMeta, not listed here):
 *   - /news/:slug  -> reuses /news title (news.docTitle)
 *   - /:pathMatch  -> notFound.docTitle (the 404 catch-all)
 *   - /privacy, /terms -> keep their hardcoded "Privacy Policy - KTech" /
 *     "Terms of Service - KTech" fallbacks (no docTitle key — out of #260 scope)
 */
const ROUTE_TITLE_KEYS = {
  '/': { key: 'home.docTitle', full: true },
  '/about': { key: 'about.docTitle' },
  '/news': { key: 'news.docTitle' },
  '/services/supply-chain-finance': { key: 'services.supplyChainFinance.title' },
  '/services/project-and-program-management': { key: 'services.projectManagement' },
  '/services/blockchain': { key: 'blockchain.docTitle' },
  '/services/big-data-ai': { key: 'services.bigDataAI.title' },
  '/services/retail-lending': { key: 'services.retailLending.title' },
  '/services/cross-border-payment': { key: 'services.crossBorderPayment.title' },
  '/services/digital-asset-custody': { key: 'services.digitalAssetCustody.title' },
  '/services/stablecoin': { key: 'services.stablecoin.title' },
  '/join-us': { key: 'joinUs.docTitle' },
  '/contact': { key: 'contact.docTitle' },
  '/careers': { key: 'positions.docTitle' },
  '/pulse': { key: 'pulse.docTitle' }
}

// Map a concrete route path to its titleKey entry, handling the dynamic /
// special routes that aren't in ROUTE_TITLE_KEYS:
//   - /news/<slug>           -> news.docTitle (same as /news)
//   - any unmatched path     -> notFound.docTitle (the 404 catch-all)
function entryForPath(path) {
  if (ROUTE_TITLE_KEYS[path]) return ROUTE_TITLE_KEYS[path]
  if (path === '/news' || path.startsWith('/news/')) {
    return { key: 'news.docTitle' }
  }
  // Unknown path -> NotFound catch-all. (Known static routes that intentionally
  // have no docTitle — /privacy, /terms — are NOT in ROUTE_TITLE_KEYS and are
  // handled by the caller's hardcoded fallback, so they must NOT fall into the
  // NotFound branch. Whitelist the known no-docTitle routes here.)
  if (path === '/privacy' || path === '/terms') return null
  return { key: 'notFound.docTitle' }
}

// Compose the per-route title. When `t` is provided (the real useLanguage
// translator, or a test double), resolve the titleKey's value; if the key
// returned is the raw dotted string (missing key → t() returns the key), treat
// it as unresolved and fall back. Brand suffix: ' - KTech' (en) / ' - 开泰远景'
// (zh), except for the home route whose value already embeds the brand.
function resolveTitle(path, t) {
  if (typeof t !== 'function') return undefined
  const entry = entryForPath(path)
  if (!entry) return undefined
  const raw = t(entry.key)
  // useLanguage.t() returns the literal key when the key is missing. Guard
  // against surfacing a raw dotted string as the <title>.
  if (!raw || typeof raw !== 'string' || raw === entry.key) return undefined
  if (entry.full) return raw // home: brand already in value
  // Detect language from the resolved string: if it contains CJK, use the ZH
  // brand suffix; otherwise EN. This avoids threading a separate lang arg and
  // matches how useLanguage.t() already returns the active-locale string.
  const brand = /[一-鿿]/.test(raw) ? BRAND.zh : BRAND.en
  return `${raw} - ${brand}`
}

/**
 * Get SEO meta configuration for a specific route
 * @param {Object} route - Vue Router route object
 * @param {Function} [t] - optional i18n translator (useLanguage.t). When
 *   provided, the title is resolved from the active locale's docTitle / service
 *   title keys (so document.title matches the user's language and the route).
 *   When omitted, the hardcoded fallback strings below are used (keeps existing
 *   seo.test.ts assertions green).
 * @returns {Object} SEO meta configuration
 */
export function getRouteMeta(route, t) {
  const path = route.path || '/'
  const fullUrl = `${SITE_URL}${path}`

  const baseMeta = {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    ogLocale: LOCALE,
    ogType: 'website',
    ogSiteName: SITE_NAME,
    ogUrl: fullUrl,
    canonical: fullUrl,
    twitterCard: 'summary_large_image',
    twitterSite: '@ktech_fintech'
  }

  // Route-specific meta (descriptions + OG images). Titles are resolved from
  // the i18n docTitle keys when `t` is provided; the hardcoded `title` fields
  // below are the no-`t` fallbacks.
  const routeMeta = {
    '/': {
      title: `KTech | 金融科技创新`,
      description: '开泰远景信息科技有限公司于2020年6月由泰国开泰银行通过其全资子公司开泰远景有限公司（注册于泰国）在深圳市罗湖区设立，注册资本3亿元人民币，是深圳市第一批跨国公司总部企业。',
      ogImage: `${SITE_URL}/og-image-home.jpg`,
      twitterImage: `${SITE_URL}/twitter-image-home.jpg`
    },
    '/about': {
      title: '关于我们 - KTech',
      description: '了解开泰远景信息科技有限公司的愿景、使命和文化。我们致力于成为区域领先的金融科技平台。',
      ogImage: `${SITE_URL}/og-image-about.jpg`,
      twitterImage: `${SITE_URL}/twitter-image-about.jpg`
    },
    '/news': {
      title: 'News & Updates - KTech',
      description: 'Stay updated with the latest news, insights, and updates from KTech. Company announcements, industry insights, technology updates, and events.',
      ogImage: `${SITE_URL}/og-image-news.jpg`,
      twitterImage: `${SITE_URL}/twitter-image-news.jpg`
    },
    '/privacy': {
      title: 'Privacy Policy - KTech',
      description: 'KTech Privacy Policy. Learn how we collect, use, and protect your personal data in compliance with GDPR and CCPA, including your data protection rights.',
      ogImage: `${SITE_URL}/og-image-privacy.jpg`,
      twitterImage: `${SITE_URL}/twitter-image-privacy.jpg`
    },
    '/terms': {
      title: 'Terms of Service - KTech',
      description: 'KTech Terms of Service. Read the terms and conditions governing your use of our financial technology platform, including user responsibilities, liability, and dispute resolution.',
      ogImage: `${SITE_URL}/og-image-terms.jpg`,
      twitterImage: `${SITE_URL}/twitter-image-terms.jpg`
    }
  }

  const specific = routeMeta[path] || {}

  // Title resolution order:
  //  1. i18n-resolved title (when `t` is provided and the key resolves)
  //  2. hardcoded routeMeta title (the legacy fallback)
  //  3. base brand title
  const i18nTitle = resolveTitle(path, t)
  const title = i18nTitle || specific.title || baseMeta.title

  return {
    ...baseMeta,
    ...specific,
    // Use specific if available, otherwise fallback to base
    title,
    description: specific.description || baseMeta.description,
    ogImage: specific.ogImage || `${SITE_URL}/og-image-default.jpg`,
    twitterImage: specific.twitterImage || specific.ogImage || `${SITE_URL}/og-image-default.jpg`
  }
}

/**
 * Get JSON-LD structured data for a page
 * @param {Object} route - Vue Router route object
 * @param {Function} [t] - optional i18n translator (useLanguage.t). When
 *   provided, the WebPage.name resolves to the localized per-route title (the
 *   same docTitle / service-title key document.title uses, so JSON-LD and the
 *   <title> tag agree). When omitted, the legacy hardcoded name is used.
 * @param {string} [locale] - optional 'en' | 'zh'. When provided, inLanguage
 *   reflects the active locale in BCP-47 hyphen form ('en-US' / 'zh-CN'). When
 *   omitted, defaults to 'zh-CN' (the pre-#300 behavior, kept for backward
 *   compat with no-`t` callers).
 * @returns {Array} Array of structured data objects
 */
export function getStructuredData(route, t, locale) {
  const path = route.path || '/'
  const fullUrl = `${SITE_URL}${path}`

  // Organization Schema (always present)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '开泰远景信息科技有限公司',
    alternateName: 'KTech Fintech',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    foundingDate: '2020-06',
    address: {
      '@type': 'PostalAddress',
      addressLocality: '深圳市',
      addressRegion: '广东省',
      addressCountry: 'CN'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'KTECH@kaitaitech.cn'
    },
    sameAs: [
      'https://github.com/jasonhou007/KTechAICyberWeb'
    ]
  }

  // Website Schema (always present)
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  // Breadcrumb Schema (for sub-pages)
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: SITE_URL
      }
    ]
  }

  // Add breadcrumb items based on path
  if (path !== '/') {
    const segments = path.split('/').filter(Boolean)
    segments.forEach((segment, index) => {
      breadcrumbSchema.itemListElement.push({
        '@type': 'ListItem',
        position: index + 2,
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        item: `${SITE_URL}/${segment}`
      })
    })
  }

  // WebPage Schema (for current page)
  const webpageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: fullUrl,
    name: getRouteMeta(route, t).title,
    description: getRouteMeta(route).description,
    inLanguage: locale === 'en' ? 'en-US' : 'zh-CN',
    about: {
      '@type': 'Thing',
      name: '金融科技',
      description: '金融科技创新解决方案'
    }
  }

  // Corporate Contact Schema
  const corporateContactSchema = {
    '@context': 'https://schema.org',
    '@type': 'Corporation',
    name: '开泰远景信息科技有限公司',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '深圳市梅苑路75号润弘大厦T2座12楼',
      addressLocality: '深圳市',
      addressRegion: '广东省',
      addressCountry: 'CN'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+86-755-36878020',
      contactType: 'Customer Service',
      email: 'KTECH@kaitaitech.cn',
      areaServed: 'CN',
      availableLanguage: ['zh', 'en']
    }
  }

  return [
    organizationSchema,
    websiteSchema,
    breadcrumbSchema,
    webpageSchema,
    corporateContactSchema
  ]
}

/**
 * Get all routes for sitemap generation
 * @returns {Array} Array of route objects
 */
export function getSitemapRoutes() {
  return [
    {
      path: '/',
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      path: '/about',
      changefreq: 'monthly',
      priority: 0.8
    },
    {
      path: '/news',
      changefreq: 'daily',
      priority: 0.9
    },
    {
      path: '/privacy',
      changefreq: 'yearly',
      priority: 0.5
    }
  ]
}

export default {
  getRouteMeta,
  getStructuredData,
  getSitemapRoutes,
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION
}
