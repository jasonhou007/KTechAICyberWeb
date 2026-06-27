import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Home from '../../src/views/Home.vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'

// Mock composables
vi.mock('../../src/composables/useLanguage', () => ({
  useLanguage: () => ({
    t: (key) => {
      const translations = {
        'home.title': 'KTech AI',
        'home.subtitle': 'Cyberpunk Intelligence Systems',
        'home.hero.title': 'Next Generation AI',
        'home.hero.description': 'Building the future of artificial intelligence with cutting-edge technology and cyberpunk aesthetics.',
        'home.stats.uptime': 'Uptime',
        'home.stats.requests': 'Requests',
        'home.stats.latency': 'Latency',
        'home.features.ai.title': 'AI Models',
        'home.features.ai.description': 'Advanced neural networks powered by state-of-the-art transformers',
        'home.features.realtime.title': 'Real-time',
        'home.features.realtime.description': 'Lightning-fast responses with our optimized infrastructure',
        'home.features.secure.title': 'Secure',
        'home.features.secure.description': 'Enterprise-grade security with quantum-resistant encryption',
        'home.cta': 'Get Started'
      }
      return translations[key] || key
    }
  })
}))

vi.mock('../../src/composables/useIntersectionObserver', () => ({
  useIntersectionObserverList: () => ({
    visibleItems: { value: new Set() },
    observeItem: vi.fn()
  })
}))

describe('Home.vue (Hero Component)', () => {
  let router
  let pinia
  let wrapper

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Home }
      ]
    })
    pinia = createPinia()
  })

  describe('Rendering', () => {
    it('should mount without errors', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('renders main home container', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.find('.home').exists()).toBe(true)
    })

    it('renders animated background grid', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const grids = wrapper.findAll('.grid-bg')
      expect(grids.length).toBeGreaterThanOrEqual(1)
    })

    it('renders content container', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.find('.content').exists()).toBe(true)
    })
  })

  describe('Header Section', () => {
    it('renders cyber header', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.find('.cyber-header').exists()).toBe(true)
    })

    it('displays main title with neon text effect', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const title = wrapper.find('.neon-text')
      expect(title.exists()).toBe(true)
      expect(title.text()).toContain('KTech AI')
    })

    it('has glitch-text class on title', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const title = wrapper.find('.glitch-text')
      expect(title.exists()).toBe(true)
    })

    it('displays subtitle', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const subtitle = wrapper.find('.subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toContain('Cyberpunk Intelligence Systems')
    })
  })

  describe('Hero Section', () => {
    it('renders hero section', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.find('.hero').exists()).toBe(true)
    })

    it('renders cyber card', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.find('.cyber-card').exists()).toBe(true)
    })

    it('displays hero title', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const heroTitle = wrapper.find('.cyber-card h2')
      expect(heroTitle.exists()).toBe(true)
      expect(heroTitle.text()).toContain('Next Generation AI')
    })

    it('displays hero description', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const heroDesc = wrapper.find('.cyber-card p')
      expect(heroDesc.exists()).toBe(true)
      expect(heroDesc.text()).toContain('Building the future')
    })
  })

  describe('Stats Section', () => {
    it('renders stats container', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.find('.stats').exists()).toBe(true)
    })

    it('displays three stat items', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const stats = wrapper.findAll('.stat')
      expect(stats.length).toBe(3)
    })

    it('displays uptime stat correctly', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const firstStat = wrapper.findAll('.stat')[0]
      expect(firstStat.find('.stat-value').text()).toBe('99.9%')
      expect(firstStat.find('.stat-label').text()).toBe('Uptime')
    })

    it('displays requests stat correctly', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const secondStat = wrapper.findAll('.stat')[1]
      expect(secondStat.find('.stat-value').text()).toBe('1M+')
      expect(secondStat.find('.stat-label').text()).toBe('Requests')
    })

    it('displays latency stat correctly', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const thirdStat = wrapper.findAll('.stat')[2]
      expect(thirdStat.find('.stat-value').text()).toBe('50ms')
      expect(thirdStat.find('.stat-label').text()).toBe('Latency')
    })

    it('applies neon-text class to stat values', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statValues = wrapper.findAll('.stat-value.neon-text')
      expect(statValues.length).toBe(3)
    })
  })

  describe('Features Section', () => {
    it('renders features section', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.find('.features').exists()).toBe(true)
    })

    it('displays three feature cards', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const features = wrapper.findAll('.feature-card')
      expect(features.length).toBe(3)
    })

    it('first feature displays AI content', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const firstFeature = wrapper.findAll('.feature-card')[0]
      expect(firstFeature.find('h3').text()).toBe('AI Models')
      expect(firstFeature.find('p').text()).toContain('neural networks')
    })

    it('feature cards have neon-border class', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const featureIcons = wrapper.findAll('.feature-icon.neon-border')
      expect(featureIcons.length).toBe(3)
    })

    it('features display icons', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const icons = wrapper.findAll('.feature-icon')
      expect(icons.length).toBe(3)
    })
  })

  describe('CTA Section', () => {
    it('renders CTA section', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.find('.cta').exists()).toBe(true)
    })

    it('renders cyber button', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const button = wrapper.find('.cyber-button')
      expect(button.exists()).toBe(true)
    })

    it('button has neon-border class', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const button = wrapper.find('.cyber-button.neon-border')
      expect(button.exists()).toBe(true)
    })

    it('displays correct CTA text', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const button = wrapper.find('.cyber-button')
      expect(button.text()).toBe('Get Started')
    })
  })

  describe('Accessibility', () => {
    it('uses semantic HTML elements', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.find('header').exists()).toBe(true)
      expect(wrapper.find('section').exists()).toBe(true)
    })

    it('has proper heading hierarchy', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const headings = wrapper.findAll('h1, h2, h3')
      expect(headings.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe('Cyberpunk Styling', () => {
    it('applies neon-text class to title', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.find('.neon-text').exists()).toBe(true)
    })

    it('applies glitch-text class to title', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.find('.glitch-text').exists()).toBe(true)
    })

    it('has data-text attribute on glitch title', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const title = wrapper.find('.glitch-text')
      expect(title.attributes('data-text')).toBe('KTech AI')
    })
  })
})
