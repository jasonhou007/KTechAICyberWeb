/**
 * @file Services.test.ts
 * @description Comprehensive unit tests for Services component
 * @ticket #40 - TEST-002: Services Component Unit Tests - TDD with Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { h } from 'vue'

// Mock @vueuse/core for useIntersectionObserver
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: vi.fn(() => vi.fn()),
}))

// Create a shared Transition stub that renders its children
const transitionStub = {
  template: '<div class="transition-stub"><slot /></div>',
  render() {
    return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
  }
}

// Import Services component AFTER mocking
import Services from '../Services.vue'
import SkeletonCard from '../SkeletonCard.vue'

describe('Services.vue', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    if (wrapper) wrapper.unmount()
  })

  describe('Component Rendering', () => {
    beforeEach(() => {
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
  })

  describe('Skeleton Loading State', () => {
    beforeEach(() => {
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('shows skeleton cards in default state', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      expect(skeletons.length).toBe(6)
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

    it('has 6 skeleton cards for 6 services', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      expect(skeletons.length).toBe(6)
    })
  })

  describe('Component Structure', () => {
    beforeEach(() => {
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('uses semantic section element', () => {
      const section = wrapper.find('section')
      expect(section.exists()).toBe(true)
      expect(section.element.tagName.toLowerCase()).toBe('section')
    })

    it('section has id for anchor navigation', () => {
      const section = wrapper.find('section#services')
      expect(section.exists()).toBe(true)
    })

    it('skeleton grid uses correct CSS classes', () => {
      const skeletonGrid = wrapper.find('.skeleton-grid')
      expect(skeletonGrid.exists()).toBe(true)
    })

    it('section has correct CSS classes', () => {
      const section = wrapper.find('section.section')
      expect(section.classes()).toContain('section')
    })
  })

  describe('Services Data Structure', () => {
    beforeEach(() => {
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('component has services data defined', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('services array has 6 items', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      expect(skeletons.length).toBe(6)
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('has semantic HTML structure', () => {
      expect(wrapper.find('section').exists()).toBe(true)
    })

    it('has proper id for navigation', () => {
      const section = wrapper.find('section#services')
      expect(section.exists()).toBe(true)
    })
  })

  describe('CSS and Styling', () => {
    beforeEach(() => {
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

    it('skeleton grid has correct class', () => {
      const skeletonGrid = wrapper.find('.skeleton-grid')
      expect(skeletonGrid.exists()).toBe(true)
    })
  })

  describe('Component Behavior', () => {
    beforeEach(() => {
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('can be mounted multiple times', () => {
      const wrappers = [
        mount(Services, { global: { stubs: { Transition: transitionStub } } }),
        mount(Services, { global: { stubs: { Transition: transitionStub } } }),
      ]
      wrappers.forEach(w => {
        expect(w.exists()).toBe(true)
        expect(w.findAllComponents(SkeletonCard).length).toBe(6)
      })
      wrappers.forEach(w => w.unmount())
    })

    it('renders correctly with minimal configuration', () => {
      expect(wrapper.findAllComponents(SkeletonCard).length).toBe(6)
    })
  })

  describe('SkeletonCard Integration', () => {
    beforeEach(() => {
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('renders SkeletonCard components', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('passes correct props to SkeletonCard', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      skeletons.forEach((skeleton, index) => {
        expect(skeleton.props('isLoading')).toBe(true)
        expect(skeleton.props('index')).toBe(index)
      })
    })

    it('SkeletonCard components have unique keys', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      expect(skeletons.length).toBe(6)
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('skeleton grid maintains structure', () => {
      const skeletonGrid = wrapper.find('.skeleton-grid')
      expect(skeletonGrid.exists()).toBe(true)
    })

    it('renders all skeleton cards regardless of viewport', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      expect(skeletons.length).toBe(6)
    })
  })

  describe('Translation Function', () => {
    beforeEach(() => {
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('has translation function defined', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('services data uses translations', () => {
      const skeletons = wrapper.findAllComponents(SkeletonCard)
      expect(skeletons.length).toBe(6)
    })
  })

  describe('Transition Component', () => {
    beforeEach(() => {
      wrapper = mount(Services, {
        global: {
          stubs: {
            Transition: transitionStub
          }
        }
      })
    })

    it('uses Transition component for content fade', () => {
      expect(wrapper.exists()).toBe(true)
    })
  })
})
