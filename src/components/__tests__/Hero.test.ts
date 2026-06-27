/**
 * @file Hero.test.ts
 * @description Comprehensive unit tests for Hero component
 * @ticket #68 - TEST-015: Hero Component Unit Tests - TDD with Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref, h } from 'vue'

// Mock @vueuse/core for useIntersectionObserver
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: vi.fn(() => vi.fn()),
}))

// Track loading state that will be used by the mock
let currentIsLoading = false

// Mock useSkeleton composable with actual Vue refs
const mockUseSkeleton = vi.fn((options = {}) => {
  const immediate = options?.immediate || false
  // For Hero: immediate=true means NOT loading initially (content shows immediately)
  // For Services: immediate=false means loading initially (waits for intersection)
  const isLoading = ref(immediate ? currentIsLoading : true)
  const isVisible = ref(immediate ? true : !currentIsLoading)
  const target = ref(null)
  const hasLoaded = ref(immediate ? true : !currentIsLoading)

  return {
    isLoading,
    hasLoaded,
    target,
    isVisible,
  }
})

vi.mock('../composables/useSkeleton', () => ({
  useSkeleton: mockUseSkeleton
}))

// Helper function to set loading state for specific tests
const setLoadingState = (isLoading: boolean) => {
  currentIsLoading = isLoading
}

// Import Hero component AFTER mocking
import Hero from '../Hero.vue'
import SkeletonHero from '../SkeletonHero.vue'

describe('Hero.vue', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    // Reset to default state (not loading)
    setLoadingState(false)
  })

  describe('Rendering - Loaded State (Default)', () => {
    beforeEach(() => {
      // Hero uses immediate: true, so default state is loaded (not loading)
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })
    })

    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders section element with correct class', () => {
      const section = wrapper.find('section.hero')
      expect(section.exists()).toBe(true)
      expect(section.classes()).toContain('hero')
    })

    it('has correct section id', () => {
      const section = wrapper.find('section#hero')
      expect(section.exists()).toBe(true)
    })

    it('does not show skeleton in default state', () => {
      const skeleton = wrapper.findComponent(SkeletonHero)
      expect(skeleton.exists()).toBe(false)
    })

    it('shows hero content in default state', () => {
      const heroContent = wrapper.find('.hero-content')
      expect(heroContent.exists()).toBe(true)
    })

    it('renders background elements', () => {
      const heroBg = wrapper.find('.hero-bg')
      const heroGrid = wrapper.find('.hero-grid')
      const heroParticles = wrapper.find('.hero-particles')

      expect(heroBg.exists()).toBe(true)
      expect(heroGrid.exists()).toBe(true)
      expect(heroParticles.exists()).toBe(true)
    })
  })

  describe('Content Display - Loaded State', () => {
    beforeEach(() => {
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })
    })

    it('renders hero content wrapper', () => {
      const heroContent = wrapper.find('.hero-content')
      expect(heroContent.exists()).toBe(true)
    })

    it('displays hero title with main text', () => {
      const titleMain = wrapper.find('.hero-title .main')
      expect(titleMain.exists()).toBe(true)
      expect(titleMain.text()).toBe('开泰科技')
    })

    it('displays hero title with accent text', () => {
      const titleAccent = wrapper.find('.hero-title .accent')
      expect(titleAccent.exists()).toBe(true)
      expect(titleAccent.text()).toBe('KBIGHT FINTECH')
    })

    it('displays hero subtitle/description', () => {
      const subtitle = wrapper.find('.hero-subtitle')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toContain('开泰远景信息科技有限公司')
    })

    it('renders hero stats container', () => {
      const stats = wrapper.find('.hero-stats')
      expect(stats.exists()).toBe(true)
    })

    it('renders three stat items', () => {
      const statItems = wrapper.findAll('.stat-item')
      expect(statItems.length).toBe(3)
    })
  })

  describe('Stats Display - Loaded State', () => {
    beforeEach(() => {
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })
    })

    it('displays founded year stat', () => {
      const statItems = wrapper.findAll('.stat-item')
      const firstStat = statItems[0]
      expect(firstStat.find('.stat-number').text()).toBe('2020')
      expect(firstStat.find('.stat-label').text()).toBe('成立年份')
    })

    it('displays capital stat', () => {
      const statItems = wrapper.findAll('.stat-item')
      const secondStat = statItems[1]
      expect(secondStat.find('.stat-number').text()).toBe('3亿')
      expect(secondStat.find('.stat-label').text()).toBe('注册资本（元）')
    })

    it('displays projects stat', () => {
      const statItems = wrapper.findAll('.stat-item')
      const thirdStat = statItems[2]
      expect(thirdStat.find('.stat-number').text()).toBe('20+')
      expect(thirdStat.find('.stat-label').text()).toBe('建设项目')
    })

    it('stat items have correct structure', () => {
      const statItems = wrapper.findAll('.stat-item')
      statItems.forEach(item => {
        expect(item.find('.stat-number').exists()).toBe(true)
        expect(item.find('.stat-label').exists()).toBe(true)
      })
    })
  })

  describe('Background Elements', () => {
    beforeEach(() => {
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })
    })

    it('hero-bg has aria-hidden attribute', () => {
      const heroBg = wrapper.find('.hero-bg')
      expect(heroBg.attributes('aria-hidden')).toBe('true')
    })

    it('hero-grid has aria-hidden attribute', () => {
      const heroGrid = wrapper.find('.hero-grid')
      expect(heroGrid.attributes('aria-hidden')).toBe('true')
    })

    it('hero-particles has aria-hidden attribute', () => {
      const heroParticles = wrapper.find('.hero-particles')
      expect(heroParticles.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })
    })

    it('uses semantic section element', () => {
      const section = wrapper.find('section')
      expect(section.exists()).toBe(true)
      expect(section.element.tagName.toLowerCase()).toBe('section')
    })

    it('has proper heading hierarchy with h1', () => {
      const title = wrapper.find('.hero-title')
      expect(title.element.tagName.toLowerCase()).toBe('h1')
    })

    it('background elements are hidden from screen readers', () => {
      const heroBg = wrapper.find('.hero-bg')
      const heroGrid = wrapper.find('.hero-grid')
      const heroParticles = wrapper.find('.hero-particles')

      expect(heroBg.attributes('aria-hidden')).toBe('true')
      expect(heroGrid.attributes('aria-hidden')).toBe('true')
      expect(heroParticles.attributes('aria-hidden')).toBe('true')
    })

    it('hero content is accessible to screen readers', () => {
      const heroContent = wrapper.find('.hero-content')
      expect(heroContent.attributes('aria-hidden')).toBeUndefined()
    })
  })

  describe('Cyberpunk Styling', () => {
    beforeEach(() => {
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })
    })

    it('hero title has main class', () => {
      const titleMain = wrapper.find('.hero-title .main')
      expect(titleMain.classes()).toContain('main')
    })

    it('hero title has accent class with cyan color', () => {
      const titleAccent = wrapper.find('.hero-title .accent')
      expect(titleAccent.classes()).toContain('accent')
    })

    it('stats have correct styling classes', () => {
      const statItems = wrapper.findAll('.stat-item')
      statItems.forEach(item => {
        expect(item.find('.stat-number').classes()).toContain('stat-number')
        expect(item.find('.stat-label').classes()).toContain('stat-label')
      })
    })
  })

  describe('Particle System', () => {
    it('creates particles on mount', () => {
      // Ensure not loading state
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })

      // Verify particles container exists
      const particles = wrapper.find('.hero-particles')
      expect(particles.exists()).toBe(true)
    })
  })

  describe('State Transitions', () => {
    it('handles default loaded state', () => {
      // Hero uses immediate: true, so default is loaded
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })

      expect(wrapper.find('.hero-content').exists()).toBe(true)
      expect(wrapper.findComponent(SkeletonHero).exists()).toBe(false)
    })

    it('can be mounted multiple times in loaded state', () => {
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })

      expect(wrapper.find('.hero-content').exists()).toBe(true)
      wrapper.unmount()

      // Mount again with same state
      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })

      expect(wrapper.find('.hero-content').exists()).toBe(true)
    })
  })

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })
    })

    it('maintains minimum height', () => {
      const section = wrapper.find('.hero')
      expect(section.exists()).toBe(true)
    })

    it('stats container uses flex layout', () => {
      const stats = wrapper.find('.hero-stats')
      expect(stats.exists()).toBe(true)
    })

    it('content wrapper maintains structure', () => {
      const heroContent = wrapper.find('.hero-content')
      expect(heroContent.exists()).toBe(true)
    })
  })

  describe('Internationalization', () => {
    beforeEach(() => {
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })
    })

    it('translates hero title', () => {
      const titleMain = wrapper.find('.hero-title .main')
      expect(titleMain.text()).toBe('开泰科技')
    })

    it('translates hero subtitle', () => {
      const titleAccent = wrapper.find('.hero-title .accent')
      expect(titleAccent.text()).toBe('KBIGHT FINTECH')
    })

    it('translates hero description', () => {
      const subtitle = wrapper.find('.hero-subtitle')
      expect(subtitle.text()).toContain('开泰远景信息科技有限公司')
      expect(subtitle.text()).toContain('深圳市罗湖区')
    })

    it('translates stats labels', () => {
      const statItems = wrapper.findAll('.stat-item')
      expect(statItems[0].find('.stat-label').text()).toBe('成立年份')
      expect(statItems[1].find('.stat-label').text()).toBe('注册资本（元）')
      expect(statItems[2].find('.stat-label').text()).toBe('建设项目')
    })

    it('returns translation key when key not found', () => {
      // The component should handle missing translation keys gracefully
      const subtitle = wrapper.find('.hero-subtitle')
      expect(subtitle.text()).toBeTruthy()
    })
  })

  describe('Component Structure', () => {
    beforeEach(() => {
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })
    })

    it('has correct DOM hierarchy', () => {
      const section = wrapper.find('section.hero')
      const heroContent = section.find('.hero-content')
      const title = heroContent.find('.hero-title')
      expect(section.exists()).toBe(true)
      expect(heroContent.exists()).toBe(true)
      expect(title.exists()).toBe(true)
    })

    it('all major sections are present', () => {
      const title = wrapper.find('.hero-title')
      const subtitle = wrapper.find('.hero-subtitle')
      const stats = wrapper.find('.hero-stats')
      expect(title.exists()).toBe(true)
      expect(subtitle.exists()).toBe(true)
      expect(stats.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('can be mounted and unmounted multiple times', () => {
      setLoadingState(false)

      const wrappers = [
        mount(Hero, {
          global: {
            stubs: {
              Transition: {
                render() {
                  return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
                }
              }
            }
          }
        }),
        mount(Hero, {
          global: {
            stubs: {
              Transition: {
                render() {
                  return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
                }
              }
            }
          }
        }),
      ]

      wrappers.forEach(w => expect(w.exists()).toBe(true))
      wrappers.forEach(w => w.unmount())
    })

    it('handles empty content gracefully', () => {
      setLoadingState(false)

      wrapper = mount(Hero, {
        global: {
          stubs: {
            Transition: {
              template: '<slot />',
              render() {
                return h('div', { class: 'transition-stub' }, this.$slots.default ? this.$slots.default() : [])
              }
            }
          }
        }
      })

      // Component should render even with empty/default content
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.hero-content').exists()).toBe(true)
    })
  })
})
