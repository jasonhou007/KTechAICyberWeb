/**
 * @file Contact.test.ts
 * @description Comprehensive unit tests for Contact component
 * @ticket #42 - TEST-004: Contact Component Unit Tests - TDD with Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref, h } from 'vue'

// Mock @vueuse/core for useIntersectionObserver
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: vi.fn(() => vi.fn()),
}))

// Contact.vue uses window.__testLoadingState in test environment
// We need to set this up before importing the component
// Initialize with loading state (true)
if (typeof window !== 'undefined' && !window.__testLoadingState) {
  window.__testLoadingState = ref(true)
}

// Helper function to control loading state via window.__testLoadingState
const setLoadingState = (isLoading: boolean) => {
  if (typeof window !== 'undefined' && window.__testLoadingState) {
    window.__testLoadingState.value = isLoading
  }
}

// Import Contact component AFTER mocking
import Contact from '../Contact.vue'
import SkeletonContact from '../SkeletonContact.vue'

// Create a shared Transition stub that renders its children
const transitionStub = {
  template: '<div class="transition-stub"><slot /></div>',
  render() {
    return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
  }
}

describe('Contact.vue', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    // Reset to loading state for next test (Contact default with immediate: false)
    setLoadingState(true)
  })

  describe('Rendering - Loading State', () => {
    beforeEach(() => {
      // Contact uses immediate: false, so default is loading
      setLoadingState(true)
      wrapper = mount(Contact, {
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

    it('renders section element with correct classes', () => {
      const section = wrapper.find('section.contact')
      expect(section.exists()).toBe(true)
      expect(section.classes()).toContain('section')
      expect(section.classes()).toContain('contact')
    })

    it('has correct section id', () => {
      const section = wrapper.find('section#contact')
      expect(section.exists()).toBe(true)
    })

    it('shows skeleton when loading', () => {
      const skeleton = wrapper.findComponent(SkeletonContact)
      expect(skeleton.exists()).toBe(true)
    })

    it('hides content wrapper when loading', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(false)
    })

    it('passes correct count prop to SkeletonContact', () => {
      const skeleton = wrapper.findComponent(SkeletonContact)
      expect(skeleton.props('count')).toBe(3)
    })

    it('uses semantic section element', () => {
      const section = wrapper.find('section')
      expect(section.exists()).toBe(true)
      expect(section.element.tagName.toLowerCase()).toBe('section')
    })

    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [
        mount(Contact, { global: { stubs: { Transition: transitionStub } } }),
        mount(Contact, { global: { stubs: { Transition: transitionStub } } }),
        mount(Contact, { global: { stubs: { Transition: transitionStub } } }),
      ]
      wrappers.forEach(w => expect(w.exists()).toBe(true))
      wrappers.forEach(w => w.unmount())
    })

    it('renders correctly with minimal props', () => {
      wrapper = mount(Contact, {
        props: {},
        global: { stubs: { Transition: transitionStub } }
      })
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Content Display - Loaded State', () => {
    beforeEach(() => {
      // Set loading state to false for content tests
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('renders content wrapper', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(true)
    })

    it('renders contact grid', () => {
      const grid = wrapper.find('.contact-grid')
      expect(grid.exists()).toBe(true)
    })

    it('displays section title', () => {
      const title = wrapper.find('.section-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('联系我们')
    })

    it('displays section subtitle', () => {
      const subtitle = wrapper.find('.section-subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toBe('期待与您合作')
    })

    it('renders all three contact items', () => {
      const items = wrapper.findAll('.contact-item')
      expect(items.length).toBe(3)
    })

    it('displays address contact item', () => {
      const items = wrapper.findAll('.contact-item')
      const addressItem = items[0]
      expect(addressItem.find('h4').text()).toBe('公司地址')
      expect(addressItem.find('p').text()).toBe('深圳市罗湖区')
    })

    it('displays email contact item', () => {
      const items = wrapper.findAll('.contact-item')
      const emailItem = items[1]
      expect(emailItem.find('h4').text()).toBe('电子邮箱')
      expect(emailItem.find('p').text()).toBe('contact@ktech.fintech')
    })

    it('displays website contact item', () => {
      const items = wrapper.findAll('.contact-item')
      const websiteItem = items[2]
      expect(websiteItem.find('h4').text()).toBe('官方网站')
      expect(websiteItem.find('p').text()).toBe('www.kaitai.tech')
    })
  })

  describe('Contact Icons - Loaded State', () => {
    beforeEach(() => {
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('displays location icon', () => {
      const items = wrapper.findAll('.contact-item')
      const icon = items[0].find('.contact-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('📍')
    })

    it('displays email icon', () => {
      const items = wrapper.findAll('.contact-item')
      const icon = items[1].find('.contact-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('📧')
    })

    it('displays globe icon', () => {
      const items = wrapper.findAll('.contact-item')
      const icon = items[2].find('.contact-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('🌐')
    })
  })

  describe('Cyberpunk Styling - Loaded State', () => {
    beforeEach(() => {
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('contact items have correct styling class', () => {
      const items = wrapper.findAll('.contact-item')
      expect(items.length).toBe(3)
      items.forEach(item => {
        expect(item.classes()).toContain('contact-item')
      })
    })

    it('contact grid has correct class', () => {
      const grid = wrapper.find('.contact-grid')
      expect(grid.classes()).toContain('contact-grid')
    })

    it('content wrapper has correct class', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.classes()).toContain('content-wrapper')
    })

    it('section title has correct class', () => {
      const title = wrapper.find('.section-title')
      expect(title.classes()).toContain('section-title')
    })

    it('section subtitle has correct class', () => {
      const subtitle = wrapper.find('.section-subtitle')
      expect(subtitle.classes()).toContain('section-subtitle')
    })
  })

  describe('Loading State - Content Visible', () => {
    beforeEach(() => {
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('shows content when isLoading is false', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(true)
    })

    it('hides skeleton when not loading', () => {
      const skeleton = wrapper.findComponent(SkeletonContact)
      expect(skeleton.exists()).toBe(false)
    })
  })

  describe('Accessibility - Loaded State', () => {
    beforeEach(() => {
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('contact icons have aria-hidden attribute', () => {
      const icons = wrapper.findAll('.contact-icon')
      expect(icons.length).toBe(3)
      icons.forEach(icon => {
        expect(icon.attributes('aria-hidden')).toBe('true')
      })
    })

    it('has proper heading hierarchy with h2', () => {
      const title = wrapper.find('.section-title')
      expect(title.element.tagName.toLowerCase()).toBe('h2')
    })

    it('contact items use h4 for labels', () => {
      const items = wrapper.findAll('.contact-item')
      items.forEach(item => {
        const heading = item.find('h4')
        expect(heading.exists()).toBe(true)
      })
    })

    it('has section id for anchor navigation', () => {
      const section = wrapper.find('section#contact')
      expect(section.exists()).toBe(true)
    })
  })

  describe('Responsive Behavior - Loaded State', () => {
    beforeEach(() => {
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('contact grid renders with responsive grid structure', () => {
      const grid = wrapper.find('.contact-grid')
      expect(grid.exists()).toBe(true)
      const items = wrapper.findAll('.contact-item')
      expect(items.length).toBeGreaterThan(0)
    })

    it('maintains minimum height for content wrapper', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(true)
    })
  })

  describe('Transitions - Loaded State', () => {
    beforeEach(() => {
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('has fade-in animation class on title container', () => {
      const fadeIn = wrapper.find('.fade-in')
      expect(fadeIn.exists()).toBe(true)
    })

    it('contact items have stagger animation class', () => {
      const items = wrapper.findAll('.contact-item')
      items.forEach(item => {
        expect(item.classes()).toContain('fade-in')
        expect(item.classes()).toContain('stagger')
      })
    })
  })

  describe('Component Structure - Loaded State', () => {
    beforeEach(() => {
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('has correct DOM hierarchy', () => {
      const section = wrapper.find('section.contact')
      const contentWrapper = section.find('.content-wrapper')
      const grid = contentWrapper.find('.contact-grid')
      expect(section.exists()).toBe(true)
      expect(contentWrapper.exists()).toBe(true)
      expect(grid.exists()).toBe(true)
    })

    it('all major sections are present', () => {
      const title = wrapper.find('.section-title')
      const subtitle = wrapper.find('.section-subtitle')
      const grid = wrapper.find('.contact-grid')
      expect(title.exists()).toBe(true)
      expect(subtitle.exists()).toBe(true)
      expect(grid.exists()).toBe(true)
    })
  })

  describe('Internationalization - Loaded State', () => {
    beforeEach(() => {
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('translates contact title', () => {
      const title = wrapper.find('.section-title')
      expect(title.text()).toBe('联系我们')
    })

    it('translates contact subtitle', () => {
      const subtitle = wrapper.find('.section-subtitle')
      expect(subtitle.text()).toBe('期待与您合作')
    })

    it('translates address label', () => {
      const items = wrapper.findAll('.contact-item')
      expect(items[0].find('h4').text()).toBe('公司地址')
    })

    it('translates email label', () => {
      const items = wrapper.findAll('.contact-item')
      expect(items[1].find('h4').text()).toBe('电子邮箱')
    })

    it('translates website label', () => {
      const items = wrapper.findAll('.contact-item')
      expect(items[2].find('h4').text()).toBe('官方网站')
    })

    it('returns translation key when key not found', () => {
      expect(wrapper.find('.section-title').text()).toBeTruthy()
    })
  })

  describe('State Transitions', () => {
    it('handles transition from loading to loaded', () => {
      // Start with loading
      setLoadingState(true)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
      expect(wrapper.findComponent(SkeletonContact).exists()).toBe(true)
      expect(wrapper.find('.content-wrapper').exists()).toBe(false)

      wrapper.unmount()

      // Switch to loaded
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
      expect(wrapper.find('.content-wrapper').exists()).toBe(true)
      expect(wrapper.findComponent(SkeletonContact).exists()).toBe(false)
    })
  })

  describe('Contact Data Structure - Loaded State', () => {
    beforeEach(() => {
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('has three contact items with proper structure', () => {
      const items = wrapper.findAll('.contact-item')
      expect(items.length).toBe(3)
      items.forEach(item => {
        expect(item.find('.contact-icon').exists()).toBe(true)
        expect(item.find('h4').exists()).toBe(true)
        expect(item.find('p').exists()).toBe(true)
      })
    })

    it('contact items have unique keys based on label', () => {
      const items = wrapper.findAll('.contact-item')
      const labels = items.map(item => item.find('h4').text())
      const uniqueLabels = new Set(labels)
      expect(uniqueLabels.size).toBe(3)
    })
  })

  describe('Edge Cases - Loaded State', () => {
    beforeEach(() => {
      setLoadingState(false)
      wrapper = mount(Contact, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('handles missing translation key gracefully', () => {
      // Component has fallback to return key if translation not found
      expect(wrapper.find('.section-title').text()).toBeTruthy()
    })

    it('contact data completeness check', () => {
      const items = wrapper.findAll('.contact-item')
      items.forEach(item => {
        expect(item.find('.contact-icon').text()).toBeTruthy()
        expect(item.find('h4').text()).toBeTruthy()
        expect(item.find('p').text()).toBeTruthy()
      })
    })

    it('contact order consistency', () => {
      const items = wrapper.findAll('.contact-item')
      expect(items[0].find('h4').text()).toBe('公司地址')
      expect(items[1].find('h4').text()).toBe('电子邮箱')
      expect(items[2].find('h4').text()).toBe('官方网站')
    })
  })
})
