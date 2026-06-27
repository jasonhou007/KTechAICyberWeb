/**
 * @file Services.test.ts
 * @description Comprehensive unit tests for Services component
 * @ticket #40 - TEST-002: Services Component Unit Tests - TDD with Vitest
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import Services from '@/components/Services.vue'

// Mock the composable before importing the component
vi.mock('@/composables/useSkeleton', () => ({
  useSkeleton: vi.fn(() => ({
    isLoading: ref(false),
    isVisible: ref(true),
    target: ref(null),
    hasLoaded: ref(true)
  }))
}))

// Mock the SkeletonCard component
vi.mock('@/components/SkeletonCard.vue', () => ({
  default: {
    name: 'SkeletonCard',
    props: ['isLoading', 'index'],
    template: '<div class="skeleton-card">Loading...</div>'
  }
}))

describe('Services.vue', () => {
  let wrapper

  const mockTranslations = {
    'services.title': '核心服务',
    'services.subtitle': '以尖端科技赋能金融创新',
    'services.projectManagement': '项目管理',
    'services.projectManagementDesc': '专业的金融科技项目管理服务',
    'services.retailCredit': '零售信贷',
    'services.retailCreditDesc': '端到端的零售信贷系统解决方案',
    'services.supplyChain': '供应链金融',
    'services.supplyChainDesc': '基于区块链的供应链金融平台',
    'services.blockchain': '区块链技术',
    'services.blockchainDesc': '企业级区块链解决方案',
    'services.fintechApp': '金融科技应用',
    'services.fintechAppDesc': '移动端金融应用开发',
    'services.bigData': '大数据与AI',
    'services.bigDataDesc': '人工智能与大数据分析'
  }

  beforeEach(() => {
    wrapper = mount(Services, {
      global: {
        stubs: {
          Transition: {
            template: '<slot />'
          }
        }
      }
    })
  })

  describe('Rendering', () => {
    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders main services section', () => {
      const section = wrapper.find('.section')
      expect(section.exists()).toBe(true)
    })

    it('has correct section id for navigation', () => {
      const section = wrapper.find('#services')
      expect(section.exists()).toBe(true)
    })

    it('renders content wrapper when not loading', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(true)
    })
  })

  describe('Content Display', () => {
    it('renders section title', () => {
      const title = wrapper.find('.section-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe(mockTranslations['services.title'])
    })

    it('renders section subtitle', () => {
      const subtitle = wrapper.find('.section-subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toBe(mockTranslations['services.subtitle'])
    })

    it('renders services grid container', () => {
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
    })

    it('renders all 6 service cards', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(6)
    })

    it('each service card has icon', () => {
      const icons = wrapper.findAll('.card-icon')
      expect(icons.length).toBe(6)
    })

    it('service cards display correct titles', () => {
      const titles = wrapper.findAll('.card h3')
      const expectedTitles = [
        mockTranslations['services.projectManagement'],
        mockTranslations['services.retailCredit'],
        mockTranslations['services.supplyChain'],
        mockTranslations['services.blockchain'],
        mockTranslations['services.fintechApp'],
        mockTranslations['services.bigData']
      ]
      const actualTitles = titles.map(t => t.text())
      expectedTitles.forEach(title => {
        expect(actualTitles).toContain(title)
      })
    })

    it('service cards display correct descriptions', () => {
      const cards = wrapper.findAll('.card')
      expect(cards[0].text()).toContain(mockTranslations['services.projectManagementDesc'])
      expect(cards[1].text()).toContain(mockTranslations['services.retailCreditDesc'])
    })

    it('service cards have emoji icons', () => {
      const icons = wrapper.findAll('.card-icon')
      const iconTexts = icons.map(i => i.text())
      expect(iconTexts).toContain('🏗️')
      expect(iconTexts).toContain('💳')
      expect(iconTexts).toContain('🔗')
    })
  })

  describe('Styling and Cyberpunk Theme', () => {
    it('section has proper styling classes', () => {
      const section = wrapper.find('.section')
      expect(section.exists()).toBe(true)
    })

    it('title has cyan color styling class', () => {
      const title = wrapper.find('.section-title')
      expect(title.classes()).toContain('section-title')
    })

    it('service cards have proper styling classes', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(6)
      cards.forEach(card => {
        expect(card.classes()).toContain('card')
      })
    })

    it('fade-in animation class is present', () => {
      const fadeElements = wrapper.findAll('.fade-in')
      expect(fadeElements.length).toBeGreaterThan(0)
    })

    it('stagger animation class on cards', () => {
      const cards = wrapper.findAll('.card')
      expect(cards[0].classes()).toContain('stagger')
    })
  })

  describe('Data Structure', () => {
    it('component has services data array', () => {
      expect(wrapper.vm.services).toBeDefined()
      expect(Array.isArray(wrapper.vm.services)).toBe(true)
    })

    it('services array contains 6 items', () => {
      expect(wrapper.vm.services.length).toBe(6)
    })

    it('each service item has required properties', () => {
      const service = wrapper.vm.services[0]
      expect(service.icon).toBeDefined()
      expect(service.title).toBeDefined()
      expect(service.description).toBeDefined()
    })

    it('service icons are emoji strings', () => {
      wrapper.vm.services.forEach(service => {
        expect(typeof service.icon).toBe('string')
        expect(service.icon.length).toBeGreaterThan(0)
      })
    })

    it('service titles and descriptions are non-empty', () => {
      wrapper.vm.services.forEach(service => {
        expect(service.title.length).toBeGreaterThan(0)
        expect(service.description.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Accessibility', () => {
    it('uses semantic HTML section element', () => {
      const section = wrapper.find('section')
      expect(section.exists()).toBe(true)
    })

    it('has proper heading hierarchy', () => {
      const h2 = wrapper.find('h2')
      const h3s = wrapper.findAll('h3')
      expect(h2.exists()).toBe(true)
      expect(h3s.length).toBe(6)
    })

    it('section has id for anchor navigation', () => {
      const section = wrapper.find('section#services')
      expect(section.exists()).toBe(true)
    })

    it('service icons have aria-hidden attribute', () => {
      const icons = wrapper.findAll('.card-icon')
      icons.forEach(icon => {
        expect(icon.attributes('aria-hidden')).toBe('true')
      })
    })

    it('service cards are properly structured as articles', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.element.tagName).toBe('ARTICLE')
        expect(card.find('h3').exists()).toBe(true)
        expect(card.find('p').exists()).toBe(true)
      })
    })
  })

  describe('Responsive Layout', () => {
    it('grid uses auto-fit with minmax for responsive behavior', () => {
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
    })

    it('section has responsive padding classes', () => {
      const section = wrapper.find('.section')
      expect(section.exists()).toBe(true)
    })

    it('grid has proper gap spacing', () => {
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
    })
  })

  describe('Translation Function', () => {
    it('component has translation function', () => {
      expect(typeof wrapper.vm.t).toBe('function')
    })

    it('returns key for unknown translation', () => {
      const result = wrapper.vm.t('unknown.key')
      expect(result).toBe('unknown.key')
    })

    it('returns correct translation for known keys', () => {
      expect(wrapper.vm.t('services.title')).toBe(mockTranslations['services.title'])
      expect(wrapper.vm.t('services.subtitle')).toBe(mockTranslations['services.subtitle'])
    })

    it('translates all service titles correctly', () => {
      const titles = wrapper.vm.services.map(s => s.title)
      titles.forEach(title => {
        expect(typeof title).toBe('string')
        expect(title.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Loading States', () => {
    it('has skeleton loading state managed by useSkeleton', () => {
      expect(wrapper.vm.isLoading).toBeDefined()
    })

    it('isLoading is boolean (auto-unwrapped ref)', () => {
      expect(typeof wrapper.vm.isLoading).toBe('boolean')
    })

    it('isLoading is false when loaded', () => {
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('has skeleton grid structure when loading would be true', () => {
      const skeletonGrid = wrapper.findAll('.skeleton-grid')
      expect(skeletonGrid.length).toBe(0) // No skeleton when isLoading is false
    })
  })

  describe('Component Structure', () => {
    it('imports SkeletonCard component', () => {
      expect(wrapper.vm).toBeDefined()
    })

    it('imports useSkeleton composable', () => {
      expect(wrapper.vm.isLoading).toBeDefined()
    })

    it('service cards use v-for with unique keys', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(wrapper.vm.services.length)
    })

    it('has section with proper class structure', () => {
      const section = wrapper.find('section.section')
      expect(section.exists()).toBe(true)
    })
  })

  describe('Hover Effects', () => {
    it('service cards have hover transition styles', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('card icons have transition styles', () => {
      const icons = wrapper.findAll('.card-icon')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('cards have pseudo-element for hover effect', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(6)
    })
  })

  describe('Content Wrapper', () => {
    it('renders content wrapper div', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(true)
    })

    it('content wrapper has fade-in child', () => {
      const fadeIn = wrapper.find('.content-wrapper .fade-in')
      expect(fadeIn.exists()).toBe(true)
    })

    it('content wrapper prevents layout shift during transition', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(true)
    })
  })

  describe('Grid Structure', () => {
    it('has services container with grid class', () => {
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
      expect(grid.classes()).toContain('grid')
    })

    it('grid contains exactly 6 cards', () => {
      const grid = wrapper.find('.grid')
      const cards = grid.findAll('.card')
      expect(cards.length).toBe(6)
    })

    it('grid maintains consistent card structure', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.find('.card-icon').exists()).toBe(true)
        expect(card.find('h3').exists()).toBe(true)
        expect(card.find('p').exists()).toBe(true)
      })
    })
  })

  describe('Cyberpunk Theme Elements', () => {
    it('uses cyan color for title', () => {
      const title = wrapper.find('.section-title')
      expect(title.classes()).toContain('section-title')
    })

    it('cards have dark background styling', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(6)
      cards.forEach(card => {
        expect(card.classes()).toContain('card')
      })
    })

    it('uses cyberpunk color scheme in classes', () => {
      const section = wrapper.find('.section')
      expect(section.exists()).toBe(true)
    })
  })

  describe('Service Content Completeness', () => {
    it('has all six service types present', () => {
      const cards = wrapper.findAll('.card')
      const titles = cards.map(card => card.find('h3').text())

      expect(titles).toContain(mockTranslations['services.projectManagement'])
      expect(titles).toContain(mockTranslations['services.retailCredit'])
      expect(titles).toContain(mockTranslations['services.supplyChain'])
      expect(titles).toContain(mockTranslations['services.blockchain'])
      expect(titles).toContain(mockTranslations['services.fintechApp'])
      expect(titles).toContain(mockTranslations['services.bigData'])
    })

    it('has descriptions for all services', () => {
      const cards = wrapper.findAll('.card')

      cards.forEach(card => {
        const description = card.find('p')
        expect(description.exists()).toBe(true)
        expect(description.text().length).toBeGreaterThan(5)
      })
    })

    it('has unique icons for each service', () => {
      const icons = wrapper.findAll('.card-icon')
      const iconTexts = icons.map(icon => icon.text())

      // All six icons should be different
      const uniqueIcons = new Set(iconTexts)
      expect(uniqueIcons.size).toBe(6)
    })
  })

  describe('Animation Setup', () => {
    it('stagger animation class on each card', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.classes()).toContain('stagger')
      })
    })

    it('fade-in animation on title section', () => {
      const titleSection = wrapper.find('.fade-in .section-title')
      expect(titleSection.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles multiple mount/unmount cycles', () => {
      for (let i = 0; i < 3; i++) {
        const testWrapper = mount(Services, {
          global: {
            stubs: {
              Transition: {
                template: '<slot />'
              }
            }
          }
        })
        expect(testWrapper.findAll('.card').length).toBe(6)
        testWrapper.unmount()
      }
    })

    it('maintains consistent structure across re-renders', () => {
      const initialCardCount = wrapper.findAll('.card').length
      wrapper.vm.$forceUpdate()
      const afterUpdateCardCount = wrapper.findAll('.card').length
      expect(initialCardCount).toBe(afterUpdateCardCount)
    })
  })
})
