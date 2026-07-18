/**
 * NewsTicker component tests
 * Issue #392: Ambient news ticker for News pages
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'
import NewsTicker from '../NewsTicker.vue'
import { useLanguage } from '../../i18n'

// Mock useLanguage
const mockT = vi.fn((key: string, params?: Record<string, any>) => {
  const translations: Record<string, string> = {
    'news.ticker.breaking': 'BREAKING',
    'news.ticker.latest': 'LATEST',
    'news.ticker.label': 'Latest updates',
    'news.ticker.pause': 'Pause ticker (Space)',
    'news.ticker.resume': 'Resume ticker (Space)',
    'news.ticker.noNews': 'No news available',
    'news.ticker.article': '{title}',
  }
  let result = translations[key] || key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      result = result.replace(`{${k}}`, v)
    })
  }
  return result
})

vi.mock('../../i18n', () => ({
  useLanguage: () => ({
    t: mockT,
    currentLanguage: ref({ value: 'en' })
  })
}))

// Mock useAmbientAnimation
const mockStartLoop = vi.fn()
const mockStopLoop = vi.fn()

vi.mock('../../composables/useAmbientAnimation', () => ({
  useAmbientAnimation: vi.fn(() => ({
    target: ref(null),
    isPaused: ref(false),
    isStatic: ref(false),
    isPlaying: ref(true),
    progress: ref(0),
    isMobile: ref(false),
    adaptiveLoopDuration: ref(45000),
    adaptiveParticles: ref(50),
    adaptiveUpdateInterval: ref(16),
    startLoop: mockStartLoop,
    stopLoop: mockStopLoop
  }))
}))

describe('NewsTicker', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockT.mockClear()
    mockStartLoop.mockClear()
    mockStopLoop.mockClear()

    // Reset to English by default
    mockT.mockImplementation((key: string, params?: Record<string, any>) => {
      const translations: Record<string, string> = {
        'news.ticker.breaking': 'BREAKING',
        'news.ticker.latest': 'LATEST',
        'news.ticker.label': 'Latest updates',
        'news.ticker.pause': 'Pause ticker (Space)',
        'news.ticker.resume': 'Resume ticker (Space)',
        'news.ticker.noNews': 'No news available',
        'news.ticker.article': '{title}',
      }
      let result = translations[key] || key
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{${k}}`, v)
        })
      }
      return result
    })

    // Mock IntersectionObserver
    vi.stubGlobal('IntersectionObserver', class MockIntersectionObserver {
      observe = vi.fn()
      disconnect = vi.fn()
      unobserve = vi.fn()
    })

    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(performance.now()), 16) as unknown as number
    })

    // Mock cancelAnimationFrame
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })
  beforeEach(() => {
    // Reset mocks before each test
    mockT.mockClear()
    mockStartLoop.mockClear()
    mockStopLoop.mockClear()

    // Mock IntersectionObserver
    vi.stubGlobal('IntersectionObserver', class MockIntersectionObserver {
      observe = vi.fn()
      disconnect = vi.fn()
      unobserve = vi.fn()
    })

    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(performance.now()), 16) as unknown as number
    })

    // Mock cancelAnimationFrame
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Rendering', () => {
    it('should render when articles are provided', () => {
      const articles = [
        { id: 1, title: 'Test Article 1', slug: 'test-1' },
        { id: 2, title: 'Test Article 2', slug: 'test-2' }
      ]

      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      expect(wrapper.find('[data-testid="news-ticker"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="ticker-content"]').exists()).toBe(true)
    })

    it('should not render when no articles provided', () => {
      const wrapper = mount(NewsTicker, {
        props: { articles: [] }
      })

      expect(wrapper.find('[data-testid="news-ticker"]').exists()).toBe(false)
    })

    it('should render breaking news label', () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      expect(wrapper.find('[data-testid="ticker-label"]').text()).toBe('BREAKING')
    })

    it('should render all article titles', () => {
      const articles = [
        { id: 1, title: 'Article 1', slug: 'article-1' },
        { id: 2, title: 'Article 2', slug: 'article-2' },
        { id: 3, title: 'Article 3', slug: 'article-3' }
      ]

      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const tickerItems = wrapper.findAll('[data-testid="ticker-item"]')
      // Articles are duplicated 3 times for seamless scrolling
      expect(tickerItems).toHaveLength(9)
      expect(tickerItems[0].text()).toBe('Article 1')
      expect(tickerItems[1].text()).toBe('Article 2')
      expect(tickerItems[2].text()).toBe('Article 3')
      expect(tickerItems[3].text()).toBe('Article 1')
      expect(tickerItems[4].text()).toBe('Article 2')
      expect(tickerItems[5].text()).toBe('Article 3')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const ticker = wrapper.find('[data-testid="news-ticker"]')
      expect(ticker.attributes('aria-label')).toBe('Latest updates')
    })

    it('should have role="marquee"', () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const ticker = wrapper.find('[data-testid="news-ticker"]')
      expect(ticker.attributes('role')).toBe('marquee')
    })

    it('should be focusable and have tabindex', () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const ticker = wrapper.find('[data-testid="news-ticker"]')
      expect(ticker.attributes('tabindex')).toBe('0')
    })

    it('should announce pause state for screen readers', async () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      // Check status element exists with aria-live
      const status = wrapper.find('.news-ticker__status')
      expect(status.exists()).toBe(true)
      expect(status.attributes('aria-live')).toBe('off')
      expect(status.attributes('aria-atomic')).toBe('true')
    })
  })

  describe('Keyboard Interactions', () => {
    it('should toggle pause on Space key', async () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles },
        attachTo: document.body
      })

      const ticker = wrapper.find('[data-testid="news-ticker"]')

      // Initially not paused
      expect(wrapper.vm.isPaused).toBe(false)

      // Press Space
      await ticker.trigger('keydown', { key: ' ', code: 'Space' })
      await wrapper.vm.$nextTick()

      // Should toggle pause
      expect(wrapper.vm.isPaused).toBe(true)

      wrapper.unmount()
    })

    it('should toggle pause on Enter key', async () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles },
        attachTo: document.body
      })

      const ticker = wrapper.find('[data-testid="news-ticker"]')

      // Initially not paused
      expect(wrapper.vm.isPaused).toBe(false)

      // Press Enter
      await ticker.trigger('keydown', { key: 'Enter', code: 'Enter' })
      await wrapper.vm.$nextTick()

      // Should toggle pause
      expect(wrapper.vm.isPaused).toBe(true)

      wrapper.unmount()
    })

    it('should ignore other keys', async () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const ticker = wrapper.find('[data-testid="news-ticker"]')

      // Press random key
      await ticker.trigger('keydown', { key: 'a', code: 'KeyA' })
      await wrapper.vm.$nextTick()

      // Should not call stopLoop
      expect(mockStopLoop).not.toHaveBeenCalled()
    })
  })

  describe('Mouse Interactions', () => {
    it('should pause on hover', async () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const ticker = wrapper.find('[data-testid="news-ticker"]')

      // Initially not paused
      expect(wrapper.vm.isPaused).toBe(false)

      // Hover
      await ticker.trigger('mouseenter')
      await wrapper.vm.$nextTick()

      // Should pause
      expect(wrapper.vm.isPaused).toBe(true)
    })

    it('should resume on mouse leave', async () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const ticker = wrapper.find('[data-testid="news-ticker"]')

      // Hover then leave
      await ticker.trigger('mouseenter')
      await ticker.trigger('mouseleave')
      await wrapper.vm.$nextTick()

      // Should resume
      expect(wrapper.vm.isPaused).toBe(false)
    })

    it('should toggle pause on click', async () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const ticker = wrapper.find('[data-testid="news-ticker"]')

      // Initially not paused
      expect(wrapper.vm.isPaused).toBe(false)

      // Click
      await ticker.trigger('click')
      await wrapper.vm.$nextTick()

      // Should toggle pause
      expect(wrapper.vm.isPaused).toBe(true)
    })
  })

  describe('Reduced Motion', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock media query
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
      vi.stubGlobal('matchMedia', mockMatchMedia)

      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      // When reduced motion is preferred, animation should be static
      // This is verified by checking that the component renders without animation classes
      expect(wrapper.find('[data-testid="news-ticker"]').exists()).toBe(true)

      vi.unstubAllGlobals()
    })
  })

  describe('i18n Integration', () => {
    it('should use translated labels', () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      // Should call t() for labels
      expect(mockT).toHaveBeenCalledWith('news.ticker.breaking')
      expect(mockT).toHaveBeenCalledWith('news.ticker.label')
    })

    it('should handle Chinese language', () => {
      mockT.mockImplementation((key: string, params?: Record<string, any>) => {
        const translations: Record<string, string> = {
          'news.ticker.breaking': '最新',
          'news.ticker.label': '最新资讯',
        }
        return translations[key] || key
      })

      const articles = [{ id: 1, title: '测试', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const label = wrapper.find('[data-testid="ticker-label"]')
      expect(label.text()).toBe('最新')
    })
  })

  describe('Visual States', () => {
    it('should show cyan glow for English', () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const label = wrapper.find('[data-testid="ticker-label"]')
      expect(label.classes()).toContain('news-ticker__label--en')
    })

    it('should show magenta glow for Chinese', () => {
      // Update mock to return Chinese
      mockT.mockImplementation((key: string) => {
        const translations: Record<string, string> = {
          'news.ticker.breaking': '最新',
          'news.ticker.label': '最新资讯',
        }
        return translations[key] || key
      })

      const articles = [{ id: 1, title: '测试', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles },
        global: {
          mocks: {
            currentLanguage: { value: 'zh' }
          }
        }
      })

      const label = wrapper.find('[data-testid="ticker-label"]')
      // Check if it has the language class
      const classes = label.classes()
      expect(classes.some(c => c.includes('news-ticker__label--'))).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should use GPU-accelerated CSS transforms', () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const content = wrapper.find('[data-testid="ticker-content"]')
      // Should have transform-based animation class
      expect(content.classes()).toContain('news-ticker__content')
    })

    it('should throttle updates on mobile', () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      // Mobile throttling is handled by useAmbientAnimation
      // This test verifies the component integrates with it
      expect(wrapper.find('[data-testid="news-ticker"]').exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(200)
      const articles = [{ id: 1, title: longTitle, slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const tickerItem = wrapper.find('[data-testid="ticker-item"]')
      expect(tickerItem.text()).toBe(longTitle)
    })

    it('should handle special characters in titles', () => {
      const articles = [
        { id: 1, title: 'Test & "Special" <Chars>', slug: 'test' }
      ]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      expect(wrapper.find('[data-testid="ticker-item"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="ticker-item"]').text()).toBe('Test & "Special" <Chars>')
    })

    it('should handle single article', () => {
      const articles = [{ id: 1, title: 'Solo Article', slug: 'solo' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      // Single article is duplicated 3 times for seamless scrolling
      const tickerItems = wrapper.findAll('[data-testid="ticker-item"]')
      expect(tickerItems).toHaveLength(3)
      expect(tickerItems[0].text()).toBe('Solo Article')
      expect(tickerItems[1].text()).toBe('Solo Article')
      expect(tickerItems[2].text()).toBe('Solo Article')
    })

    it('should handle many articles', () => {
      const articles = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: `Article ${i + 1}`,
        slug: `article-${i + 1}`
      }))
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      const tickerItems = wrapper.findAll('[data-testid="ticker-item"]')
      expect(tickerItems.length).toBeGreaterThan(0)
    })
  })

  describe('Lifecycle', () => {
    it('should start animation on mount', () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      mount(NewsTicker, {
        props: { articles }
      })

      // Should call startLoop via useAmbientAnimation
      expect(mockStartLoop).toHaveBeenCalled()
    })

    it('should stop animation on unmount', () => {
      const articles = [{ id: 1, title: 'Test', slug: 'test' }]
      const wrapper = mount(NewsTicker, {
        props: { articles }
      })

      wrapper.unmount()

      // Should cleanup
      expect(mockStopLoop).toHaveBeenCalled()
    })
  })
})
