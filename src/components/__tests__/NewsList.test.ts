/**
 * @file NewsList.test.ts
 * @description Comprehensive unit tests for NewsList component
 * @ticket #98 - TEST-028: NewsList Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount and grid DOM structure
 * - Data Display Tests: Articles passed through to NewsCard, slicing
 * - Empty State Tests: No-articles placeholder + a11y attributes
 * - Loading State Tests: 6 skeleton placeholders rendered while loading
 * - Load More Tests: Button visibility, emission, aria-label
 * - Accessibility Tests: role=list / role=listitem / aria-live
 * - i18n Tests: Translation function behavior for news keys
 * - Edge Cases: Lifecycle, large lists, multiple renders
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'

// Mock the i18n barrel BEFORE importing the component so its `useLanguage`
// import resolves to a controlled translation function. Dictionary mirrors the
// news.* keys consumed by NewsList.vue (src/locales/en.json).
vi.mock('../../i18n', () => {
  const dictionary: Record<string, string> = {
    'news.noNews': 'No news available',
    'news.loadMore': 'Load More',
  }

  // t(key) resolves known keys to their English value and falls back to the
  // key itself for unknown keys — matching the real useLanguage().t contract.
  const t = (key: string) => dictionary[key] ?? key

  return {
    useLanguage: () => ({ t }),
  }
})

import NewsList from '../NewsList.vue'

// A representative article used across rendering/data-display tests.
const makeArticle = (id: number) => ({
  id,
  title: `Article ${id}`,
  excerpt: `Excerpt for article ${id}`,
  image: `https://example.com/images/${id}.jpg`,
  date: '2026-06-15',
  category: 'Company News',
  slug: `article-${id}`,
})

const buildArticles = (count: number) =>
  Array.from({ length: count }, (_, i) => makeArticle(i + 1))

// Stub NewsCard so we can assert on the props/attrs the parent passes through
// (article, isLoading, role="listitem") without depending on NewsCard's own
// implementation. The single-root stub receives fallthrough attrs directly.
const NewsCardStub = {
  name: 'NewsCard',
  template:
    '<div class="news-card-stub" :role="role" :data-loading="isLoading ? \'true\' : \'false\'" :data-article-id="article && article.id">{{ article && article.title }}</div>',
  props: {
    article: { type: Object, default: () => ({}) },
    isLoading: { type: Boolean, default: false },
    role: { type: String, default: '' },
  },
}

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(NewsList, {
    props: {
      articles: [],
      ...props,
    },
    global: {
      stubs: {
        NewsCard: NewsCardStub,
      },
    },
  })
}

describe('NewsList.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // happy-dom does not implement window.scrollTo; the component calls it on
    // load-more. Provide a no-op so it never throws.
    window.scrollTo = vi.fn()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      wrapper = createWrapper()

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the root container with the news-list class', () => {
      wrapper = createWrapper({ articles: buildArticles(1) })

      const root = wrapper.find('.news-list')
      expect(root.exists()).toBe(true)
    })

    it('renders the grid container with role="list"', () => {
      wrapper = createWrapper({ articles: buildArticles(2) })

      const grid = wrapper.find('.news-list__grid')
      expect(grid.exists()).toBe(true)
      expect(grid.attributes('role')).toBe('list')
    })

    it('renders a NewsCard for each visible article', () => {
      const articles = buildArticles(3)
      wrapper = createWrapper({ articles })

      const cards = wrapper.findAll('.news-card-stub')
      expect(cards).toHaveLength(3)
    })

    it('applies role="listitem" to each rendered NewsCard item', () => {
      wrapper = createWrapper({ articles: buildArticles(2) })

      const cards = wrapper.findAll('.news-list__item')
      expect(cards).toHaveLength(2)
      cards.forEach((card) => {
        expect(card.attributes('role')).toBe('listitem')
      })
    })
  })

  // ============================================
  // Data Display Tests
  // ============================================
  describe('Data Display', () => {
    it('passes each article object through to its NewsCard', () => {
      const articles = buildArticles(2)
      wrapper = createWrapper({ articles })

      const cards = wrapper.findAll('.news-card-stub')
      expect(cards[0].attributes('data-article-id')).toBe('1')
      expect(cards[1].attributes('data-article-id')).toBe('2')
      expect(cards[0].text()).toBe('Article 1')
    })

    it('renders the article title text inside each card', () => {
      wrapper = createWrapper({ articles: buildArticles(2) })

      const text = wrapper.text()
      expect(text).toContain('Article 1')
      expect(text).toContain('Article 2')
    })

    it('limits visible cards to visibleCount (default 6)', () => {
      // 10 articles, default visibleCount = 6 → only 6 cards rendered in grid.
      wrapper = createWrapper({ articles: buildArticles(10) })

      const gridCards = wrapper.find('.news-list__grid').findAll('.news-card-stub')
      expect(gridCards).toHaveLength(6)
    })

    it('respects a custom visibleCount prop', () => {
      wrapper = createWrapper({
        articles: buildArticles(8),
        visibleCount: 3,
      })

      const gridCards = wrapper.find('.news-list__grid').findAll('.news-card-stub')
      expect(gridCards).toHaveLength(3)
    })

    it('renders all articles when count is below visibleCount', () => {
      wrapper = createWrapper({ articles: buildArticles(4) })

      const gridCards = wrapper.find('.news-list__grid').findAll('.news-card-stub')
      expect(gridCards).toHaveLength(4)
    })

    it('applies the news-list__item class to each grid card', () => {
      wrapper = createWrapper({ articles: buildArticles(2) })

      const items = wrapper.findAll('.news-list__grid .news-list__item')
      expect(items).toHaveLength(2)
    })
  })

  // ============================================
  // Empty State Tests
  // ============================================
  describe('Empty State', () => {
    it('displays the empty state when articles array is empty', () => {
      wrapper = createWrapper({ articles: [] })

      const empty = wrapper.find('.news-list__empty')
      expect(empty.exists()).toBe(true)
    })

    it('shows the empty-state icon and translated text', () => {
      wrapper = createWrapper({ articles: [] })

      const empty = wrapper.find('.news-list__empty')
      expect(empty.find('.news-list__empty-icon').exists()).toBe(true)
      expect(empty.find('.news-list__empty-text').text()).toBe('No news available')
    })

    it('gives the empty state role="status" and aria-live="polite"', () => {
      wrapper = createWrapper({ articles: [] })

      const empty = wrapper.find('.news-list__empty')
      expect(empty.attributes('role')).toBe('status')
      expect(empty.attributes('aria-live')).toBe('polite')
    })

    it('hides the empty state once articles exist', () => {
      wrapper = createWrapper({ articles: buildArticles(1) })

      // Two empty blocks exist in template (no-news / no-results). With a
      // non-empty list neither should render.
      const empties = wrapper.findAll('.news-list__empty')
      expect(empties).toHaveLength(0)
    })

    it('marks the empty-state icon as aria-hidden', () => {
      wrapper = createWrapper({ articles: [] })

      const icon = wrapper.find('.news-list__empty-icon')
      expect(icon.attributes('aria-hidden')).toBe('true')
    })
  })

  // ============================================
  // Loading State Tests
  // ============================================
  describe('Loading State', () => {
    it('renders the skeleton container while loading', () => {
      wrapper = createWrapper({ articles: [], isLoading: true })

      const skeletons = wrapper.find('.news-list__skeletons')
      expect(skeletons.exists()).toBe(true)
    })

    it('renders exactly 6 skeleton NewsCard components while loading', () => {
      wrapper = createWrapper({ articles: [], isLoading: true })

      const skeletons = wrapper.findAll('.news-list__skeletons .news-card-stub')
      expect(skeletons).toHaveLength(6)
    })

    it('passes isLoading=true to every skeleton card', () => {
      wrapper = createWrapper({ articles: [], isLoading: true })

      const skeletons = wrapper.findAll('.news-list__skeletons .news-card-stub')
      skeletons.forEach((card) => {
        expect(card.attributes('data-loading')).toBe('true')
      })
    })

    it('does not render skeletons when isLoading is false', () => {
      wrapper = createWrapper({ articles: buildArticles(2), isLoading: false })

      const skeletons = wrapper.find('.news-list__skeletons')
      expect(skeletons.exists()).toBe(false)
    })

    it('does not show the empty state while loading even with no articles', () => {
      wrapper = createWrapper({ articles: [], isLoading: true })

      const empties = wrapper.findAll('.news-list__empty')
      expect(empties).toHaveLength(0)
    })
  })

  // ============================================
  // Load More Tests
  // ============================================
  describe('Load More', () => {
    it('shows the Load More button when more articles exist', () => {
      // 8 articles, visibleCount 6 → hasMore is true.
      wrapper = createWrapper({ articles: buildArticles(8) })

      const button = wrapper.find('.news-list__button')
      expect(button.exists()).toBe(true)
    })

    it('hides the Load More button when no more articles exist', () => {
      wrapper = createWrapper({ articles: buildArticles(6) })

      const button = wrapper.find('.news-list__button')
      expect(button.exists()).toBe(false)
    })

    it('hides the Load More button while loading', () => {
      wrapper = createWrapper({
        articles: buildArticles(8),
        isLoading: true,
      })

      const button = wrapper.find('.news-list__button')
      expect(button.exists()).toBe(false)
    })

    it('emits "load-more" when the button is clicked', async () => {
      wrapper = createWrapper({ articles: buildArticles(8) })

      await wrapper.find('.news-list__button').trigger('click')

      expect(wrapper.emitted('load-more')).toBeTruthy()
      expect(wrapper.emitted('load-more')).toHaveLength(1)
    })

    it('uses the translated label as the button aria-label', () => {
      wrapper = createWrapper({ articles: buildArticles(8) })

      const button = wrapper.find('.news-list__button')
      expect(button.attributes('aria-label')).toBe('Load More')
    })

    it('renders the translated label text inside the button', () => {
      wrapper = createWrapper({ articles: buildArticles(8) })

      const button = wrapper.find('.news-list__button')
      expect(button.text()).toContain('Load More')
    })

    it('triggers window.scrollTo after clicking load more (fake timers)', () => {
      vi.useFakeTimers()
      try {
        wrapper = createWrapper({ articles: buildArticles(8) })
        const scrollToSpy = window.scrollTo as ReturnType<typeof vi.fn>

        wrapper.find('.news-list__button').trigger('click')
        // The component schedules the scroll inside a 100ms setTimeout.
        vi.advanceTimersByTime(150)

        expect(scrollToSpy).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('sets role="list" on the grid container', () => {
      wrapper = createWrapper({ articles: buildArticles(2) })

      expect(wrapper.find('.news-list__grid').attributes('role')).toBe('list')
    })

    it('sets role="listitem" on every grid child', () => {
      wrapper = createWrapper({ articles: buildArticles(3) })

      const cards = wrapper.findAll('.news-list__grid .news-list__item')
      cards.forEach((card) => {
        expect(card.attributes('role')).toBe('listitem')
      })
    })

    it('uses aria-live="polite" on the empty state', () => {
      wrapper = createWrapper({ articles: [] })

      expect(wrapper.find('.news-list__empty').attributes('aria-live')).toBe('polite')
    })

    it('provides an aria-label on the Load More button', () => {
      wrapper = createWrapper({ articles: buildArticles(8) })

      expect(wrapper.find('.news-list__button').attributes('aria-label')).toBe('Load More')
    })

    it('marks the load-more button icon as aria-hidden', () => {
      wrapper = createWrapper({ articles: buildArticles(8) })

      const icon = wrapper.find('.news-list__button-icon')
      expect(icon.attributes('aria-hidden')).toBe('true')
    })
  })

  // ============================================
  // i18n Tests
  // ============================================
  describe('Internationalization', () => {
    it('exposes a translation function on the component instance', () => {
      wrapper = createWrapper({ articles: [] })

      expect(typeof wrapper.vm.t).toBe('function')
    })

    it('translates the news.noNews key correctly', () => {
      wrapper = createWrapper({ articles: [] })

      expect(wrapper.vm.t('news.noNews')).toBe('No news available')
    })

    it('translates the news.loadMore key correctly', () => {
      wrapper = createWrapper({ articles: buildArticles(8) })

      expect(wrapper.vm.t('news.loadMore')).toBe('Load More')
    })

    it('returns the key itself when translation is missing', () => {
      wrapper = createWrapper({ articles: [] })

      expect(wrapper.vm.t('nonexistent.key')).toBe('nonexistent.key')
    })

    it('reflects updated translations in the rendered empty-state text', () => {
      wrapper = createWrapper({ articles: [] })

      expect(wrapper.find('.news-list__empty-text').text()).toBe('No news available')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('renders only the empty state when given an empty articles array', () => {
      wrapper = createWrapper({ articles: [] })

      expect(wrapper.findAll('.news-card-stub')).toHaveLength(0)
      expect(wrapper.find('.news-list__empty').exists()).toBe(true)
    })

    it('handles a single article correctly', () => {
      wrapper = createWrapper({ articles: buildArticles(1) })

      expect(wrapper.findAll('.news-list__grid .news-card-stub')).toHaveLength(1)
      expect(wrapper.find('.news-list__button').exists()).toBe(false)
    })

    it('handles a large list by capping visible cards and showing Load More', () => {
      wrapper = createWrapper({ articles: buildArticles(50) })

      expect(wrapper.findAll('.news-list__grid .news-card-stub')).toHaveLength(6)
      expect(wrapper.find('.news-list__button').exists()).toBe(true)
    })

    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [
        createWrapper({ articles: buildArticles(2) }),
        createWrapper({ articles: buildArticles(2) }),
        createWrapper({ articles: buildArticles(2) }),
      ]

      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.findAll('.news-card-stub')).toHaveLength(2)
      })

      wrappers.forEach((w) => w.unmount())
      expect(true).toBe(true)
    })

    it('reacts to articles prop changes', async () => {
      wrapper = createWrapper({ articles: buildArticles(1) })
      expect(wrapper.findAll('.news-list__grid .news-card-stub')).toHaveLength(1)

      await wrapper.setProps({ articles: buildArticles(4) })
      expect(wrapper.findAll('.news-list__grid .news-card-stub')).toHaveLength(4)
    })

    it('reacts to isLoading prop changes', async () => {
      wrapper = createWrapper({ articles: buildArticles(2) })
      expect(wrapper.find('.news-list__skeletons').exists()).toBe(false)

      await wrapper.setProps({ isLoading: true })
      expect(wrapper.find('.news-list__skeletons').exists()).toBe(true)
      expect(wrapper.findAll('.news-list__skeletons .news-card-stub')).toHaveLength(6)
    })
  })
})
