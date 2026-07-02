/**
 * @file NewsDetail.test.ts
 * @description Unit tests for the NewsDetail article view
 *
 * Test Categories:
 * - Rendering Tests: breadcrumb, loading skeleton, not-found and article states
 * - Content Tests: title, category label, author, date formatting, rendered
 *   markdown HTML (headings, lists, blockquote, link), figure/caption
 * - Accessibility Tests: role=main, aria-live not-found alert, aria-labels,
 *   heading hierarchy, itemprop microdata
 * - Behavior Tests (HEADLINE):
 *   * JSON-LD <script type="application/ld+json"> is appended to document.head
 *     after the article loads (watch(articleSchema, immediate:true))
 *   * the script is removed on unmount (onBeforeUnmount cleanup)
 *   * share button invokes navigator.share when available, falls back to
 *     clipboard + alert when not
 * - Edge Cases: missing-slug renders not-found; related-articles gating
 *
 * NewsDetail imports useLanguage from '../i18n' (a barrel re-exporting the
 * composable) and useRoute from 'vue-router'. Both are mocked. The article
 * loads after a 200ms setTimeout inside onMounted; tests use vi.useFakeTimers
 * to advance deterministically.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import NewsDetail from '../NewsDetail.vue'
import RouterLinkStub from '../../components/__tests__/RouterLinkStub.vue'

const mockTranslations: Record<string, string> = {
  'a11y.mainLabel': 'Article main content',
  'nav.home': 'Home',
  'news.title': 'News & Updates',
  'news.backToNews': 'Back to News',
  'news.publishedOn': 'Published on',
  'news.by': 'by',
  'news.share': 'Share article',
  'news.relatedArticles': 'Related Articles',
  'news.categories.company': 'Company News',
  'news.categories.industry': 'Industry Insights',
  'news.categories.technology': 'Technology Updates',
  'news.categories.events': 'Events',
  'news.articleAlts.iso27001': 'KTech ISO27001 information security certification announcement',
  'news.articleAlts.related': 'Related article image',
}

vi.mock('../../i18n', () => ({
  useLanguage: () => ({
    currentLanguage: { value: 'en' },
    languageDisplay: { value: 'EN' },
    isEnglish: { value: true },
    initLanguage: vi.fn(),
    setLanguage: vi.fn(),
    toggleLanguage: vi.fn(),
    t: (key: string) => mockTranslations[key] || key,
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
}))

// Realistic news dataset: two articles in the same category (so related-articles
// has something to render), plus the markdown features we assert against.
// JSON is imported as a default export, so the factory returns { default: [...] }.
// The path resolves relative to THIS test file (src/views/__tests__/) to
// src/data/news.json, matching what NewsDetail loads.
vi.mock('../../data/news.json', () => ({
  default: [
  {
    id: 1,
    slug: 'iso-cert',
    title: 'KTech Achieves ISO27001 Certification',
    excerpt: 'Information security milestone.',
    content: [
      '# ISO27001 Certification Achievement',
      '',
      'Intro paragraph about security.',
      '',
      '## What This Means',
      '',
      'Bullet list:',
      '',
      '- **Policy**: formalized policies',
      '- **Risk**: risk assessment',
      '',
      '### Sub-detail',
      '',
      'Nested content here.',
      '',
      '> Trust is earned.',
      '',
      '[Read more](https://example.com)',
    ].join('\n'),
    date: '2024-01-15',
    category: 'Company News',
    image: '/images/news/iso.webp',
    altKey: 'news.articleAlts.iso27001',
    author: 'KTech Team',
  },
  {
    id: 2,
    slug: 'second-cert',
    title: 'Second Company Milestone',
    excerpt: 'Another milestone.',
    content: '# Second Milestone\n\nBody text.',
    date: '2024-02-01',
    category: 'Company News',
    image: '/images/news/second.webp',
    altKey: 'news.articleAlts.related',
    author: 'KTech Team',
  },
  {
    id: 3,
    slug: 'third-cert',
    title: 'Third Company Milestone',
    excerpt: 'Third milestone.',
    content: '# Third Milestone\n\nBody text.',
    date: '2024-03-01',
    category: 'Company News',
    image: '/images/news/third.webp',
    altKey: 'news.articleAlts.related',
    author: 'KTech Team',
  },
  {
    id: 4,
    slug: 'industry-piece',
    title: 'Industry Insight Piece',
    excerpt: 'Different category.',
    content: '# Industry Insight\n\nBody.',
    date: '2024-04-01',
    category: 'Industry Insights',
    image: '/images/news/industry.webp',
    altKey: 'news.articleAlts.related',
    author: 'Research Team',
  },
],
}))

const SLUG = 'iso-cert'

function mountDetail(slug: string = SLUG) {
  return mount(NewsDetail, {
    props: { slug },
    global: {
      stubs: {
        'router-link': RouterLinkStub,
      },
    },
  })
}

// Drive the 200ms onMounted setTimeout + queued microtasks so the article
// finishes loading and reactive watchers flush.
async function finishLoading() {
  await nextTick()
  vi.advanceTimersByTime(200)
  await nextTick()
  // watchers run as microtasks after the ref mutation flushes
  await nextTick()
}

describe('NewsDetail.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.useFakeTimers()
    // Clean any JSON-LD scripts a previous test may have left behind.
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((s) => s.remove())
    // happy-dom does not implement window.alert, so stub it as a global.
    vi.stubGlobal('alert', vi.fn())
    // Default: navigator only exposes clipboard (no share) → clipboard fallback.
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((s) => s.remove())
  })

  // ============================================
  // Loading & Not-Found States
  // ============================================
  describe('Loading & Not Found', () => {
    it('renders the skeleton while loading', () => {
      wrapper = mountDetail()
      expect(wrapper.find('.news-detail__loading').exists()).toBe(true)
      expect(wrapper.find('.news-detail__skeleton-title').exists()).toBe(true)
      expect(wrapper.findAll('.news-detail__skeleton-line')).toHaveLength(3)
    })

    it('renders the not-found alert for an unknown slug', async () => {
      wrapper = mountDetail('does-not-exist')
      await finishLoading()
      const notFound = wrapper.find('.news-detail__not-found')
      expect(notFound.exists()).toBe(true)
      expect(notFound.attributes('role')).toBe('alert')
      expect(notFound.attributes('aria-live')).toBe('polite')
      expect(notFound.find('h1').text()).toBe('Article Not Found')
      // Back-to-news link present
      expect(notFound.find('a[href="/news"]').exists()).toBe(true)
    })

    it('does not render JSON-LD for an unknown slug', async () => {
      wrapper = mountDetail('does-not-exist')
      await finishLoading()
      expect(
        document.querySelectorAll('script[type="application/ld+json"]').length
      ).toBe(0)
    })
  })

  // ============================================
  // Article Content
  // ============================================
  describe('Article Content', () => {
    beforeEach(async () => {
      wrapper = mountDetail()
      await finishLoading()
    })

    it('renders the article container with NewsArticle microdata', () => {
      const article = wrapper.find('.news-detail__article')
      expect(article.exists()).toBe(true)
      expect(article.attributes('itemtype')).toBe('https://schema.org/NewsArticle')
    })

    it('renders the article title as an h1 with itemprop headline', () => {
      const h1 = wrapper.find('.news-detail__title')
      expect(h1.exists()).toBe(true)
      expect(h1.element.tagName.toLowerCase()).toBe('h1')
      expect(h1.text()).toBe('KTech Achieves ISO27001 Certification')
      expect(h1.attributes('itemprop')).toBe('headline')
    })

    it('renders markdown h1 headings inside the rendered content body', () => {
      // The fixture content starts with "# ISO27001 Certification Achievement",
      // which the renderer turns into an h1 inside the markdown body.
      const mdH1s = wrapper.findAll('.news-detail__markdown h1')
      expect(mdH1s.length).toBeGreaterThanOrEqual(1)
    })

    it('renders the translated category label', () => {
      expect(wrapper.find('.news-detail__category').text()).toBe('Company News')
    })

    it('renders the formatted publication date in a <time> element', () => {
      const time = wrapper.find('time.news-detail__date')
      expect(time.exists()).toBe(true)
      expect(time.attributes('datetime')).toBe('2024-01-15')
      // toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})
      expect(time.text()).toContain('January 15, 2024')
      expect(time.text()).toContain('Published on')
    })

    it('renders the author with itemprop author', () => {
      const author = wrapper.find('.news-detail__author')
      expect(author.attributes('itemprop')).toBe('author')
      expect(author.text()).toContain('KTech Team')
    })

    it('renders the featured image inside a CyberImage figure with localized alt', () => {
      // AC #165: the featured <img> is now wrapped by CyberImage (figure.cyber-image)
      // and the alt flows through t(article.altKey), not the article title.
      const fig = wrapper.find('figure.news-detail__figure figure.cyber-image')
      expect(fig.exists()).toBe(true)
      const img = fig.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('/images/news/iso.webp')
      // Alt comes from t(article.altKey) for the ISO article
      expect(img.attributes('alt')).toBe(
        'KTech ISO27001 information security certification announcement',
      )
      // Regression guard: alt is NOT the title
      expect(img.attributes('alt')).not.toBe('KTech Achieves ISO27001 Certification')
    })

    it('loads the featured image eagerly (above-the-fold)', () => {
      const img = wrapper.find('figure.cyber-image img')
      expect(img.attributes('loading')).toBe('eager')
    })

    it('renders the markdown content into HTML (headings, list, blockquote, link)', () => {
      const md = wrapper.find('.news-detail__markdown')
      expect(md.exists()).toBe(true)
      // Headings
      expect(md.findAll('h1').length).toBeGreaterThanOrEqual(1)
      expect(md.findAll('h2').length).toBeGreaterThanOrEqual(1)
      expect(md.findAll('h3').length).toBeGreaterThanOrEqual(1)
      // Bullet list wrapped in <ul>
      const ul = md.find('ul')
      expect(ul.exists()).toBe(true)
      expect(ul.findAll('li').length).toBeGreaterThanOrEqual(2)
      // Bold is rendered as <strong>
      expect(md.findAll('strong').length).toBeGreaterThanOrEqual(1)
      // Blockquote
      expect(md.find('blockquote').exists()).toBe(true)
      // Link with target/rel hardening
      const link = md.find('a')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://example.com')
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toContain('noopener')
    })
  })

  // ============================================
  // HEADLINE BEHAVIOR: JSON-LD head injection + cleanup
  // ============================================
  describe('JSON-LD structured data', () => {
    it('injects a <script type="application/ld+json"> into document.head after the article loads', async () => {
      wrapper = mountDetail()
      await finishLoading()

      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"]'
      )
      // Exactly one script; if duplicates leak, this catches a regression.
      expect(scripts.length).toBe(1)
      const parsed = JSON.parse(scripts[0].textContent || '{}')
      expect(parsed['@context']).toBe('https://schema.org')
      expect(parsed['@type']).toBe('NewsArticle')
      expect(parsed.headline).toBe('KTech Achieves ISO27001 Certification')
      expect(parsed.datePublished).toBe('2024-01-15')
      expect(parsed.publisher.name).toBe('KTech AI')
    })

    it('removes the JSON-LD script from document.head on unmount', async () => {
      wrapper = mountDetail()
      await finishLoading()
      expect(
        document.querySelectorAll('script[type="application/ld+json"]').length
      ).toBe(1)

      wrapper.unmount()
      await nextTick()

      expect(
        document.querySelectorAll('script[type="application/ld+json"]').length
      ).toBe(0)
      // Prevent the afterEach from double-unmounting a disposed wrapper.
      wrapper = undefined as unknown as VueWrapper
    })
  })

  // ============================================
  // Share Behavior
  // ============================================
  describe('Share', () => {
    it('calls navigator.share when available', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { share: shareMock })
      wrapper = mountDetail()
      await finishLoading()

      await wrapper.find('.news-detail__share-button').trigger('click')
      await nextTick()
      expect(shareMock).toHaveBeenCalledTimes(1)
      const payload = shareMock.mock.calls[0][0]
      expect(payload.title).toBe('KTech Achieves ISO27001 Certification')
      // handleShare maps the article excerpt onto the share payload's `text`.
      expect(payload.text).toBe('Information security milestone.')
      expect(typeof payload.url).toBe('string')
    })

    it('falls back to clipboard + alert when navigator.share is unavailable', async () => {
      // navigator only exposes clipboard (no share) — matches the default stub.
      wrapper = mountDetail()
      await finishLoading()

      await wrapper.find('.news-detail__share-button').trigger('click')
      await nextTick()
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1)
      expect(window.alert).toHaveBeenCalledWith('Link copied to clipboard!')
    })

    it('labels the share button with an aria-label', async () => {
      wrapper = mountDetail()
      await finishLoading()
      const btn = wrapper.find('.news-detail__share-button')
      expect(btn.attributes('aria-label')).toBe('Share article')
    })
  })

  // ============================================
  // Related Articles
  // ============================================
  describe('Related Articles', () => {
    it('renders same-category related articles, excluding the current one', async () => {
      wrapper = mountDetail() // iso-cert (Company News)
      await finishLoading()
      const cards = wrapper.findAll('.news-detail__related-card')
      // Fixture: 3 Company News articles (iso-cert + second + third). Excluding
      // the current one leaves 2 same-category siblings; the Industry Insights
      // article is excluded by category.
      expect(cards).toHaveLength(2)
      const hrefs = cards.map((c) => c.attributes('href'))
      expect(hrefs).not.toContain('/news/iso-cert')
      expect(hrefs).toContain('/news/second-cert')
      expect(hrefs).toContain('/news/third-cert')
      expect(hrefs).not.toContain('/news/industry-piece')
    })

    it('omits the related section when there are no same-category siblings', async () => {
      wrapper = mountDetail('industry-piece') // only Industry Insights article
      await finishLoading()
      expect(wrapper.find('.news-detail__related').exists()).toBe(false)
    })

    it('labels the related section with an aria-labelledby heading', async () => {
      wrapper = mountDetail()
      await finishLoading()
      const section = wrapper.find('.news-detail__related')
      expect(section.exists()).toBe(true)
      expect(section.attributes('aria-labelledby')).toBe('related-heading')
      const heading = wrapper.find('#related-heading')
      expect(heading.exists()).toBe(true)
      expect(heading.element.tagName.toLowerCase()).toBe('h2')
    })

    // ============================================
    // AC #305: related-articles images render via CyberImage
    // ============================================
    // The related-articles section previously used a raw <img> with no base-path
    // resolution (404 under /KTechAICyberWeb/), no @error fallback, and an
    // un-localized :alt="related.title". It must now use CyberImage so the
    // image is rebased, has the cyberpunk fallback, and the alt comes from the
    // localized altKey (falling back to the title if the key is absent).
    it('renders each related card image inside a CyberImage figure (no raw img)', async () => {
      wrapper = mountDetail() // iso-cert → 2 related siblings
      await finishLoading()
      const cards = wrapper.findAll('.news-detail__related-card')
      expect(cards.length).toBe(2)

      // Every related card must wrap its image in a CyberImage figure, and there
      // must be NO raw <img> directly inside the related-image-wrapper (the img
      // now lives inside figure.cyber-image).
      for (const card of cards) {
        const fig = card.find('.news-detail__related-image-wrapper figure.cyber-image')
        expect(fig.exists(), 'related card should wrap its img in figure.cyber-image').toBe(true)
        // The wrapper itself must not directly contain a bare img child.
        const bareImgs = card
          .find('.news-detail__related-image-wrapper')
          .findAll(':scope > img')
        expect(bareImgs.length).toBe(0)
      }
    })

    it('rebases the related image src under the Vite base subpath', async () => {
      // Simulate the production base /KTechAICyberWeb/.
      vi.stubEnv('BASE_URL', '/KTechAICyberWeb/')
      wrapper = mountDetail() // iso-cert
      await finishLoading()
      const img = wrapper.find(
        '.news-detail__related-card figure.cyber-image img',
      )
      expect(img.exists()).toBe(true)
      // The fixture related image src is /images/news/second.webp; under the
      // subpath it must be rebased to /KTechAICyberWeb/images/news/second.webp.
      expect(img.attributes('src')).toBe('/KTechAICyberWeb/images/news/second.webp')
    })

    it('uses the localized altKey for the related image alt (not the raw title)', async () => {
      wrapper = mountDetail() // iso-cert
      await finishLoading()
      const img = wrapper.find(
        '.news-detail__related-card figure.cyber-image img',
      )
      expect(img.exists()).toBe(true)
      // The related fixture altKey is 'news.articleAlts.related', which the
      // i18n mock maps to 'Related article image'. The alt must NOT be the
      // raw title 'Second Company Milestone'.
      expect(img.attributes('alt')).toBe('Related article image')
      expect(img.attributes('alt')).not.toBe('Second Company Milestone')
    })

    it('related images carry the CyberImage @error fallback (placeholder exists on error)', async () => {
      wrapper = mountDetail() // iso-cert
      await finishLoading()
      const fig = wrapper.find(
        '.news-detail__related-card figure.cyber-image',
      )
      // No fallback initially.
      expect(fig.find('.cyber-image__fallback').exists()).toBe(false)
      // Fire the native error event on the related img.
      await fig.find('img').trigger('error')
      // The CyberImage fallback placeholder must appear.
      expect(fig.find('.cyber-image__fallback').exists()).toBe(true)
    })
  })

  // ============================================
  // Accessibility
  // ============================================
  describe('Accessibility', () => {
    it('uses role=main and an aria-label on the root landmark', async () => {
      wrapper = mountDetail()
      await finishLoading()
      const main = wrapper.find('main')
      expect(main.exists()).toBe(true)
      expect(main.attributes('role')).toBe('main')
      expect(main.attributes('aria-label')).toBe('Article main content')
    })

    it('renders a labelled breadcrumb with home + news links and current title', async () => {
      wrapper = mountDetail()
      await finishLoading()
      const nav = wrapper.find('nav[aria-label="Breadcrumb"]')
      expect(nav.exists()).toBe(true)
      expect(nav.find('a[href="/"]').exists()).toBe(true)
      const newsLinks = nav.findAll('a[href="/news"]')
      expect(newsLinks.length).toBeGreaterThanOrEqual(1)
      expect(nav.find('.news-detail__breadcrumb-current').text()).toBe(
        'KTech Achieves ISO27001 Certification'
      )
    })
  })
})
