/**
 * SEO Utilities
 * Provides SEO configuration for different pages and routes
 */

const SITE_URL = 'https://jasonhou007.github.io/KTechAICyberWeb'
const SITE_NAME = '开泰科技 - KBight Fintech'
const DEFAULT_DESCRIPTION = '开泰远景信息科技有限公司 - 专注于金融科技创新，提供项目管理、零售信贷、供应链金融、区块链技术等解决方案。'
const DEFAULT_KEYWORDS = '开泰科技,KBight,金融科技,区块链,供应链金融,零售信贷,开泰远景,深圳金融科技,跨境电商,项目管理'
const LOCALE = 'zh_CN'

/**
 * Get SEO meta configuration for a specific route
 * @param {Object} route - Vue Router route object
 * @returns {Object} SEO meta configuration
 */
export function getRouteMeta(route) {
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

  // Route-specific meta
  const routeMeta = {
    '/': {
      title: `开泰科技 - KBight Fintech | 金融科技创新`,
      description: '开泰远景信息科技有限公司于2020年6月由泰国开泰银行通过其全资子公司开泰远景有限公司（注册于泰国）在深圳市罗湖区设立，注册资本3亿元人民币，是深圳市第一批跨国公司总部企业。',
      ogImage: `${SITE_URL}/og-image-home.jpg`,
      twitterImage: `${SITE_URL}/twitter-image-home.jpg`
    },
    '/about': {
      title: '关于我们 - 开泰科技 | KBight Fintech',
      description: '了解开泰远景信息科技有限公司的愿景、使命和文化。我们致力于成为区域领先的金融科技平台。',
      ogImage: `${SITE_URL}/og-image-about.jpg`,
      twitterImage: `${SITE_URL}/twitter-image-about.jpg`
    },
    '/news': {
      title: 'News & Updates - KTech | KBight Fintech',
      description: 'Stay updated with the latest news, insights, and updates from KTech. Company announcements, industry insights, technology updates, and events.',
      ogImage: `${SITE_URL}/og-image-news.jpg`,
      twitterImage: `${SITE_URL}/twitter-image-news.jpg`
    },
    '/privacy': {
      title: 'Privacy Policy - KTech | KBight Fintech',
      description: 'KTech Privacy Policy. Learn how we collect, use, and protect your personal data in compliance with GDPR and CCPA, including your data protection rights.',
      ogImage: `${SITE_URL}/og-image-privacy.jpg`,
      twitterImage: `${SITE_URL}/twitter-image-privacy.jpg`
    },
    '/terms': {
      title: 'Terms of Service - KTech | KBight Fintech',
      description: 'KTech Terms of Service. Read the terms and conditions governing your use of our financial technology platform, including user responsibilities, liability, and dispute resolution.',
      ogImage: `${SITE_URL}/og-image-terms.jpg`,
      twitterImage: `${SITE_URL}/twitter-image-terms.jpg`
    }
  }

  const specific = routeMeta[path] || {}

  return {
    ...baseMeta,
    ...specific,
    // Use specific if available, otherwise fallback to base
    title: specific.title || baseMeta.title,
    description: specific.description || baseMeta.description,
    ogImage: specific.ogImage || `${SITE_URL}/og-image-default.jpg`,
    twitterImage: specific.twitterImage || specific.ogImage || `${SITE_URL}/og-image-default.jpg`
  }
}

/**
 * Get JSON-LD structured data for a page
 * @param {Object} route - Vue Router route object
 * @returns {Array} Array of structured data objects
 */
export function getStructuredData(route) {
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
    name: getRouteMeta(route).title,
    description: getRouteMeta(route).description,
    inLanguage: 'zh-CN',
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
