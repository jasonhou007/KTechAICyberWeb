/**
 * @file Services.test.ts
 * @description Comprehensive unit tests for Services component
 * @ticket #40 - TEST-002: Services Component Unit Tests - TDD with Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref, h } from 'vue'

// Mock @vueuse/core for useIntersectionObserver
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: vi.fn(() => vi.fn()),
}))

// Create a shared ref to control loading state
const mockIsLoading = ref(true)

// Create a Transition stub that properly renders its children
const transitionStub = {
  template: '<div class="transition-stub"><slot /></div>',
  render() {
    return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
  }
}

// Mock useSkeleton BEFORE importing the component
const mockUseSkeleton = vi.fn(() => ({
  isLoading: mockIsLoading,
  hasLoaded: ref(!mockIsLoading.value),
  target: ref(null),
  isVisible: ref(true)
}))

vi.mock('../composables/useSkeleton', () => ({
  useSkeleton: mockUseSkeleton
}))

// Import Services component AFTER mocking
import Services from '../Services.vue'
import SkeletonCard from '../SkeletonCard.vue'

describe('Services.vue', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    // Reset to loading state for next test
    mockIsLoading.value = true
  })

  describe('Rendering - Loading State', () => {
    beforeEach(() => {
      // Ensure loading state is true
      mockIsLoading.value = true
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders section element with correct class', () => {
      const section = wrapper.find('section.section')
      expect(section.exists()).toBe(true)
      expect(section.classes()).toContain('section')
    })

    it('has correct section id', () => {
      const section = wrapper.find('section#services')
      expect(section.exists()).toBe(true)
    })

    it('shows skeleton cards when loading', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      expect(skeletons.length).toBe(6)
    })

    it('hides content when loading', () => {
      const heroContent = wrapper.find('.content-wrapper')
      expect(heroContent.exists()).toBe(false)
    })

    it('renders skeleton grid', () => {
      const skeletonGrid = wrapper.find('.skeleton-grid')
      expect(skeletonGrid.exists()).toBe(true)
    })

    it('passes loading state to skeleton cards', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      skeletons.forEach(skeleton => {
        expect(skeleton.props('isLoading')).toBe(true)
      })
    })
  })

  describe('Content Display - Loaded State', () => {
    beforeEach(() => {
      // Set to loaded state
      mockIsLoading.value = false
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders section title', () => {
      const title = wrapper.find('.section-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('核心服务')
    })

    it('renders section subtitle', () => {
      const subtitle = wrapper.find('.section-subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toBe('以尖端科技赋能金融创新')
    })

    it('renders content wrapper when not loading', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(true)
    })

    it('hides skeleton when not loading', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      expect(skeletons.length).toBe(0)
    })

    it('renders grid container', () => {
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
    })
  })

  describe('Services Cards', () => {
    beforeEach(() => {
      mockIsLoading.value = false
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('renders exactly 6 service cards', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(6)
    })

    it('each card has correct structure', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.find('.card-icon').exists()).toBe(true)
        expect(card.find('h3').exists()).toBe(true)
        expect(card.find('p').exists()).toBe(true)
      })
    })

    it('first card displays project management', () => {
      const cards = wrapper.findAll('.card')
      expect(cards[0].find('.card-icon').text()).toBe('🏗️')
      expect(cards[0].find('h3').text()).toBe('项目管理')
      expect(cards[0].find('p').text()).toBe('专业的金融科技项目管理服务')
    })

    it('second card displays retail credit', () => {
      const cards = wrapper.findAll('.card')
      expect(cards[1].find('.card-icon').text()).toBe('💳')
      expect(cards[1].find('h3').text()).toBe('零售信贷')
      expect(cards[1].find('p').text()).toBe('端到端的零售信贷系统解决方案')
    })

    it('third card displays supply chain finance', () => {
      const cards = wrapper.findAll('.card')
      expect(cards[2].find('.card-icon').text()).toBe('🔗')
      expect(cards[2].find('h3').text()).toBe('供应链金融')
      expect(cards[2].find('p').text()).toBe('基于区块链的供应链金融平台')
    })

    it('fourth card displays blockchain', () => {
      const cards = wrapper.findAll('.card')
      expect(cards[3].find('.card-icon').text()).toBe('⛓️')
      expect(cards[3].find('h3').text()).toBe('区块链技术')
      expect(cards[3].find('p').text()).toBe('企业级区块链解决方案')
    })

    it('fifth card displays fintech app', () => {
      const cards = wrapper.findAll('.card')
      expect(cards[4].find('.card-icon').text()).toBe('📱')
      expect(cards[4].find('h3').text()).toBe('金融科技应用')
      expect(cards[4].find('p').text()).toBe('移动端金融应用开发')
    })

    it('sixth card displays big data and AI', () => {
      const cards = wrapper.findAll('.card')
      expect(cards[5].find('.card-icon').text()).toBe('☁️')
      expect(cards[5].find('h3').text()).toBe('大数据与AI')
      expect(cards[5].find('p').text()).toBe('人工智能与大数据分析')
    })

    it('cards have article semantic tag', () => {
      const cards = wrapper.findAll('article.card')
      expect(cards.length).toBe(6)
    })

    it('card icons have aria-hidden attribute', () => {
      const icons = wrapper.findAll('.card-icon')
      icons.forEach(icon => {
        expect(icon.attributes('aria-hidden')).toBe('true')
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockIsLoading.value = false
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('section has id for anchor navigation', () => {
      const section = wrapper.find('section#services')
      expect(section.exists()).toBe(true)
    })

    it('card icons are hidden from screen readers', () => {
      const icons = wrapper.findAll('.card-icon')
      icons.forEach(icon => {
        expect(icon.attributes('aria-hidden')).toBe('true')
      })
    })

    it('uses semantic HTML structure', () => {
      expect(wrapper.find('section').exists()).toBe(true)
      expect(wrapper.find('h2').exists()).toBe(true)
      expect(wrapper.findAll('article').length).toBe(6)
      expect(wrapper.findAll('h3').length).toBe(6)
    })

    it('heading hierarchy is correct', () => {
      const h2 = wrapper.find('h2.section-title')
      const h3s = wrapper.findAll('h3')

      expect(h2.exists()).toBe(true)
      expect(h3s.length).toBe(6)
    })
  })

  describe('CSS Classes and Styling', () => {
    beforeEach(() => {
      mockIsLoading.value = false
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('section has correct class', () => {
      const section = wrapper.find('section.section')
      expect(section.classes()).toContain('section')
    })

    it('title has section-title class', () => {
      const title = wrapper.find('.section-title')
      expect(title.classes()).toContain('section-title')
    })

    it('subtitle has section-subtitle class', () => {
      const subtitle = wrapper.find('.section-subtitle')
      expect(subtitle.classes()).toContain('section-subtitle')
    })

    it('grid has grid class', () => {
      const grid = wrapper.find('.grid')
      expect(grid.classes()).toContain('grid')
    })

    it('cards have card class', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.classes()).toContain('card')
      })
    })

    it('card icons have card-icon class', () => {
      const icons = wrapper.findAll('.card-icon')
      icons.forEach(icon => {
        expect(icon.classes()).toContain('card-icon')
      })
    })

    it('content wrapper has content-wrapper class', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.classes()).toContain('content-wrapper')
    })
  })

  describe('Animations and Transitions', () => {
    beforeEach(() => {
      mockIsLoading.value = false
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('content has fade-in class', () => {
      const fadeIn = wrapper.find('.fade-in')
      expect(fadeIn.exists()).toBe(true)
    })

    it('cards have stagger animation class', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.classes()).toContain('stagger')
      })
    })

    it('cards have fade-in animation class', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.classes()).toContain('fade-in')
      })
    })
  })

  describe('Component Integration', () => {
    beforeEach(() => {
      mockIsLoading.value = false
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('uses useSkeleton composable', () => {
      expect(mockUseSkeleton).toHaveBeenCalled()
    })

    it('passes immediate: false to useSkeleton', () => {
      expect(mockUseSkeleton).toHaveBeenCalledWith({ immediate: false })
    })
  })

  describe('Data Structure', () => {
    beforeEach(() => {
      mockIsLoading.value = false
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('services data is computed', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('each service has icon, title, and description', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.find('.card-icon').exists()).toBe(true)
        expect(card.find('h3').exists()).toBe(true)
        expect(card.find('p').exists()).toBe(true)
      })
    })
  })

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      mockIsLoading.value = false
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('maintains layout on mobile viewport', () => {
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
    })

    it('skeleton grid is responsive', () => {
      wrapper.unmount()

      mockIsLoading.value = true
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })

      const skeletonGrid = wrapper.find('.skeleton-grid')
      expect(skeletonGrid.exists()).toBe(true)
    })
  })
})
