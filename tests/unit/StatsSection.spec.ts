import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Home from '@/views/Home.vue'
import { createRouter, createMemoryHistory } from 'vue-router'
// This suite is skipped below because it depends on Pinia. Pinia is NOT set
// up in this project yet — see GitHub issue #22 "Setup Pinia State Management"
// (still OPEN). The `createPinia` import would fail to resolve, so the module
// must stay inert until #22 lands. Re-enable (and restore the import) once
// Pinia is installed.
// import { createPinia } from 'pinia'

// Mock useLanguage composable
const mockTranslations = {
  en: {
    'home.title': 'KTech AI',
    'home.subtitle': 'Cyberpunk Intelligence Systems',
    'home.hero.title': 'Next Generation AI',
    'home.hero.description': 'Building the future of artificial intelligence with cutting-edge technology and cyberpunk aesthetics.',
    'home.stats.uptime.label': 'Uptime',
    'home.stats.uptime.value': '99.9%',
    'home.stats.requests.label': 'Requests',
    'home.stats.requests.value': '1M+',
    'home.stats.latency.label': 'Latency',
    'home.stats.latency.value': '50ms',
    'home.features.ai.title': 'AI Models',
    'home.features.ai.description': 'Advanced neural networks powered by state-of-the-art transformers',
    'home.features.realtime.title': 'Real-time',
    'home.features.realtime.description': 'Lightning-fast responses with our optimized infrastructure',
    'home.features.secure.title': 'Secure',
    'home.features.secure.description': 'Enterprise-grade security with quantum-resistant encryption',
    'home.cta': 'Get Started'
  },
  zh: {
    'home.title': 'KTech AI',
    'home.subtitle': '赛博朋克智能系统',
    'home.hero.title': '下一代人工智能',
    'home.hero.description': '运用尖端技术和赛博朋克美学,构建人工智能的未来。',
    'home.stats.uptime.label': '正常运行时间',
    'home.stats.uptime.value': '99.9%',
    'home.stats.requests.label': '请求数',
    'home.stats.requests.value': '100万+',
    'home.stats.latency.label': '响应延迟',
    'home.stats.latency.value': '50毫秒',
    'home.features.ai.title': 'AI 模型',
    'home.features.ai.description': '由最先进的transformer技术驱动的先进神经网络',
    'home.features.realtime.title': '实时处理',
    'home.features.realtime.description': '通过优化的基础设施实现闪电般快速的响应',
    'home.features.secure.title': '安全可靠',
    'home.features.secure.description': '企业级安全,采用抗量子加密技术',
    'home.cta': '立即开始'
  }
}

vi.mock('@/composables/useLanguage', () => ({
  useLanguage: () => ({
    t: (key) => {
      // Simulate nested key access for stats labels
      if (key.includes('.label')) {
        const keys = key.split('.')
        const lang = 'en' // default
        return mockTranslations[en][key] || key
      }
      return mockTranslations.en[key] || key
    },
    locale: { value: 'en' },
    currentLanguage: { value: 'en' },
    languageDisplay: 'EN',
    isEnglish: true,
    initLanguage: vi.fn(),
    setLanguage: vi.fn(),
    toggleLanguage: vi.fn()
  })
}))

// SKIP: depends on Pinia setup — tracked in #22 (not yet implemented).
// Pinia is intentionally not installed in this project; re-enable this suite
// (and restore the createPinia import above) once issue #22 lands.
describe.skip('StatsSection (Home View)', () => {
  let router
  let pinia
  let wrapper

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/home', component: Home }
      ]
    })
    pinia = null // createPinia() — disabled, see #22
  })

  describe('Rendering', () => {
    it('should mount Home component without errors', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('should render stats container', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statsContainer = wrapper.find('.stats')
      expect(statsContainer.exists()).toBe(true)
    })

    it('should render 3 stat items', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statItems = wrapper.findAll('.stat')
      expect(statItems.length).toBe(3)
    })

    it('should display stat values correctly', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statValues = wrapper.findAll('.stat-value')
      expect(statValues.length).toBe(3)
      expect(statValues[0].text()).toBe('99.9%')
      expect(statValues[1].text()).toBe('1M+')
      expect(statValues[2].text()).toBe('50ms')
    })

    it('should apply neon-text class to stat values', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statValues = wrapper.findAll('.stat-value')
      statValues.forEach(statValue => {
        expect(statValue.classes()).toContain('neon-text')
      })
    })
  })

  describe('Content (i18n)', () => {
    it('should render stat labels', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statLabels = wrapper.findAll('.stat-label')
      expect(statLabels.length).toBe(3)
    })

    it('should display English stat labels by default', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statLabels = wrapper.findAll('.stat-label')
      // Labels are rendered via i18n, check they exist and are non-empty
      statLabels.forEach(label => {
        expect(label.text().length).toBeGreaterThan(0)
      })
    })
  })

  describe('Accessibility', () => {
    it('should use semantic HTML structure for stats', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statsContainer = wrapper.find('.stats')
      expect(statsContainer.element.tagName).toBe('DIV')

      const statItems = wrapper.findAll('.stat')
      statItems.forEach(stat => {
        expect(stat.element.tagName).toBe('DIV')
      })
    })

    it('should have stat values and labels as span elements', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statValues = wrapper.findAll('.stat-value')
      const statLabels = wrapper.findAll('.stat-label')

      statValues.forEach(value => {
        expect(value.element.tagName).toBe('SPAN')
      })

      statLabels.forEach(label => {
        expect(label.element.tagName).toBe('SPAN')
      })
    })
  })

  describe('Styling', () => {
    it('should apply correct CSS classes to stats', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statsContainer = wrapper.find('.stats')
      expect(statsContainer.classes()).toContain('stats')

      const statItems = wrapper.findAll('.stat')
      statItems.forEach(stat => {
        expect(stat.classes()).toContain('stat')
      })
    })

    it('should apply neon-text class to stat values for cyberpunk effect', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statValues = wrapper.findAll('.stat-value')
      statValues.forEach(statValue => {
        expect(statValue.classes()).toContain('neon-text')
      })
    })

    it('should have stats within cyber-card', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const cyberCard = wrapper.find('.cyber-card')
      const statsContainer = wrapper.find('.stats')

      expect(cyberCard.exists()).toBe(true)
      expect(cyberCard.find('.stats').exists()).toBe(true)
    })
  })

  describe('Structure', () => {
    it('should have stats in hero section', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const heroSection = wrapper.find('.hero')
      const statsContainer = wrapper.find('.stats')

      expect(heroSection.exists()).toBe(true)
      expect(heroSection.find('.stats').exists()).toBe(true)
    })

    it('should maintain consistent stat item structure', () => {
      wrapper = mount(Home, {
        global: {
          plugins: [router, pinia]
        }
      })
      const statItems = wrapper.findAll('.stat')

      statItems.forEach(stat => {
        expect(stat.find('.stat-value').exists()).toBe(true)
        expect(stat.find('.stat-label').exists()).toBe(true)
      })
    })
  })
})
