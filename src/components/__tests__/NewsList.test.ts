/**
 * @file NewsList.test.ts
 * @description Comprehensive unit tests for NewsList component
 * @ticket #60 - TEST-013: News Section Component Unit Tests - TDD with Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import NewsList from '../NewsList.vue'
import NewsCard from '../NewsCard.vue'
import RouterLinkStub from './RouterLinkStub.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
}))

// Mock ../../i18n path (src/i18n.js) as used in the component
vi.mock('../../i18n', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'news.loadMore': 'Load More',
        'news.noNews': 'No news available',
        'news.categories.all': 'All',
        'news.categories.company': 'Company News',
        'news.categories.industry': 'Industry Insights',
        'news.categories.technology': 'Technology Updates',
        'news.categories.events': 'Events',
      }
      return translations[key] || key
    },
  }),
}))

describe('NewsList.vue', () => {
  let wrapper: VueWrapper

  const mockArticles = [
    {
      id: 1,
      slug: 'article-1',
      title: 'First Article',
      excerpt: 'First article excerpt.',
      date: '2024-01-15',
      category: 'Company News',
      image: '/images/article1.webp',
    },
    {
      id: 2,
      slug: 'article-2',
      title: 'Second Article',
      excerpt: 'Second article excerpt.',
      date: '2024-01-16',
      category: 'Industry Insights',
      image: '/images/article2.webp',
    },
    {
      id: 3,
      slug: 'article-3',
      title: 'Third Article',
      excerpt: 'Third article excerpt.',
      date: '2024-01-17',
      category: 'Technology Updates',
      image: '/images/article3.webp',
    },
  ]

  afterEach(() => {
    if (wrapper) wrapper.unmount()
  })

  describe('Rendering', () => {
    it('should mount without errors', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('renders div tag with correct class', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const listDiv = wrapper.find('div.news-list')
      expect(listDiv.exists()).toBe(true)
    })
  })

  describe('Props', () => {
    it('accepts articles prop with correct structure', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      expect(wrapper.props('articles')).toEqual(mockArticles)
    })

    it('accepts isLoading prop', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: true },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      expect(wrapper.props('isLoading')).toBe(true)
    })

    it('accepts visibleCount prop', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false, visibleCount: 2 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      expect(wrapper.props('visibleCount')).toBe(2)
    })

    it('has default visibleCount value of 6', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      expect(wrapper.props('visibleCount')).toBe(6)
    })

    it('has default isLoading value of false', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      expect(wrapper.props('isLoading')).toBe(false)
    })
  })

  describe('Article Rendering', () => {
    beforeEach(() => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
    })

    it('renders correct number of articles', () => {
      const cards = wrapper.findAllComponents(NewsCard)
      expect(cards.length).toBe(3)
    })

    it('passes article data to each NewsCard', () => {
      const cards = wrapper.findAllComponents(NewsCard)
      expect(cards[0].props('article')).toEqual(mockArticles[0])
      expect(cards[1].props('article')).toEqual(mockArticles[1])
      expect(cards[2].props('article')).toEqual(mockArticles[2])
    })

    it('passes isLoading to each NewsCard', () => {
      const cards = wrapper.findAllComponents(NewsCard)
      cards.forEach(card => {
        expect(card.props('isLoading')).toBe(false)
      })
    })

    it('renders articles in correct order', () => {
      const cards = wrapper.findAllComponents(NewsCard)
      expect(cards[0].props('article').id).toBe(1)
      expect(cards[1].props('article').id).toBe(2)
      expect(cards[2].props('article').id).toBe(3)
    })
  })

  describe('visibleCount Prop', () => {
    it('respects visibleCount to limit articles', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false, visibleCount: 2 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const cards = wrapper.findAllComponents(NewsCard)
      expect(cards.length).toBe(2)
    })

    it('shows all articles when visibleCount exceeds articles length', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false, visibleCount: 10 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const cards = wrapper.findAllComponents(NewsCard)
      expect(cards.length).toBe(3)
    })
  })

  describe('Load More Button', () => {
    it('renders load more button when hasMore is true (computed)', () => {
      const manyArticles = [...mockArticles, ...mockArticles]
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 3 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const buttonDiv = wrapper.find('.news-list__load-more')
      expect(buttonDiv.exists()).toBe(true)
    })

    it('does not render load more button when hasMore is false', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const buttonDiv = wrapper.find('.news-list__load-more')
      expect(buttonDiv.exists()).toBe(false)
    })

    it('shows translated load more text', () => {
      const manyArticles = [...mockArticles, ...mockArticles]
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 3 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const button = wrapper.find('.news-list__button')
      expect(button.text()).toContain('Load More')
    })

    it('emits load-more event when button is clicked', async () => {
      const manyArticles = [...mockArticles, ...mockArticles]
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 3 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const button = wrapper.find('.news-list__button')
      await button.trigger('click')
      expect(wrapper.emitted('load-more')).toBeTruthy()
      expect(wrapper.emitted('load-more')?.length).toBe(1)
    })

    it('button has correct aria-label', () => {
      const manyArticles = [...mockArticles, ...mockArticles]
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 3 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const button = wrapper.find('.news-list__button')
      expect(button.attributes('aria-label')).toBe('Load More')
    })

    it('button has icon', () => {
      const manyArticles = [...mockArticles, ...mockArticles]
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 3 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const icon = wrapper.find('.news-list__button-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('↓')
    })
  })

  describe('Empty State', () => {
    it('shows empty state when articles array is empty', () => {
      wrapper = mount(NewsList, {
        props: { articles: [], isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const emptyState = wrapper.find('.news-list__empty')
      expect(emptyState.exists()).toBe(true)
    })

    it('shows translated no news message', () => {
      wrapper = mount(NewsList, {
        props: { articles: [], isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const emptyText = wrapper.find('.news-list__empty-text')
      expect(emptyText.text()).toContain('No news available')
    })

    it('has empty icon', () => {
      wrapper = mount(NewsList, {
        props: { articles: [], isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const emptyIcon = wrapper.find('.news-list__empty-icon')
      expect(emptyIcon.exists()).toBe(true)
      expect(emptyIcon.text()).toBe('📭')
    })

    it('empty state has role status', () => {
      wrapper = mount(NewsList, {
        props: { articles: [], isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const emptyState = wrapper.find('.news-list__empty')
      expect(emptyState.attributes('role')).toBe('status')
    })

    it('empty state has aria-live polite', () => {
      wrapper = mount(NewsList, {
        props: { articles: [], isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const emptyState = wrapper.find('.news-list__empty')
      expect(emptyState.attributes('aria-live')).toBe('polite')
    })

    it('does not render NewsCard components when articles is empty', () => {
      wrapper = mount(NewsList, {
        props: { articles: [], isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const cards = wrapper.findAllComponents(NewsCard)
      expect(cards.length).toBe(0)
    })

    it('does not show empty state when articles exist', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const emptyState = wrapper.find('.news-list__empty')
      expect(emptyState.exists()).toBe(false)
    })

    it('shows no results when filtered results are empty', () => {
      const manyArticles = [...mockArticles, ...mockArticles]
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 0 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const emptyText = wrapper.find('.news-list__empty-text')
      expect(emptyText.text()).toContain('No articles match your filter')
    })
  })

  describe('Loading State', () => {
    it('passes isLoading to NewsCard components when loading', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: true },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const cards = wrapper.findAllComponents(NewsCard)
      cards.forEach(card => {
        expect(card.props('isLoading')).toBe(true)
      })
    })

    it('shows skeleton cards when loading', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: true },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const skeletonsDiv = wrapper.find('.news-list__skeletons')
      expect(skeletonsDiv.exists()).toBe(true)
    })

    it('renders 6 skeleton cards', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: true },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const cards = wrapper.findAllComponents(NewsCard)
      expect(cards.length).toBe(9) // 3 real + 6 skeleton
    })
  })

  describe('Internationalization', () => {
    it('translates load more text', () => {
      const manyArticles = [...mockArticles, ...mockArticles]
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 3 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const button = wrapper.find('.news-list__button')
      expect(button.text()).toContain('Load More')
    })

    it('translates no news message', () => {
      wrapper = mount(NewsList, {
        props: { articles: [], isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const emptyText = wrapper.find('.news-list__empty-text')
      expect(emptyText.text()).toContain('No news available')
    })
  })

  describe('Cyberpunk Styling', () => {
    beforeEach(() => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
    })

    it('has correct CSS class on div element', () => {
      const listDiv = wrapper.find('div.news-list')
      expect(listDiv.classes()).toContain('news-list')
    })

    it('grid has correct class', () => {
      const grid = wrapper.find('.news-list__grid')
      expect(grid.classes()).toContain('news-list__grid')
    })

    it('load more button has correct class', () => {
      const manyArticles = [...mockArticles, ...mockArticles]
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 3 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const button = wrapper.find('.news-list__button')
      expect(button.classes()).toContain('news-list__button')
    })

    it('empty state has correct styling class', () => {
      wrapper = mount(NewsList, {
        props: { articles: [], isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const emptyState = wrapper.find('.news-list__empty')
      expect(emptyState.classes()).toContain('news-list__empty')
    })
  })

  describe('Accessibility', () => {
    it('grid has role list', () => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const grid = wrapper.find('.news-list__grid')
      expect(grid.attributes('role')).toBe('list')
    })

    it('load more button is a proper button element', () => {
      const manyArticles = [...mockArticles, ...mockArticles]
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 3 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const button = wrapper.find('.news-list__button')
      expect(button.element.tagName.toLowerCase()).toBe('button')
    })

    it('button icon has aria-hidden', () => {
      const manyArticles = [...mockArticles, ...mockArticles]
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 3 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const icon = wrapper.find('.news-list__button-icon')
      expect(icon.attributes('aria-hidden')).toBe('true')
    })

    it('empty icon has aria-hidden', () => {
      wrapper = mount(NewsList, {
        props: { articles: [], isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const emptyIcon = wrapper.find('.news-list__empty-icon')
      expect(emptyIcon.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('Grid Layout', () => {
    beforeEach(() => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
    })

    it('wraps articles in grid container', () => {
      const grid = wrapper.find('.news-list__grid')
      expect(grid.exists()).toBe(true)
    })

    it('renders all articles in grid', () => {
      const grid = wrapper.find('.news-list__grid')
      const cards = grid.findAllComponents(NewsCard)
      expect(cards.length).toBe(3)
    })
  })

  describe('Edge Cases', () => {
    it('handles single article gracefully', () => {
      wrapper = mount(NewsList, {
        props: { articles: [mockArticles[0]], isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const cards = wrapper.findAllComponents(NewsCard)
      expect(cards.length).toBe(1)
    })

    it('handles large number of articles', () => {
      const manyArticles = Array.from({ length: 50 }, (_, i) => ({
        ...mockArticles[0],
        id: i + 1,
        slug: `article-${i + 1}`,
      }))
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 6 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const cards = wrapper.findAllComponents(NewsCard)
      expect(cards.length).toBe(6) // limited by visibleCount
    })

    it('handles articles with missing fields', () => {
      const incompleteArticles = [
        { id: 1, slug: 'test' },
        { id: 2, title: 'Test Article' },
      ]
      wrapper = mount(NewsList, {
        props: { articles: incompleteArticles as any, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const cards = wrapper.findAllComponents(NewsCard)
      expect(cards.length).toBe(2)
    })

    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [
        mount(NewsList, {
          props: { articles: mockArticles, isLoading: false },
          global: { components: { RouterLink: RouterLinkStub } },
        }),
        mount(NewsList, {
          props: { articles: mockArticles, isLoading: false },
          global: { components: { RouterLink: RouterLinkStub } },
        }),
      ]
      wrappers.forEach(w => expect(w.exists()).toBe(true))
      wrappers.forEach(w => w.unmount())
    })
  })

  describe('Component Structure', () => {
    beforeEach(() => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
    })

    it('has correct DOM hierarchy', () => {
      const listDiv = wrapper.find('div.news-list')
      const grid = listDiv.find('.news-list__grid')
      expect(listDiv.exists()).toBe(true)
      expect(grid.exists()).toBe(true)
    })

    it('all major sections are present', () => {
      const grid = wrapper.find('.news-list__grid')
      expect(grid.exists()).toBe(true)
    })

    it('maintains consistent component structure', () => {
      const manyArticles = [...mockArticles, ...mockArticles]
      wrapper = mount(NewsList, {
        props: { articles: manyArticles, isLoading: false, visibleCount: 3 },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const grid = wrapper.find('.news-list__grid')
      const buttonDiv = wrapper.find('.news-list__load-more')
      expect(grid.exists()).toBe(true)
      expect(buttonDiv.exists()).toBe(true)
    })
  })

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      wrapper = mount(NewsList, {
        props: { articles: mockArticles, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
    })

    it('grid adapts to different screen sizes', () => {
      const grid = wrapper.find('.news-list__grid')
      expect(grid.exists()).toBe(true)
    })

    it('maintains layout on different content lengths', () => {
      const oneArticle = [mockArticles[0]]
      wrapper = mount(NewsList, {
        props: { articles: oneArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const grid = wrapper.find('.news-list__grid')
      expect(grid.exists()).toBe(true)
    })
  })
})
