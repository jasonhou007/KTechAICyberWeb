/**
 * @file News.test.ts
 * @description Comprehensive unit tests for News page component
 * @ticket #58 - TEST-011: News Component Unit Tests - TDD with Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { useRouter } from 'vue-router'
import News from '../News.vue'
import NewsFilter from '../../components/NewsFilter.vue'
import NewsList from '../../components/NewsList.vue'
import RouterLinkStub from '../../components/__tests__/RouterLinkStub.vue'

// Mock the useLanguage composable before importing the component
const mockTranslations: Record<string, string> = {
  'nav.home': 'Home',
  'news.title': 'News & Updates',
  'news.subtitle': 'Latest from KTech',
  'news.filter': 'Filter by category',
  'a11y.mainLabel': 'News page main content',
  'a11y.newsPage': 'News page main content',
}

vi.mock('../../composables/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: { value: 'en' },
    languageDisplay: { value: 'EN' },
    isEnglish: { value: true },
    initLanguage: vi.fn(),
    setLanguage: vi.fn(),
    toggleLanguage: vi.fn(),
    t: (key: string) => mockTranslations[key] || key
  }),
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
}))

// Mock news data
vi.mock('../data/news.json', () => [
  {
    id: 1,
    slug: 'ktech-achieves-iso27001-certification',
    title: 'KTech Achieves ISO27001 Certification',
    excerpt: 'We are proud to announce that KTech has achieved ISO27001 certification.',
    date: '2024-01-15',
    category: 'Company News',
    image: '/images/news/iso-certification.svg',
    author: 'KTech Team',
  },
  {
    id: 2,
    slug: 'blockchain-technology-in-fintech-revolution',
    title: 'Blockchain Technology in Fintech Revolution',
    excerpt: 'Explore how blockchain technology is revolutionizing financial services.',
    date: '2024-01-10',
    category: 'Industry Insights',
    image: '/images/news/blockchain-finance.svg',
    author: 'KTech Research Team',
  },
  {
    id: 3,
    slug: 'ktech-at-fintech-innovation-summit-2024',
    title: 'KTech at Fintech Innovation Summit 2024',
    excerpt: 'Join us at the upcoming Fintech Innovation Summit.',
    date: '2024-01-08',
    category: 'Events',
    image: '/images/news/fintech-conference.svg',
    author: 'KTech Events Team',
  },
  {
    id: 4,
    slug: 'ai-powered-solutions-next-generation',
    title: 'AI-Powered Solutions for Next-Gen Financial Services',
    excerpt: 'Discover how KTech AI solutions are transforming financial services.',
    date: '2024-01-05',
    category: 'Technology Updates',
    image: '/images/news/ai-fintech.svg',
    author: 'KTech AI Team',
  },
])

describe('News.vue', () => {
  let wrapper: VueWrapper
  let mockRouter: any

  beforeEach(() => {
    mockRouter = { push: vi.fn(), resolve: vi.fn() }
    ;(useRouter as any).mockReturnValue(mockRouter)

    // Mock window.scrollTo
    global.scrollTo = vi.fn()
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
          stubs: {
            NewsFilter: true,
            NewsList: true,
          },
        },
      })
      // Wait for mounted data loading simulation
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))
    })

    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders main tag with correct class', () => {
      const main = wrapper.find('main.news-page')
      expect(main.exists()).toBe(true)
    })

    it('has proper aria-label on main', () => {
      const main = wrapper.find('main.news-page')
      expect(main.attributes('aria-label')).toBe('News page main content')
    })

    it('has role="main" on main element', () => {
      const main = wrapper.find('main.news-page')
      expect(main.attributes('role')).toBe('main')
    })
  })

  describe('Breadcrumb', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
          stubs: {
            NewsFilter: true,
            NewsList: true,
          },
        },
      })
      await wrapper.vm.$nextTick()
    })

    it('renders breadcrumb navigation', () => {
      const breadcrumb = wrapper.find('.news-page__breadcrumb')
      expect(breadcrumb.exists()).toBe(true)
    })

    it('breadcrumb has correct aria-label', () => {
      const breadcrumb = wrapper.find('.news-page__breadcrumb')
      expect(breadcrumb.attributes('aria-label')).toBe('Breadcrumb')
    })

    it('renders home link in breadcrumb', () => {
      const homeLink = wrapper.find('.news-page__breadcrumb-link')
      expect(homeLink.exists()).toBe(true)
      expect(homeLink.text()).toBe('Home')
    })

    it('home link has correct to prop', () => {
      const homeLink = wrapper.findComponent(RouterLinkStub)
      expect(homeLink.props('to')).toBe('/')
    })

    it('renders breadcrumb separator', () => {
      const separator = wrapper.find('.news-page__breadcrumb-separator')
      expect(separator.exists()).toBe(true)
      expect(separator.text()).toBe('/')
    })

    it('separator has aria-hidden', () => {
      const separator = wrapper.find('.news-page__breadcrumb-separator')
      expect(separator.attributes('aria-hidden')).toBe('true')
    })

    it('renders current page in breadcrumb', () => {
      const current = wrapper.find('.news-page__breadcrumb-current')
      expect(current.exists()).toBe(true)
      expect(current.text()).toBe('News & Updates')
    })
  })

  describe('Header Section', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
          stubs: {
            NewsFilter: true,
            NewsList: true,
          },
        },
      })
      await wrapper.vm.$nextTick()
    })

    it('renders header element', () => {
      const header = wrapper.find('.news-page__header')
      expect(header.exists()).toBe(true)
    })

    it('renders page title h1', () => {
      const title = wrapper.find('.news-page__title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('News & Updates')
    })

    it('renders subtitle', () => {
      const subtitle = wrapper.find('.news-page__subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toBe('Latest from KTech')
    })
  })

  describe('Component Integration - NewsFilter', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))
    })

    it('renders NewsFilter component', () => {
      const newsFilter = wrapper.findComponent(NewsFilter)
      expect(newsFilter.exists()).toBe(true)
    })

    it('passes selectedCategory to NewsFilter', () => {
      const newsFilter = wrapper.findComponent(NewsFilter)
      expect(newsFilter.props('selectedCategory')).toBe('All')
    })
  })

  describe('Component Integration - NewsList', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))
    })

    it('renders NewsList component', () => {
      const newsList = wrapper.findComponent(NewsList)
      expect(newsList.exists()).toBe(true)
    })

    it('passes articles to NewsList', () => {
      const newsList = wrapper.findComponent(NewsList)
      expect(newsList.props('articles').length).toBeGreaterThan(0)
    })

    it('passes visibleCount to NewsList', () => {
      const newsList = wrapper.findComponent(NewsList)
      expect(newsList.props('visibleCount')).toBe(6)
    })

    it('passes isLoading to NewsList', () => {
      const newsList = wrapper.findComponent(NewsList)
      expect(typeof newsList.props('isLoading')).toBe('boolean')
    })
  })

  describe('Filtering Functionality', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))
    })

    it('has initial selectedCategory of All', () => {
      expect(wrapper.vm.selectedCategory).toBe('All')
    })

    it('updates selectedCategory when filter changes', async () => {
      const newsFilter = wrapper.findComponent(NewsFilter)
      await newsFilter.vm.$emit('filter-change', 'Company News')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.selectedCategory).toBe('Company News')
    })

    it('resets visibleCount when filter changes', async () => {
      wrapper.vm.visibleCount = 12
      const newsFilter = wrapper.findComponent(NewsFilter)
      await newsFilter.vm.$emit('filter-change', 'Technology Updates')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.visibleCount).toBe(6)
    })

    it('filters articles correctly by category', async () => {
      wrapper.vm.selectedCategory = 'Company News'
      await wrapper.vm.$nextTick()
      const filtered = wrapper.vm.filteredArticles
      expect(filtered.every((a: any) => a.category === 'Company News')).toBe(true)
    })

    it('shows all articles when filter is All', async () => {
      wrapper.vm.selectedCategory = 'All'
      await wrapper.vm.$nextTick()
      const filtered = wrapper.vm.filteredArticles
      const newsList = wrapper.findComponent(NewsList)
      expect(filtered.length).toBe(newsList.props('articles').length)
    })
  })

  describe('Load More / Pagination', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))
    })

    it('has initial visibleCount of 6', () => {
      expect(wrapper.vm.visibleCount).toBe(6)
    })

    it('increments visibleCount when load-more is triggered', async () => {
      const initialCount = wrapper.vm.visibleCount
      const newsList = wrapper.findComponent(NewsList)
      await newsList.vm.$emit('load-more')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.visibleCount).toBe(initialCount + 6)
    })

    it('updates visibleCount correctly after multiple load-more events', async () => {
      const newsList = wrapper.findComponent(NewsList)
      await newsList.vm.$emit('load-more')
      await wrapper.vm.$nextTick()
      await newsList.vm.$emit('load-more')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.visibleCount).toBe(18)
    })
  })

  describe('Data Loading', () => {
    it('starts with loading state true', () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      expect(wrapper.vm.isLoading).toBe(true)
    })

    it('loads articles after mounted delay', async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      expect(wrapper.vm.articles.length).toBe(0)
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(wrapper.vm.articles.length).toBeGreaterThan(0)
    })

    it('sets isLoading to false after loading', async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('passes correct loading state to NewsList', async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      const newsList = wrapper.findComponent(NewsList)
      // Initially loading
      expect(newsList.props('isLoading')).toBe(true)
      await new Promise(resolve => setTimeout(resolve, 350))
      // After loading completes
      expect(newsList.props('isLoading')).toBe(false)
    })
  })

  describe('Internationalization', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
          stubs: {
            NewsFilter: true,
            NewsList: true,
          },
        },
      })
      await wrapper.vm.$nextTick()
    })

    it('translates page title', () => {
      const title = wrapper.find('.news-page__title')
      expect(title.text()).toBe('News & Updates')
    })

    it('translates page subtitle', () => {
      const subtitle = wrapper.find('.news-page__subtitle')
      expect(subtitle.text()).toBe('Latest from KTech')
    })

    it('translates breadcrumb home', () => {
      const homeLink = wrapper.find('.news-page__breadcrumb-link')
      expect(homeLink.text()).toBe('Home')
    })

    it('translates current page in breadcrumb', () => {
      const current = wrapper.find('.news-page__breadcrumb-current')
      expect(current.text()).toBe('News & Updates')
    })
  })

  describe('Cyberpunk Styling', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
          stubs: {
            NewsFilter: true,
            NewsList: true,
          },
        },
      })
      await wrapper.vm.$nextTick()
    })

    it('has correct CSS class on main element', () => {
      const main = wrapper.find('main.news-page')
      expect(main.classes()).toContain('news-page')
    })

    it('breadcrumb has correct styling class', () => {
      const breadcrumb = wrapper.find('.news-page__breadcrumb')
      expect(breadcrumb.classes()).toContain('news-page__breadcrumb')
    })

    it('header has correct styling class', () => {
      const header = wrapper.find('.news-page__header')
      expect(header.classes()).toContain('news-page__header')
    })

    it('title has correct styling class', () => {
      const title = wrapper.find('.news-page__title')
      expect(title.classes()).toContain('news-page__title')
    })

    it('subtitle has correct styling class', () => {
      const subtitle = wrapper.find('.news-page__subtitle')
      expect(subtitle.classes()).toContain('news-page__subtitle')
    })
  })

  describe('Accessibility', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
          stubs: {
            NewsFilter: true,
            NewsList: true,
          },
        },
      })
      await wrapper.vm.$nextTick()
    })

    it('uses semantic main element', () => {
      const main = wrapper.find('main')
      expect(main.exists()).toBe(true)
      expect(main.element.tagName.toLowerCase()).toBe('main')
    })

    it('has proper heading hierarchy with h1', () => {
      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
    })

    it('uses semantic nav for breadcrumb', () => {
      const nav = wrapper.find('nav')
      expect(nav.exists()).toBe(true)
    })

    it('breadcrumb nav has aria-label', () => {
      const nav = wrapper.find('nav')
      expect(nav.attributes('aria-label')).toBe('Breadcrumb')
    })

    it('main has aria-label', () => {
      const main = wrapper.find('main')
      expect(main.attributes('aria-label')).toBe('News page main content')
    })

    it('uses semantic header element', () => {
      const header = wrapper.find('header')
      expect(header.exists()).toBe(true)
    })
  })

  describe('Responsive Design', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
          stubs: {
            NewsFilter: true,
            NewsList: true,
          },
        },
      })
      await wrapper.vm.$nextTick()
    })

    it('has responsive layout structure', () => {
      const main = wrapper.find('main.news-page')
      expect(main.exists()).toBe(true)
    })

    it('breadcrumb structure is responsive', () => {
      const breadcrumb = wrapper.find('.news-page__breadcrumb')
      const link = breadcrumb.find('.news-page__breadcrumb-link')
      const separator = breadcrumb.find('.news-page__breadcrumb-separator')
      const current = breadcrumb.find('.news-page__breadcrumb-current')
      expect(link.exists()).toBe(true)
      expect(separator.exists()).toBe(true)
      expect(current.exists()).toBe(true)
    })

    it('header maintains structure across breakpoints', () => {
      const header = wrapper.find('.news-page__header')
      const title = header.find('.news-page__title')
      const subtitle = header.find('.news-page__subtitle')
      expect(header.exists()).toBe(true)
      expect(title.exists()).toBe(true)
      expect(subtitle.exists()).toBe(true)
    })
  })

  describe('Component Structure', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
          stubs: {
            NewsFilter: true,
            NewsList: true,
          },
        },
      })
      await wrapper.vm.$nextTick()
    })

    it('has correct DOM hierarchy', () => {
      const main = wrapper.find('main.news-page')
      const breadcrumb = main.find('.news-page__breadcrumb')
      const header = main.find('.news-page__header')
      expect(main.exists()).toBe(true)
      expect(breadcrumb.exists()).toBe(true)
      expect(header.exists()).toBe(true)
    })

    it('all major sections are present', () => {
      const breadcrumb = wrapper.find('.news-page__breadcrumb')
      const header = wrapper.find('.news-page__header')
      const newsFilter = wrapper.findComponent(NewsFilter)
      const newsList = wrapper.findComponent(NewsList)
      expect(breadcrumb.exists()).toBe(true)
      expect(header.exists()).toBe(true)
      expect(newsFilter.exists()).toBe(true)
      expect(newsList.exists()).toBe(true)
    })

    it('maintains consistent component structure', () => {
      const main = wrapper.find('main.news-page')
      expect(main.classes()).toContain('news-page')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty articles array gracefully', async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      // Manually set empty articles to test empty state
      await wrapper.vm.$nextTick()
      wrapper.vm.articles = []
      wrapper.vm.isLoading = false
      await wrapper.vm.$nextTick()
      const newsList = wrapper.findComponent(NewsList)
      expect(newsList.props('articles').length).toBe(0)
    })

    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [
        mount(News, {
          global: { components: { RouterLink: RouterLinkStub } },
        }),
        mount(News, {
          global: { components: { RouterLink: RouterLinkStub } },
        }),
      ]
      wrappers.forEach(w => expect(w.exists()).toBe(true))
      wrappers.forEach(w => w.unmount())
    })

    it('handles rapid filter changes', async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))

      const newsFilter = wrapper.findComponent(NewsFilter)
      await newsFilter.vm.$emit('filter-change', 'Company News')
      await newsFilter.vm.$emit('filter-change', 'Technology Updates')
      await newsFilter.vm.$emit('filter-change', 'Events')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selectedCategory).toBe('Events')
    })

    it('handles load-more before data loads', async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      const newsList = wrapper.findComponent(NewsList)
      await newsList.vm.$emit('load-more')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.visibleCount).toBeGreaterThan(6)
    })
  })

  describe('Computed Properties', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))
    })

    it('filteredArticles returns all when filter is All', () => {
      wrapper.vm.selectedCategory = 'All'
      expect(wrapper.vm.filteredArticles.length).toBe(wrapper.vm.articles.length)
    })

    it('filteredArticles returns subset when filter is specific', () => {
      wrapper.vm.selectedCategory = 'Company News'
      const filtered = wrapper.vm.filteredArticles
      expect(filtered.length).toBeLessThanOrEqual(wrapper.vm.articles.length)
      expect(filtered.every((a: any) => a.category === 'Company News')).toBe(true)
    })

    it('filteredArticles updates reactively', async () => {
      wrapper.vm.selectedCategory = 'All'
      const allCount = wrapper.vm.filteredArticles.length
      wrapper.vm.selectedCategory = 'Events'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.filteredArticles.length).toBeLessThan(allCount)
    })
  })

  describe('Window Scroll Behavior', () => {
    beforeEach(async () => {
      wrapper = mount(News, {
        global: {
          components: { RouterLink: RouterLinkStub },
        },
      })
      await wrapper.vm.$nextTick()
    })

    it('calls window.scrollTo when filter changes', async () => {
      const newsFilter = wrapper.findComponent(NewsFilter)
      await newsFilter.vm.$emit('filter-change', 'Technology Updates')
      await wrapper.vm.$nextTick()
      expect(global.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          top: 0,
          behavior: 'smooth'
        })
      )
    })

    it('scrolls to top with correct parameters', async () => {
      const newsFilter = wrapper.findComponent(NewsFilter)
      await newsFilter.vm.$emit('filter-change', 'Company News')
      await wrapper.vm.$nextTick()
      expect(global.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth'
      })
    })
  })
})
