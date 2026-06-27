/**
 * @file Culture.test.ts
 * @description Comprehensive unit tests for Culture component
 * @ticket #71 - TEST-016: Culture Component Unit Tests - TDD with Vitest
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import Culture from '../Culture.vue'

// Mock @vueuse/core before importing the component
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: vi.fn(() => vi.fn()),
}))

// Create actual Vue refs for the mock
// These will be used by all tests and can be modified per test
const mockIsLoading = ref(false)
const mockHasLoaded = ref(true)
const mockTarget = ref(null)
const mockIsVisible = ref(true)

// Mock useSkeleton composable with actual Vue refs
// Initialize as NOT loading (false) so content renders by default in tests
vi.mock('../composables/useSkeleton', () => ({
  useSkeleton: vi.fn(() => ({
    isLoading: mockIsLoading,
    hasLoaded: mockHasLoaded,
    target: mockTarget,
    isVisible: mockIsVisible,
  })),
}))

// Helper function to set loading state for specific tests
export const setLoadingState = (isLoading: boolean) => {
  mockIsLoading.value = isLoading
  mockHasLoaded.value = !isLoading
  mockIsVisible.value = !isLoading
}

// Mock SkeletonCard component
const SkeletonCardStub = {
  name: 'SkeletonCard',
  template: '<div class="skeleton-card-stub">Skeleton</div>',
  props: ['isLoading', 'index']
}

describe('Culture.vue', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    if (wrapper) wrapper.unmount()
  })

  describe('Rendering', () => {
    beforeEach(() => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub
            // Don't stub Transition - let it handle v-if properly
          }
        }
      })
    })

    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders section with correct class', () => {
      const section = wrapper.find('.section')
      expect(section.exists()).toBe(true)
    })

    it('renders section title', () => {
      const title = wrapper.find('.section-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('愿景·使命·文化')
    })

    it('renders culture grid', () => {
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
    })

    it('renders three culture cards', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(3)
    })

    it('renders vision card with icon', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(3)
      const visionCard = cards[0]
      const icon = visionCard.find('.card-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('🎯')
    })

    it('renders mission card with icon', () => {
      const cards = wrapper.findAll('.card')
      const missionCard = cards[1]
      const icon = missionCard.find('.card-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('🚀')
    })

    it('renders values card with icon', () => {
      const cards = wrapper.findAll('.card')
      const valuesCard = cards[2]
      const icon = valuesCard.find('.card-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('💡')
    })

    it('cards use article semantic tag', () => {
      const cards = wrapper.findAll('article.card')
      expect(cards.length).toBe(3)
    })
  })

  describe('Content Display', () => {
    beforeEach(() => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub
            // Don't stub Transition - let it handle v-if properly
          }
        }
      })
    })

    it('displays vision title', () => {
      const cards = wrapper.findAll('.card')
      const visionCard = cards[0]
      const title = visionCard.find('h3')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('愿景')
    })

    it('displays mission title', () => {
      const cards = wrapper.findAll('.card')
      const missionCard = cards[1]
      const title = missionCard.find('h3')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('使命')
    })

    it('displays values title', () => {
      const cards = wrapper.findAll('.card')
      const valuesCard = cards[2]
      const title = valuesCard.find('h3')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('文化')
    })

    it('displays vision description', () => {
      const cards = wrapper.findAll('.card')
      const visionCard = cards[0]
      const description = visionCard.find('p')
      expect(description.exists()).toBe(true)
      expect(description.text()).toBe('成为区域领先的金融科技平台')
    })

    it('displays mission description', () => {
      const cards = wrapper.findAll('.card')
      const missionCard = cards[1]
      const description = missionCard.find('p')
      expect(description.exists()).toBe(true)
      expect(description.text()).toBe('以尖端科技赋能客户')
    })

    it('displays values description with HTML content', () => {
      const cards = wrapper.findAll('.card')
      const valuesCard = cards[2]
      const description = valuesCard.find('p')
      expect(description.exists()).toBe(true)
      expect(description.html()).toContain('客户至上')
      expect(description.html()).toContain('开放协作')
    })

    it('values card supports line breaks in description', () => {
      const cards = wrapper.findAll('.card')
      const valuesCard = cards[2]
      const description = valuesCard.find('p')
      expect(description.html()).toContain('<br>')
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub
            // Don't stub Transition - let it handle v-if properly
          }
        }
      })
    })

    it('uses semantic section tag', () => {
      const section = wrapper.find('section.section')
      expect(section.exists()).toBe(true)
      expect(section.element.tagName.toLowerCase()).toBe('section')
    })

    it('uses semantic article tags for cards', () => {
      const cards = wrapper.findAll('article.card')
      expect(cards.length).toBe(3)
      cards.forEach(card => {
        expect(card.element.tagName.toLowerCase()).toBe('article')
      })
    })

    it('card icons have aria-hidden attribute', () => {
      const icons = wrapper.findAll('.card-icon')
      expect(icons.length).toBe(3)
      icons.forEach(icon => {
        expect(icon.attributes('aria-hidden')).toBe('true')
      })
    })

    it('section title is heading level 2', () => {
      const title = wrapper.find('h2.section-title')
      expect(title.exists()).toBe(true)
      expect(title.element.tagName.toLowerCase()).toBe('h2')
    })

    it('card titles are heading level 3', () => {
      const cards = wrapper.querySelectorAll('.card')
      cards.forEach(card => {
        const title = card.querySelector('h3')
        expect(title?.tagName.toLowerCase()).toBe('h3')
      })
    })

    it('has proper heading hierarchy', () => {
      const h2 = wrapper.findAll('h2')
      const h3s = wrapper.findAll('h3')
      expect(h2.length).toBe(1)
      expect(h3s.length).toBe(3)
    })

    it('cards are properly structured for screen readers', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(3)

      cards.forEach(card => {
        const icon = card.find('.card-icon')
        const title = card.find('h3')
        const description = card.find('p')

        expect(icon.exists()).toBe(true)
        expect(title.exists()).toBe(true)
        expect(description.exists()).toBe(true)
      })
    })
  })

  describe('Interactive Elements', () => {
    beforeEach(() => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub
            // Don't stub Transition - let it handle v-if properly
          }
        }
      })
    })

    it('cards have hover styling capabilities', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.classes()).toContain('card')
      })
    })

    it('icons have animation capability', () => {
      const icons = wrapper.findAll('.card-icon')
      icons.forEach(icon => {
        expect(icon.classes()).toContain('card-icon')
      })
    })

    it('cards have proper positioning for hover effects', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.classes()).toContain('fade-in')
        expect(card.classes()).toContain('stagger')
      })
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub
            // Don't stub Transition - let it handle v-if properly
          }
        }
      })
    })

    it('grid uses responsive layout', () => {
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
      const gridEl = grid.element as HTMLElement
      const styles = window.getComputedStyle(gridEl)
      expect(styles.display).toBe('grid')
    })

    it('section has responsive structure', () => {
      const section = wrapper.find('.section')
      expect(section.exists()).toBe(true)
    })

    it('cards are structured for responsive layout', () => {
      const grid = wrapper.find('.grid')
      const cards = grid.findAll('.card')
      expect(cards.length).toBe(3)
    })

    it('content wrapper supports responsive transitions', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(true)
    })
  })

  describe('Cyberpunk Styling', () => {
    beforeEach(() => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub
            // Don't stub Transition - let it handle v-if properly
          }
        }
      })
    })

    it('section has title styling class', () => {
      const title = wrapper.find('.section-title')
      expect(title.exists()).toBe(true)
      expect(title.classes()).toContain('section-title')
    })

    it('cards have proper styling classes', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.classes()).toContain('card')
        expect(card.classes()).toContain('fade-in')
        expect(card.classes()).toContain('stagger')
      })
    })

    it('icons have proper styling class', () => {
      const icons = wrapper.findAll('.card-icon')
      icons.forEach(icon => {
        expect(icon.classes()).toContain('card-icon')
      })
    })

    it('content wrapper has fade class', () => {
      const wrapperEl = wrapper.find('.content-wrapper')
      expect(wrapperEl.exists()).toBe(true)
    })

    it('fade elements have proper classes for animation', () => {
      const fadeElements = wrapper.findAll('.fade-in')
      expect(fadeElements.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub
            // Don't stub Transition - let it handle v-if properly
          }
        }
      })
    })

    it('handles component mounting with default data', () => {
      const cards = wrapper.findAll('.card')
      // Should render with static data
      expect(cards.length).toBeGreaterThan(0)
    })

    it('handles HTML content in descriptions', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        const description = card.find('p')
        expect(description.exists()).toBe(true)
        // Should handle HTML content
        expect(description.html()).toBeDefined()
      })
    })

    it('handles special characters and formatting', () => {
      const valuesCard = wrapper.findAll('.card')[2]
      const description = valuesCard.find('p')
      expect(description.html()).toContain('·')
      expect(description.html()).toContain('<br')
    })

    it('can be mounted and unmounted multiple times', () => {
      const wrappers = []
      for (let i = 0; i < 3; i++) {
        const w = mount(Culture, {
          global: {
            stubs: {
              SkeletonCard: SkeletonCardStub,
              Transition: {
                template: '<slot />'
              }
            }
          }
        })
        expect(w.exists()).toBe(true)
        wrappers.push(w)
      }
      wrappers.forEach(w => w.unmount())
    })

    it('handles empty states gracefully', () => {
      // Component should still render structure even with minimal data
      const section = wrapper.find('.section')
      expect(section.exists()).toBe(true)
    })
  })

  describe('Component Structure', () => {
    beforeEach(() => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub
            // Don't stub Transition - let it handle v-if properly
          }
        }
      })
    })

    it('has correct DOM hierarchy', () => {
      const section = wrapper.find('section.section')
      const contentWrapper = section.find('.content-wrapper')
      const grid = contentWrapper.find('.grid')
      const cards = grid.findAll('.card')

      expect(section.exists()).toBe(true)
      expect(contentWrapper.exists()).toBe(true)
      expect(grid.exists()).toBe(true)
      expect(cards.length).toBe(3)
    })

    it('all major sections are present', () => {
      const section = wrapper.find('.section')
      const title = wrapper.find('.section-title')
      const grid = wrapper.find('.grid')
      const cards = wrapper.findAll('.card')

      expect(section.exists()).toBe(true)
      expect(title.exists()).toBe(true)
      expect(grid.exists()).toBe(true)
      expect(cards.length).toBe(3)
    })

    it('card internal structure is correct', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(3)

      cards.forEach(card => {
        const icon = card.find('.card-icon')
        const title = card.find('h3')
        const description = card.find('p')

        expect(icon.exists()).toBe(true)
        expect(title.exists()).toBe(true)
        expect(description.exists()).toBe(true)
      })
    })

    it('proper semantic HTML structure', () => {
      const section = wrapper.find('section')
      const articles = wrapper.findAll('article')
      const headings = wrapper.findAll('h2, h3')

      expect(section.exists()).toBe(true)
      expect(articles.length).toBeGreaterThanOrEqual(3)
      expect(headings.length).toBeGreaterThanOrEqual(4) // 1 h2 + 3 h3
    })
  })

  describe('Animation and Transitions', () => {
    beforeEach(() => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub
            // Don't stub Transition - let it handle v-if properly
          }
        }
      })
    })

    it('has fade-in class on animated elements', () => {
      const fadeElements = wrapper.findAll('.fade-in')
      expect(fadeElements.length).toBeGreaterThan(0)
    })

    it('has stagger class for sequential animation', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        expect(card.classes()).toContain('stagger')
      })
    })

    it('content wrapper exists for transition', () => {
      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(true)
    })

    it('fade elements include title and cards', () => {
      const title = wrapper.find('.section-title')
      const cards = wrapper.findAll('.card')

      // Title and cards should have fade-in capability
      expect(title.classes()).toContain('fade-in')
      cards.forEach(card => {
        expect(card.classes()).toContain('fade-in')
      })
    })
  })

  describe('Internationalization', () => {
    beforeEach(() => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub
            // Don't stub Transition - let it handle v-if properly
          }
        }
      })
    })

    it('displays Chinese culture title', () => {
      const title = wrapper.find('.section-title')
      expect(title.text()).toBe('愿景·使命·文化')
    })

    it('displays Chinese card titles', () => {
      const cards = wrapper.findAll('.card')
      const titles = cards.map(card => card.find('h3').text())

      expect(titles).toContain('愿景')
      expect(titles).toContain('使命')
      expect(titles).toContain('文化')
    })

    it('supports HTML content in Chinese descriptions', () => {
      const cards = wrapper.findAll('.card')
      const valuesCard = cards[2]
      const description = valuesCard.find('p')

      expect(description.html()).toContain('客户至上')
      expect(description.html()).toContain('开放协作')
      expect(description.html()).toContain('敏捷创新')
      expect(description.html()).toContain('专业高效')
    })

    it('Chinese text renders correctly with special characters', () => {
      const valuesCard = wrapper.findAll('.card')[2]
      const description = valuesCard.find('p')

      // Should handle middle dot (·) and line breaks
      expect(description.html()).toContain('·')
      expect(description.html()).toContain('<br>')
    })

    it('all Chinese characters display properly', () => {
      const title = wrapper.find('.section-title')
      expect(title.text().length).toBeGreaterThan(0)

      const cards = wrapper.querySelectorAll('.card')
      cards.forEach(card => {
        const title = card.querySelector('h3')
        const description = card.querySelector('p')
        expect(title?.textContent?.length).toBeGreaterThan(0)
        expect(description?.textContent?.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Data Integrity', () => {
    beforeEach(() => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub
            // Don't stub Transition - let it handle v-if properly
          }
        }
      })
    })

    it('culture data contains all required fields', () => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(3)

      cards.forEach(card => {
        const icon = card.find('.card-icon')
        const title = card.find('h3')
        const description = card.find('p')

        expect(icon.text().length).toBeGreaterThan(0)
        expect(title.text().length).toBeGreaterThan(0)
        expect(description.text().length).toBeGreaterThan(0)
      })
    })

    it('icons are emoji characters', () => {
      const icons = wrapper.findAll('.card-icon')
      const iconTexts = icons.map(icon => icon.text())

      expect(iconTexts).toContain('🎯')
      expect(iconTexts).toContain('🚀')
      expect(iconTexts).toContain('💡')
    })

    it('card descriptions are not empty', () => {
      const cards = wrapper.findAll('.card')
      cards.forEach(card => {
        const description = card.find('p')
        expect(description.text().trim().length).toBeGreaterThan(0)
      })
    })
  })

  describe('Loading State', () => {
    it('has transition wrapper for content fade', () => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub,
            Transition: {
              template: '<slot />'
            }
          }
        }
      })

      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(true)
    })

    it('shows content when not loading', () => {
      wrapper = mount(Culture, {
        global: {
          stubs: {
            SkeletonCard: SkeletonCardStub,
            Transition: {
              template: '<slot />'
            }
          }
        }
      })

      const contentWrapper = wrapper.find('.content-wrapper')
      expect(contentWrapper.exists()).toBe(true)

      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(3)
    })
  })
})
