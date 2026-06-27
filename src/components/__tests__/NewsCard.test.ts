/**
 * @file NewsCard.test.ts
 * @description Comprehensive unit tests for NewsCard component
 * @ticket #93 - TEST-024: NewsCard Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount and DOM structure
 * - Data Display Tests: Date formatting, image rendering, text content
 * - Loading State Tests: Skeleton UI and loading prop behavior
 * - Behavior Tests: Click handling and navigation via router-link
 * - Accessibility Tests: ARIA attributes and alt text
 * - Styling Tests: CSS class application and overlay rendering
 * - i18n Tests: Translation function behavior for news keys
 * - Edge Cases: Component lifecycle and multiple renders
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'

// Mock the i18n barrel BEFORE importing the component so its `useLanguage`
// import resolves to a controlled translation function.
vi.mock('../../i18n', () => {
  // A minimal translation map mirroring src/locales/en.json (news.* keys).
  const dictionary: Record<string, string> = {
    'news.readMore': 'Read More',
    'news.categories.company': 'Company News',
    'news.categories.industry': 'Industry Insights',
    'news.categories.technology': 'Technology Updates',
    'news.categories.events': 'Events',
  }

  // t(key) resolves known keys to their English value and falls back to the
  // key itself for unknown keys — matching the real useLanguage().t contract.
  const t = (key: string) => dictionary[key] ?? key

  return {
    useLanguage: () => ({ t }),
  }
})

import NewsCard from '../NewsCard.vue'

// A representative article used across rendering/data-display tests.
const baseArticle = {
  title: 'KTech Launches New Platform',
  excerpt: 'A deep dive into our latest release and what it means for users.',
  image: 'https://example.com/images/launch.jpg',
  date: '2026-06-15',
  category: 'Company News',
  slug: 'ktech-launches-new-platform',
}

// Stub router-link so the component renders without vue-router and we can
// assert on the rendered link attributes (to / aria-label).
const RouterLinkStub = {
  name: 'RouterLink',
  template: '<a :href="String(to)"><slot /></a>',
  props: ['to'],
}

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(NewsCard, {
    props: { article: baseArticle, ...props },
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
  })
}

describe('NewsCard.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders article tag with correct class', () => {
      const article = wrapper.find('article.news-card')
      expect(article.exists()).toBe(true)
    })

    it('uses semantic article HTML5 tag', () => {
      const article = wrapper.find('article')
      expect(article.exists()).toBe(true)
      expect(article.element.tagName.toLowerCase()).toBe('article')
    })

    it('renders the image wrapper structure', () => {
      const imageWrapper = wrapper.find('.news-card__image-wrapper')
      expect(imageWrapper.exists()).toBe(true)
    })

    it('renders the content section', () => {
      const content = wrapper.find('.news-card__content')
      expect(content.exists()).toBe(true)
    })

    it('renders the read more link when not loading', () => {
      const link = wrapper.find('.news-card__link')
      expect(link.exists()).toBe(true)
    })

    it('does not render read more link when loading', () => {
      const loadingWrapper = createWrapper({ isLoading: true })
      expect(loadingWrapper.find('.news-card__link').exists()).toBe(false)
      loadingWrapper.unmount()
    })
  })

  // ============================================
  // Data Display Tests
  // ============================================
  describe('Data Display', () => {
    it('displays formatted date in the date badge', () => {
      const badge = wrapper.find('.news-card__badge')
      expect(badge.exists()).toBe(true)
      // 2026-06-15 formatted as en-US short month, day, year.
      expect(badge.text()).toBe('Jun 15, 2026')
    })

    it('renders empty date badge when article has no date', () => {
      const noDate = createWrapper({
        article: { ...baseArticle, date: '' },
      })
      const badge = noDate.find('.news-card__badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('')
      noDate.unmount()
    })

    it('renders featured image when image is provided', () => {
      const img = wrapper.find('img.news-card__image')
      expect(img.exists()).toBe(true)
    })

    it('sets the image src to the article image', () => {
      const img = wrapper.find('.news-card__image')
      expect(img.attributes('src')).toBe(baseArticle.image)
    })

    it('uses article title as image alt text', () => {
      const img = wrapper.find('.news-card__image')
      expect(img.attributes('alt')).toBe(baseArticle.title)
    })

    it('renders the article title in the content section', () => {
      const title = wrapper.find('.news-card__title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe(baseArticle.title)
    })

    it('renders the article excerpt in the content section', () => {
      const excerpt = wrapper.find('.news-card__excerpt')
      expect(excerpt.exists()).toBe(true)
      expect(excerpt.text()).toBe(baseArticle.excerpt)
    })

    it('renders the resolved category label', () => {
      const category = wrapper.find('.news-card__category')
      expect(category.exists()).toBe(true)
      // 'Company News' maps to news.categories.company -> 'Company News'
      expect(category.text()).toBe('Company News')
    })

    it('falls back to raw category text for unmapped categories', () => {
      const unmapped = createWrapper({
        article: { ...baseArticle, category: 'Press Releases' },
      })
      expect(unmapped.find('.news-card__category').text()).toBe('Press Releases')
      unmapped.unmount()
    })
  })

  // ============================================
  // Loading State Tests
  // ============================================
  describe('Loading State', () => {
    it('applies loading modifier class when isLoading is true', () => {
      const loadingWrapper = createWrapper({ isLoading: true })
      const article = loadingWrapper.find('article')
      expect(article.classes()).toContain('news-card--loading')
      loadingWrapper.unmount()
    })

    it('does not apply loading modifier class by default', () => {
      const article = wrapper.find('article')
      expect(article.classes()).not.toContain('news-card--loading')
    })

    it('shows skeleton instead of image in loading state', () => {
      const loadingWrapper = createWrapper({ isLoading: true })
      expect(loadingWrapper.find('.news-card__image-skeleton').exists()).toBe(true)
      expect(loadingWrapper.find('.news-card__image').exists()).toBe(false)
      loadingWrapper.unmount()
    })

    it('shows skeleton when image is missing even if not loading', () => {
      const noImage = createWrapper({
        article: { ...baseArticle, image: '' },
      })
      expect(noImage.find('.news-card__image-skeleton').exists()).toBe(true)
      expect(noImage.find('.news-card__image').exists()).toBe(false)
      noImage.unmount()
    })

    it('displays loading text in title during loading state', () => {
      const loadingWrapper = createWrapper({ isLoading: true })
      expect(loadingWrapper.find('.news-card__title').text()).toBe('Loading article...')
      loadingWrapper.unmount()
    })

    it('displays loading text in excerpt during loading state', () => {
      const loadingWrapper = createWrapper({ isLoading: true })
      expect(loadingWrapper.find('.news-card__excerpt').text()).toBe('Loading excerpt...')
      loadingWrapper.unmount()
    })
  })

  // ============================================
  // Behavior Tests
  // ============================================
  describe('Behavior', () => {
    it('renders a router-link pointing to the article detail route', () => {
      const link = wrapper.find('.news-card__link')
      expect(link.exists()).toBe(true)
      // The router-link stub exposes the resolved `to` target as the link href.
      expect(link.attributes('href')).toBe(`/news/${baseArticle.slug}`)
    })

    it('renders the read more label text', () => {
      const link = wrapper.find('.news-card__link')
      expect(link.text()).toContain('Read More')
    })

    it('renders an arrow indicator inside the link', () => {
      const arrow = wrapper.find('.news-card__arrow')
      expect(arrow.exists()).toBe(true)
      expect(arrow.text()).toBe('→')
    })

    it('reacts to isLoading prop changes', async () => {
      // Starts not loading: link visible.
      expect(wrapper.find('.news-card__link').exists()).toBe(true)
      // Flip to loading: link should disappear, skeleton should appear.
      await wrapper.setProps({ isLoading: true })
      expect(wrapper.find('.news-card__link').exists()).toBe(false)
      expect(wrapper.find('.news-card__image-skeleton').exists()).toBe(true)
      // Flip back: link reappears.
      await wrapper.setProps({ isLoading: false })
      expect(wrapper.find('.news-card__link').exists()).toBe(true)
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('marks the date badge as aria-hidden', () => {
      const badge = wrapper.find('.news-card__badge')
      expect(badge.attributes('aria-hidden')).toBe('true')
    })

    it('marks the image overlay as aria-hidden', () => {
      const overlay = wrapper.find('.news-card__image-overlay')
      expect(overlay.attributes('aria-hidden')).toBe('true')
    })

    it('marks the read more arrow as aria-hidden', () => {
      const arrow = wrapper.find('.news-card__arrow')
      expect(arrow.attributes('aria-hidden')).toBe('true')
    })

    it('provides a descriptive aria-label on the read more link', () => {
      const link = wrapper.find('.news-card__link')
      expect(link.attributes('aria-label')).toBe(
        `Read More: ${baseArticle.title}`
      )
    })

    it('provides alt text for the featured image', () => {
      const img = wrapper.find('.news-card__image')
      expect(img.attributes('alt')).toBeTruthy()
    })
  })

  // ============================================
  // Styling Tests
  // ============================================
  describe('Styling', () => {
    it('applies news-card class to the root article', () => {
      const article = wrapper.find('article')
      expect(article.classes()).toContain('news-card')
    })

    it('applies expected CSS classes to child elements', () => {
      expect(wrapper.find('.news-card__badge').exists()).toBe(true)
      expect(wrapper.find('.news-card__image-wrapper').exists()).toBe(true)
      expect(wrapper.find('.news-card__category').exists()).toBe(true)
      expect(wrapper.find('.news-card__content').exists()).toBe(true)
      expect(wrapper.find('.news-card__link').exists()).toBe(true)
    })

    it('renders the image overlay element', () => {
      const overlay = wrapper.find('.news-card__image-overlay')
      expect(overlay.exists()).toBe(true)
    })

    it('overlay is a child of the image wrapper', () => {
      const imageWrapper = wrapper.find('.news-card__image-wrapper')
      const overlay = imageWrapper.find('.news-card__image-overlay')
      expect(overlay.exists()).toBe(true)
    })
  })

  // ============================================
  // i18n Tests
  // ============================================
  describe('Internationalization', () => {
    it('exposes a translation function on the component instance', () => {
      expect(typeof wrapper.vm.t).toBe('function')
    })

    it('translates the news.readMore key correctly', () => {
      expect(wrapper.vm.t('news.readMore')).toBe('Read More')
    })

    it('translates a known category key correctly', () => {
      expect(wrapper.vm.t('news.categories.company')).toBe('Company News')
    })

    it('returns the key as fallback when translation is missing', () => {
      expect(wrapper.vm.t('nonexistent.key')).toBe('nonexistent.key')
    })

    it('uses readMore translation in the link aria-label', () => {
      const link = wrapper.find('.news-card__link')
      expect(link.attributes('aria-label')).toContain('Read More')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [
        createWrapper(),
        createWrapper(),
        createWrapper(),
      ]
      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.text()).toContain(baseArticle.title)
      })
      wrappers.forEach((w) => w.unmount())
      expect(true).toBe(true)
    })

    it('renders correctly when remounted after unmount', () => {
      wrapper.unmount()
      const reWrapper = createWrapper()
      expect(reWrapper.text()).toContain(baseArticle.title)
      expect(reWrapper.find('.news-card__image').exists()).toBe(true)
      reWrapper.unmount()
    })

    it('handles rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const w = createWrapper()
        expect(w.exists()).toBe(true)
        w.unmount()
      }
      expect(true).toBe(true)
    })

    it('renders without image-skeleton when image and not loading', () => {
      expect(wrapper.find('.news-card__image-skeleton').exists()).toBe(false)
    })

    it('renders two non-loading child text blocks (title + excerpt)', () => {
      expect(wrapper.find('.news-card__title').exists()).toBe(true)
      expect(wrapper.find('.news-card__excerpt').exists()).toBe(true)
    })
  })

  // ============================================
  // Component Structure
  // ============================================
  describe('Component Structure', () => {
    it('has correct DOM hierarchy for the image section', () => {
      const imageWrapper = wrapper.find('.news-card__image-wrapper')
      expect(imageWrapper.find('.news-card__image').exists()).toBe(true)
      expect(imageWrapper.find('.news-card__image-overlay').exists()).toBe(true)
    })

    it('contains the title and excerpt within the content section', () => {
      const content = wrapper.find('.news-card__content')
      expect(content.find('.news-card__title').exists()).toBe(true)
      expect(content.find('.news-card__excerpt').exists()).toBe(true)
    })

    it('renders the full expected HTML structure', () => {
      const html = wrapper.html()
      expect(html).toContain('news-card')
      expect(html).toContain('news-card__badge')
      expect(html).toContain('news-card__image')
      expect(html).toContain('news-card__category')
      expect(html).toContain('news-card__content')
      expect(html).toContain('news-card__link')
    })
  })
})
