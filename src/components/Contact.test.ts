/**
 * Contact Component Unit Tests
 * @component Contact
 * @description Test suite for Contact component with TDD approach
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Contact from './Contact.vue'

// Mock SkeletonContact component
vi.mock('./SkeletonContact.vue', () => ({
  default: {
    name: 'SkeletonContact',
    props: ['isLoading', 'count'],
    template: '<div class="skeleton-contact-mock" :data-count="count"></div>'
  }
}))

// Mock useSkeleton composable
const mockUseSkeleton = vi.fn()
vi.mock('../composables/useSkeleton', () => ({
  useSkeleton: (options) => mockUseSkeleton(options)
}))

describe('Contact Component', () => {
  let wrapper: any

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  /**
   * Phase 1: Rendering Tests
   * Tests that verify the component renders correctly
   */
  describe('Rendering Tests', () => {
    it('should render without errors', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      expect(wrapper.exists()).toBe(true)
    })

    it('should render section with correct id', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const section = wrapper.find('#contact')
      expect(section.exists()).toBe(true)
      expect(section.classes()).toContain('section')
    })

    it('should render skeleton when loading', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: true })
      wrapper = mount(Contact)
      expect(wrapper.find('.skeleton-contact-mock').exists()).toBe(true)
    })

    it('should not render skeleton when not loading', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      expect(wrapper.find('.skeleton-contact-mock').exists()).toBe(false)
    })

    it('should render content wrapper when not loading', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      expect(wrapper.find('.content-wrapper').exists()).toBe(true)
    })

    it('should render all 3 contact items', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const items = wrapper.findAll('.contact-item')
      expect(items.length).toBe(3)
    })

    it('should render section title', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const title = wrapper.find('.section-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('联系我们')
    })

    it('should render section subtitle', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const subtitle = wrapper.find('.section-subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toBe('期待与您合作')
    })

    it('should render contact grid', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const grid = wrapper.find('.contact-grid')
      expect(grid.exists()).toBe(true)
    })

    it('should render contact icons with aria-hidden attribute', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const icons = wrapper.findAll('.contact-icon')
      expect(icons.length).toBe(3)
      icons.forEach(icon => {
        expect(icon.attributes('aria-hidden')).toBe('true')
      })
    })
  })

  /**
   * Phase 2: Content Tests
   * Tests that verify the content is correct
   */
  describe('Content Tests', () => {
    it('should display correct contact icons', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const icons = wrapper.findAll('.contact-icon')
      const expectedIcons = ['📍', '📧', '🌐']
      icons.forEach((icon, index) => {
        expect(icon.text()).toBe(expectedIcons[index])
      })
    })

    it('should display correct contact labels', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const labels = wrapper.findAll('.contact-item h4')
      const expectedLabels = ['公司地址', '电子邮箱', '官方网站']
      labels.forEach((label, index) => {
        expect(label.text()).toBe(expectedLabels[index])
      })
    })

    it('should display correct contact values', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const values = wrapper.findAll('.contact-item p')
      const expectedValues = ['深圳市罗湖区', 'contact@ktech.fintech', 'www.kaitai.tech']
      values.forEach((value, index) => {
        expect(value.text()).toBe(expectedValues[index])
      })
    })

    it('should render all content with correct i18n keys', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      expect(wrapper.find('.section-title').text()).toBe('联系我们')
      expect(wrapper.find('.section-subtitle').text()).toBe('期待与您合作')
    })

    it('should have contact items with unique keys', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const vm = wrapper.vm
      const labels = vm.contacts.map(c => c.label)
      const uniqueLabels = new Set(labels)
      expect(uniqueLabels.size).toBe(labels.length)
    })
  })

  /**
   * Phase 3: Styling Tests
   * Tests that verify cyberpunk theme styling
   */
  describe('Styling Tests', () => {
    it('should apply fade-in classes to content', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const fadeIn = wrapper.find('.fade-in')
      expect(fadeIn.exists()).toBe(true)
    })

    it('should apply stagger class to contact items for animation', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const items = wrapper.findAll('.contact-item')
      items.forEach(item => {
        expect(item.classes()).toContain('stagger')
      })
    })

    it('should render contact items with correct structure', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const items = wrapper.findAll('.contact-item')
      items.forEach(item => {
        expect(item.find('.contact-icon').exists()).toBe(true)
        expect(item.find('h4').exists()).toBe(true)
        expect(item.find('p').exists()).toBe(true)
      })
    })

    it('should use semantic HTML structure', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      expect(wrapper.find('section').exists()).toBe(true)
      expect(wrapper.find('h2').exists()).toBe(true)
      expect(wrapper.findAll('.contact-item').length).toBe(3)
    })

    it('should have contact class applied to section', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const section = wrapper.find('.contact')
      expect(section.exists()).toBe(true)
    })
  })

  /**
   * Phase 4: Interaction Tests
   * Tests that verify user interactions
   */
  describe('Interaction Tests', () => {
    it('should respond to hover events on contact items', async () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const item = wrapper.find('.contact-item')

      // Trigger hover
      await item.trigger('mouseenter')
      await nextTick()

      // Verify item is still present after hover
      expect(item.exists()).toBe(true)
    })

    it('should handle mouse leave events on contact items', async () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const item = wrapper.find('.contact-item')

      await item.trigger('mouseenter')
      await nextTick()
      await item.trigger('mouseleave')
      await nextTick()

      expect(item.exists()).toBe(true)
    })
  })

  /**
   * Phase 5: Accessibility Tests
   * Tests that verify accessibility features
   */
  describe('Accessibility Tests', () => {
    it('should have proper heading hierarchy', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const h2 = wrapper.find('h2')
      const h4s = wrapper.findAll('h4')

      expect(h2.exists()).toBe(true)
      expect(h4s.length).toBe(3)
    })

    it('should mark decorative icons with aria-hidden', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const icons = wrapper.findAll('.contact-icon')

      icons.forEach(icon => {
        expect(icon.attributes('aria-hidden')).toBe('true')
      })
    })

    it('should have visible text content for screen readers', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)

      const title = wrapper.find('.section-title')
      const subtitle = wrapper.find('.section-subtitle')
      const labels = wrapper.findAll('.contact-item h4')
      const values = wrapper.findAll('.contact-item p')

      expect(title.text().length).toBeGreaterThan(0)
      expect(subtitle.text().length).toBeGreaterThan(0)
      labels.forEach(label => {
        expect(label.text().length).toBeGreaterThan(0)
      })
      values.forEach(value => {
        expect(value.text().length).toBeGreaterThan(0)
      })
    })

    it('should have section with id for anchor navigation', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)
      const section = wrapper.find('#contact')
      expect(section.exists()).toBe(true)
    })
  })

  /**
   * Phase 6: Responsive Tests
   * Tests that verify responsive behavior
   */
  describe('Responsive Tests', () => {
    it('should render correctly on mobile viewport', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })

      // Set mobile viewport
      global.innerWidth = 375
      wrapper = mount(Contact, {
        attachTo: document.body
      })

      expect(wrapper.find('.section').exists()).toBe(true)
      expect(wrapper.find('.contact-grid').exists()).toBe(true)
      expect(wrapper.findAll('.contact-item').length).toBe(3)
    })

    it('should render correctly on desktop viewport', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })

      // Set desktop viewport
      global.innerWidth = 1920
      wrapper = mount(Contact, {
        attachTo: document.body
      })

      expect(wrapper.find('.section').exists()).toBe(true)
      expect(wrapper.find('.contact-grid').exists()).toBe(true)
      expect(wrapper.findAll('.contact-item').length).toBe(3)
    })

    it('should render correctly on tablet viewport', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })

      // Set tablet viewport
      global.innerWidth = 768
      wrapper = mount(Contact, {
        attachTo: document.body
      })

      expect(wrapper.find('.section').exists()).toBe(true)
      expect(wrapper.find('.contact-grid').exists()).toBe(true)
      expect(wrapper.findAll('.contact-item').length).toBe(3)
    })
  })

  /**
   * Phase 7: State Management Tests
   * Tests that verify component state
   */
  describe('State Management Tests', () => {
    it('should use useSkeleton composable with correct options', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)

      expect(mockUseSkeleton).toHaveBeenCalledWith({ immediate: false })
    })

    it('should render skeleton when isLoading is true', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: true })
      wrapper = mount(Contact)

      expect(wrapper.find('.skeleton-contact-mock').exists()).toBe(true)
      expect(wrapper.find('.content-wrapper').exists()).toBe(false)
    })

    it('should render content when isLoading is false', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)

      expect(wrapper.find('.skeleton-contact-mock').exists()).toBe(false)
      expect(wrapper.find('.content-wrapper').exists()).toBe(true)
    })

    it('should have 3 contacts defined', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)

      expect(wrapper.vm.contacts.length).toBe(3)
    })

    it('should have contacts with correct structure', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)

      wrapper.vm.contacts.forEach(contact => {
        expect(contact).toHaveProperty('icon')
        expect(contact).toHaveProperty('label')
        expect(contact).toHaveProperty('value')
        expect(typeof contact.icon).toBe('string')
        expect(typeof contact.label).toBe('string')
        expect(typeof contact.value).toBe('string')
      })
    })
  })

  /**
   * Phase 8: Edge Cases and Error Handling
   * Tests that verify edge cases
   */
  describe('Edge Cases', () => {
    it('should handle missing translation keys gracefully', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)

      // Test that the component doesn't crash with translation function
      const t = wrapper.vm.t
      expect(t('non.existent.key')).toBe('non.existent.key')
    })

    it('should handle all contact data being present', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)

      wrapper.vm.contacts.forEach(contact => {
        expect(contact.icon).toBeTruthy()
        expect(contact.label).toBeTruthy()
        expect(contact.value).toBeTruthy()
      })
    })

    it('should maintain contact order', () => {
      mockUseSkeleton.mockReturnValue({ isLoading: false })
      wrapper = mount(Contact)

      const firstLabel = wrapper.findAll('.contact-item h4')[0]
      expect(firstLabel.text()).toBe('公司地址')

      const lastLabel = wrapper.findAll('.contact-item h4')[2]
      expect(lastLabel.text()).toBe('官方网站')
    })
  })
})
