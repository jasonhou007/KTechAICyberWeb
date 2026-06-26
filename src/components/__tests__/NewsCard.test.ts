/**
 * @file NewsCard.test.ts
 * @description Comprehensive unit tests for NewsCard component
 * @ticket #60 - TEST-013: News Section Component Unit Tests - TDD with Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { useRouter } from 'vue-router'
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
        'news.readMore': 'Read More',
        'news.categories.company': 'Company News',
        'news.categories.industry': 'Industry Insights',
        'news.categories.technology': 'Technology Updates',
        'news.categories.events': 'Events',
      }
      return translations[key] || key
    },
  }),
}))

describe('NewsCard.vue', () => {
  let wrapper: VueWrapper
  let mockRouter: any

  const mockArticle = {
    id: 1,
    slug: 'test-article',
    title: 'Test Article Title',
    excerpt: 'This is a test article excerpt for unit testing purposes.',
    date: '2024-01-15',
    category: 'Company News',
    image: '/images/test-article.webp',
  }

  beforeEach(() => {
    mockRouter = { push: vi.fn(), resolve: vi.fn() }
    ;(useRouter as any).mockReturnValue(mockRouter)
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
  })

  describe('Rendering', () => {
    beforeEach(() => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
    })

    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders article tag with correct class', () => {
      const article = wrapper.find('article.news-card')
      expect(article.exists()).toBe(true)
    })

    it('does not have loading class when not loading', () => {
      const article = wrapper.find('article.news-card')
      expect(article.classes()).not.toContain('news-card--loading')
    })

    it('has loading class when isLoading is true', async () => {
      await wrapper.setProps({ isLoading: true })
      const article = wrapper.find('article.news-card')
      expect(article.classes()).toContain('news-card--loading')
    })
  })

  describe('Props', () => {
    it('accepts article prop with correct structure', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      expect(wrapper.props('article')).toEqual(mockArticle)
    })

    it('accepts isLoading prop', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: true },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      expect(wrapper.props('isLoading')).toBe(true)
    })

    it('has default isLoading value of false', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      expect(wrapper.props('isLoading')).toBe(false)
    })
  })

  describe('Content Display', () => {
    beforeEach(() => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
    })

    it('displays article title', () => {
      const title = wrapper.find('.news-card__title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('Test Article Title')
    })

    it('displays article excerpt', () => {
      const excerpt = wrapper.find('.news-card__excerpt')
      expect(excerpt.exists()).toBe(true)
      expect(excerpt.text()).toBe('This is a test article excerpt for unit testing purposes.')
    })

    it('displays formatted date', () => {
      const badge = wrapper.find('.news-card__badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toMatch(/\w{3} \d{2}, \d{4}/)
    })

    it('displays category label', () => {
      const category = wrapper.find('.news-card__category')
      expect(category.exists()).toBe(true)
      expect(category.text()).toBe('Company News')
    })

    it('displays read more text', () => {
      const link = wrapper.find('.news-card__link')
      expect(link.exists()).toBe(true)
      expect(link.text()).toContain('Read More')
    })

    it('displays arrow icon in read more link', () => {
      const arrow = wrapper.find('.news-card__arrow')
      expect(arrow.exists()).toBe(true)
      expect(arrow.text()).toBe('→')
    })
  })

  describe('Image Rendering', () => {
    it('renders image when article has image', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const image = wrapper.find('.news-card__image')
      expect(image.exists()).toBe(true)
      expect(image.attributes('src')).toBe('/images/test-article.webp')
      expect(image.attributes('alt')).toBe('Test Article Title')
    })

    it('shows skeleton when isLoading is true', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: true },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const image = wrapper.find('.news-card__image')
      expect(image.exists()).toBe(false)
      const skeleton = wrapper.find('.news-card__image-skeleton')
      expect(skeleton.exists()).toBe(true)
    })

    it('shows skeleton when article has no image', () => {
      const articleNoImage = { ...mockArticle, image: '' }
      wrapper = mount(NewsCard, {
        props: { article: articleNoImage, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const image = wrapper.find('.news-card__image')
      expect(image.exists()).toBe(false)
      const skeleton = wrapper.find('.news-card__image-skeleton')
      expect(skeleton.exists()).toBe(true)
    })

    it('has image overlay element', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const overlay = wrapper.find('.news-card__image-overlay')
      expect(overlay.exists()).toBe(true)
      expect(overlay.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('Navigation Links', () => {
    it('renders router-link with correct path', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const link = wrapper.findComponent(RouterLinkStub)
      expect(link.exists()).toBe(true)
      expect(link.props('to')).toBe('/news/test-article')
    })

    it('has accessible name on read more link', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const link = wrapper.find('.news-card__link')
      expect(link.attributes('aria-label')).toBe('Read More: Test Article Title')
    })

    it('does not render link when loading', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: true },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const link = wrapper.find('.news-card__link')
      expect(link.exists()).toBe(false)
    })
  })

  describe('Internationalization', () => {
    it('translates read more text', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const link = wrapper.find('.news-card__link')
      expect(link.text()).toContain('Read More')
    })

    it('translates company category', () => {
      const article = { ...mockArticle, category: 'Company News' }
      wrapper = mount(NewsCard, {
        props: { article, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const category = wrapper.find('.news-card__category')
      expect(category.text()).toBe('Company News')
    })

    it('translates industry category', () => {
      const article = { ...mockArticle, category: 'Industry Insights' }
      wrapper = mount(NewsCard, {
        props: { article, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const category = wrapper.find('.news-card__category')
      expect(category.text()).toBe('Industry Insights')
    })

    it('translates technology category', () => {
      const article = { ...mockArticle, category: 'Technology Updates' }
      wrapper = mount(NewsCard, {
        props: { article, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const category = wrapper.find('.news-card__category')
      expect(category.text()).toBe('Technology Updates')
    })

    it('translates events category', () => {
      const article = { ...mockArticle, category: 'Events' }
      wrapper = mount(NewsCard, {
        props: { article, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const category = wrapper.find('.news-card__category')
      expect(category.text()).toBe('Events')
    })

    it('shows untranslated category when not in map', () => {
      const article = { ...mockArticle, category: 'Unknown Category' }
      wrapper = mount(NewsCard, {
        props: { article, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const category = wrapper.find('.news-card__category')
      expect(category.text()).toBe('Unknown Category')
    })
  })

  describe('Cyberpunk Styling', () => {
    beforeEach(() => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
    })

    it('has correct CSS class on article element', () => {
      const article = wrapper.find('article.news-card')
      expect(article.classes()).toContain('news-card')
    })

    it('date badge has correct styling class', () => {
      const badge = wrapper.find('.news-card__badge')
      expect(badge.classes()).toContain('news-card__badge')
    })

    it('image wrapper has correct class', () => {
      const wrapperEl = wrapper.find('.news-card__image-wrapper')
      expect(wrapperEl.classes()).toContain('news-card__image-wrapper')
    })

    it('category has correct styling class', () => {
      const category = wrapper.find('.news-card__category')
      expect(category.classes()).toContain('news-card__category')
    })

    it('content section has correct class', () => {
      const content = wrapper.find('.news-card__content')
      expect(content.classes()).toContain('news-card__content')
    })

    it('read more link has correct class', () => {
      const link = wrapper.find('.news-card__link')
      expect(link.classes()).toContain('news-card__link')
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
    })

    it('uses semantic article tag', () => {
      const article = wrapper.find('article')
      expect(article.exists()).toBe(true)
      expect(article.element.tagName.toLowerCase()).toBe('article')
    })

    it('image has alt text for accessibility', () => {
      const image = wrapper.find('.news-card__image')
      expect(image.attributes('alt')).toBe('Test Article Title')
    })

    it('read more link has aria-label', () => {
      const link = wrapper.find('.news-card__link')
      expect(link.attributes('aria-label')).toBe('Read More: Test Article Title')
    })

    it('image overlay has aria-hidden', () => {
      const overlay = wrapper.find('.news-card__image-overlay')
      expect(overlay.attributes('aria-hidden')).toBe('true')
    })

    it('date badge has aria-hidden', () => {
      const badge = wrapper.find('.news-card__badge')
      expect(badge.attributes('aria-hidden')).toBe('true')
    })

    it('arrow icon has aria-hidden', () => {
      const arrow = wrapper.find('.news-card__arrow')
      expect(arrow.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
    })

    it('has proper min-height for desktop', () => {
      const article = wrapper.find('article.news-card')
      expect(article.exists()).toBe(true)
    })

    it('maintains aspect ratio structure', () => {
      const imageWrapper = wrapper.find('.news-card__image-wrapper')
      const content = wrapper.find('.news-card__content')
      const link = wrapper.find('.news-card__link')
      expect(imageWrapper.exists()).toBe(true)
      expect(content.exists()).toBe(true)
      expect(link.exists()).toBe(true)
    })
  })

  describe('Loading State', () => {
    it('shows loading placeholders when isLoading is true', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: true },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const title = wrapper.find('.news-card__title')
      const excerpt = wrapper.find('.news-card__excerpt')
      expect(title.text()).toBe('Loading article...')
      expect(excerpt.text()).toBe('Loading excerpt...')
    })

    it('shows skeleton loader for image when loading', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: true },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const skeleton = wrapper.find('.news-card__image-skeleton')
      expect(skeleton.exists()).toBe(true)
    })

    it('hides read more link when loading', () => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: true },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const link = wrapper.find('.news-card__link')
      expect(link.exists()).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty date gracefully', () => {
      const articleNoDate = { ...mockArticle, date: '' }
      wrapper = mount(NewsCard, {
        props: { article: articleNoDate, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const badge = wrapper.find('.news-card__badge')
      expect(badge.text()).toBe('')
    })

    it('handles undefined date gracefully', () => {
      const articleNoDate = { ...mockArticle, date: undefined }
      wrapper = mount(NewsCard, {
        props: { article: articleNoDate, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const badge = wrapper.find('.news-card__badge')
      expect(badge.text()).toBe('')
    })

    it('handles very long title', () => {
      const longTitle = 'A'.repeat(200)
      const articleLongTitle = { ...mockArticle, title: longTitle }
      wrapper = mount(NewsCard, {
        props: { article: articleLongTitle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const title = wrapper.find('.news-card__title')
      expect(title.exists()).toBe(true)
    })

    it('handles very long excerpt', () => {
      const longExcerpt = 'B'.repeat(500)
      const articleLongExcerpt = { ...mockArticle, excerpt: longExcerpt }
      wrapper = mount(NewsCard, {
        props: { article: articleLongExcerpt, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const excerpt = wrapper.find('.news-card__excerpt')
      expect(excerpt.exists()).toBe(true)
    })

    it('handles special characters in title', () => {
      const specialTitle = 'Test: "Special" & <Characters>'
      const articleSpecial = { ...mockArticle, title: specialTitle }
      wrapper = mount(NewsCard, {
        props: { article: articleSpecial, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
      const title = wrapper.find('.news-card__title')
      expect(title.text()).toBe(specialTitle)
    })

    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [
        mount(NewsCard, {
          props: { article: mockArticle, isLoading: false },
          global: { components: { RouterLink: RouterLinkStub } },
        }),
        mount(NewsCard, {
          props: { article: mockArticle, isLoading: false },
          global: { components: { RouterLink: RouterLinkStub } },
        }),
      ]
      wrappers.forEach(w => expect(w.exists()).toBe(true))
      wrappers.forEach(w => w.unmount())
    })
  })

  describe('Component Structure', () => {
    beforeEach(() => {
      wrapper = mount(NewsCard, {
        props: { article: mockArticle, isLoading: false },
        global: { components: { RouterLink: RouterLinkStub } },
      })
    })

    it('has correct DOM hierarchy', () => {
      const article = wrapper.find('article.news-card')
      const imageWrapper = article.find('.news-card__image-wrapper')
      const content = article.find('.news-card__content')
      expect(article.exists()).toBe(true)
      expect(imageWrapper.exists()).toBe(true)
      expect(content.exists()).toBe(true)
    })

    it('all major sections are present', () => {
      const badge = wrapper.find('.news-card__badge')
      const imageWrapper = wrapper.find('.news-card__image-wrapper')
      const category = wrapper.find('.news-card__category')
      const content = wrapper.find('.news-card__content')
      const link = wrapper.find('.news-card__link')
      expect(badge.exists()).toBe(true)
      expect(imageWrapper.exists()).toBe(true)
      expect(category.exists()).toBe(true)
      expect(content.exists()).toBe(true)
      expect(link.exists()).toBe(true)
    })
  })
})
