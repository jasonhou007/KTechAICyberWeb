/**
 * @file NewsFilter.test.ts
 * @description Comprehensive unit tests for NewsFilter component
 * @ticket #100 - TEST-029: NewsFilter Component Unit Tests - TDD with Vitest
 *
 * Test Categories:
 * - Rendering Tests: Component mount and filter option rendering
 * - Category Selection Tests: Click handling and filter-change emission
 * - Active State Tests: Selection styling and aria-pressed reflection
 * - "All" Option Tests: Default selection and reset-to-all behavior
 * - Accessibility Tests: ARIA roles, labels, and keyboard semantics
 * - Styling Tests: CSS class application and BEM structure
 * - i18n Tests: Translation function behavior for news keys
 * - Edge Cases: Component lifecycle and prop reactivity
 *
 * TDD Approach:
 * 1. Red: Tests written to define expected behavior
 * 2. Green: Component implementation makes tests pass
 * 3. Refactor: Test code optimized for clarity and maintainability
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'

// Mock the i18n barrel BEFORE importing the component so its `useLanguage`
// import resolves to a controlled translation function.
vi.mock('../../i18n', () => {
  // A minimal translation map mirroring src/locales/en.json (news.* keys).
  const dictionary: Record<string, string> = {
    'news.filter': 'Filter by category',
    'news.categories.all': 'All',
    'news.categories.company': 'Company News',
    'news.categories.industry': 'Industry Insights',
    'news.categories.technology': 'Technology Updates',
    'news.categories.events': 'Events',
  }

  // t(key) resolves known keys to their English value and falls back to the
  // key itself for unknown keys — matching the real useLanguage().t contract.
  const t = (key: string) => dictionary[key] ?? key

  return {
    useLanguage: () => ({ t }),
  }
})

import NewsFilter from '../NewsFilter.vue'

// The five filter options the component renders, in order, with the key the
// component emits and the translated label shown to the user.
const expectedCategories = [
  { key: 'All', label: 'All' },
  { key: 'Company News', label: 'Company News' },
  { key: 'Industry Insights', label: 'Industry Insights' },
  { key: 'Technology Updates', label: 'Technology Updates' },
  { key: 'Events', label: 'Events' },
]

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(NewsFilter, {
    props,
  })
}

describe('NewsFilter.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    wrapper.unmount()
  })

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should mount without errors', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the root news-filter region', () => {
      const region = wrapper.find('.news-filter')
      expect(region.exists()).toBe(true)
    })

    it('renders exactly five filter option buttons', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons).toHaveLength(5)
    })

    it('renders one button per category in the defined order', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      const labels = buttons.map((b) => b.text())
      expect(labels).toEqual(expectedCategories.map((c) => c.label))
    })

    it('renders all category labels as button text', () => {
      expectedCategories.forEach((category) => {
        expect(wrapper.text()).toContain(category.label)
      })
    })

    it('renders the filter heading as screen-reader-only', () => {
      const heading = wrapper.find('#filter-heading')
      expect(heading.exists()).toBe(true)
      expect(heading.classes()).toContain('sr-only')
    })

    it('renders the translated filter label in the heading', () => {
      const heading = wrapper.find('#filter-heading')
      expect(heading.text()).toBe('Filter by category')
    })
  })

  // ============================================
  // Category Selection Tests
  // ============================================
  describe('Category Selection', () => {
    it('emits filter-change with the category key when a button is clicked', async () => {
      const buttons = wrapper.findAll('.news-filter__button')
      await buttons[1].trigger('click') // "Company News"

      expect(wrapper.emitted('filter-change')).toBeTruthy()
      expect(wrapper.emitted('filter-change')!.length).toBe(1)
      expect(wrapper.emitted('filter-change')![0]).toEqual(['Company News'])
    })

    it('emits the correct key for each category button', async () => {
      const buttons = wrapper.findAll('.news-filter__button')

      for (let i = 0; i < expectedCategories.length; i++) {
        const localWrapper = createWrapper()
        await localWrapper.findAll('.news-filter__button')[i].trigger('click')
        expect(localWrapper.emitted('filter-change')![0]).toEqual([
          expectedCategories[i].key,
        ])
        localWrapper.unmount()
      }
    })

    it('emits the raw category key, not the translated label', async () => {
      const buttons = wrapper.findAll('.news-filter__button')
      // "Industry Insights" button should emit the key 'Industry Insights'.
      await buttons[2].trigger('click')
      expect(wrapper.emitted('filter-change')![0]).toEqual([
        'Industry Insights',
      ])
    })

    it('does not emit filter-change without user interaction', () => {
      expect(wrapper.emitted('filter-change')).toBeFalsy()
    })

    it('emits filter-change each time a button is clicked', async () => {
      const buttons = wrapper.findAll('.news-filter__button')
      await buttons[0].trigger('click')
      await buttons[1].trigger('click')
      await buttons[2].trigger('click')

      expect(wrapper.emitted('filter-change')!.length).toBe(3)
    })
  })

  // ============================================
  // Active State Tests
  // ============================================
  describe('Active State', () => {
    it('applies the active modifier class to the selected category', () => {
      const selectedWrapper = createWrapper({
        selectedCategory: 'Company News',
      })
      const buttons = selectedWrapper.findAll('.news-filter__button')
      // Second button (index 1) is "Company News".
      expect(buttons[1].classes()).toContain('news-filter__button--active')
      selectedWrapper.unmount()
    })

    it('applies the active class to only one category at a time', () => {
      const selectedWrapper = createWrapper({
        selectedCategory: 'Events',
      })
      const activeButtons = selectedWrapper.findAll(
        '.news-filter__button--active'
      )
      expect(activeButtons).toHaveLength(1)
      // The active button is the last one ("Events").
      expect(activeButtons[0].text()).toBe('Events')
      selectedWrapper.unmount()
    })

    it('does not apply the active class to non-selected categories', () => {
      const selectedWrapper = createWrapper({
        selectedCategory: 'Company News',
      })
      const buttons = selectedWrapper.findAll('.news-filter__button')
      // Every button except "Company News" (index 1) is inactive.
      buttons.forEach((button, index) => {
        if (index === 1) {
          expect(button.classes()).toContain('news-filter__button--active')
        } else {
          expect(button.classes()).not.toContain(
            'news-filter__button--active'
          )
        }
      })
      selectedWrapper.unmount()
    })

    it('reflects the active state via aria-pressed on the selected button', () => {
      const selectedWrapper = createWrapper({
        selectedCategory: 'Industry Insights',
      })
      const buttons = selectedWrapper.findAll('.news-filter__button')
      expect(buttons[2].attributes('aria-pressed')).toBe('true')
      selectedWrapper.unmount()
    })

    it('marks non-selected buttons as aria-pressed false', () => {
      const selectedWrapper = createWrapper({
        selectedCategory: 'Company News',
      })
      const buttons = selectedWrapper.findAll('.news-filter__button')
      // Index 0 (All) is not selected.
      expect(buttons[0].attributes('aria-pressed')).toBe('false')
      // Index 3 (Technology Updates) is not selected.
      expect(buttons[3].attributes('aria-pressed')).toBe('false')
      selectedWrapper.unmount()
    })

    it('updates active styling reactively when selectedCategory changes', async () => {
      const selectedWrapper = createWrapper({
        selectedCategory: 'All',
      })
      const buttons = () => selectedWrapper.findAll('.news-filter__button')
      // Initially "All" (index 0) is active.
      expect(buttons()[0].classes()).toContain('news-filter__button--active')

      await selectedWrapper.setProps({ selectedCategory: 'Events' })
      // Now "Events" (index 4) is active and "All" is not.
      expect(buttons()[4].classes()).toContain('news-filter__button--active')
      expect(buttons()[0].classes()).not.toContain(
        'news-filter__button--active'
      )
      selectedWrapper.unmount()
    })
  })

  // ============================================
  // "All" Option Tests
  // ============================================
  describe('"All" Option', () => {
    it('defaults to "All" selected when no selectedCategory prop is provided', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[0].classes()).toContain('news-filter__button--active')
      expect(buttons[0].attributes('aria-pressed')).toBe('true')
    })

    it('renders "All" as the first filter option', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      expect(buttons[0].text()).toBe('All')
    })

    it('emits "All" key when the "All" button is clicked', async () => {
      const buttons = wrapper.findAll('.news-filter__button')
      await buttons[0].trigger('click')
      expect(wrapper.emitted('filter-change')![0]).toEqual(['All'])
    })

    it('marks "All" as inactive when another category is selected', () => {
      const selectedWrapper = createWrapper({
        selectedCategory: 'Technology Updates',
      })
      const buttons = selectedWrapper.findAll('.news-filter__button')
      expect(buttons[0].classes()).not.toContain(
        'news-filter__button--active'
      )
      expect(buttons[0].attributes('aria-pressed')).toBe('false')
      selectedWrapper.unmount()
    })

    it('can reselect "All" after another category was active', async () => {
      const selectedWrapper = createWrapper({
        selectedCategory: 'Events',
      })
      // Switch back to "All" and wait for the reactive re-render.
      await selectedWrapper.setProps({ selectedCategory: 'All' })
      const buttons = selectedWrapper.findAll('.news-filter__button')
      expect(buttons[0].classes()).toContain('news-filter__button--active')
      expect(buttons[0].attributes('aria-pressed')).toBe('true')
      selectedWrapper.unmount()
    })
  })

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('marks the root as an aria region with a descriptive label', () => {
      const region = wrapper.find('.news-filter')
      expect(region.attributes('role')).toBe('region')
      expect(region.attributes('aria-label')).toBe('Filter by category')
    })

    it('wraps the buttons in a group labeled by the heading', () => {
      const group = wrapper.find('[role="group"]')
      expect(group.exists()).toBe(true)
      expect(group.attributes('aria-labelledby')).toBe('filter-heading')
    })

    it('renders a heading element for screen readers', () => {
      const heading = wrapper.find('#filter-heading')
      expect(heading.exists()).toBe(true)
      expect(heading.element.tagName.toLowerCase()).toBe('h2')
    })

    it('provides a descriptive aria-label on every button', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      expect.assertions(buttons.length)
      expectedCategories.forEach((category, index) => {
        expect(buttons[index].attributes('aria-label')).toBe(
          `Filter by ${category.label}`
        )
      })
    })

    it('reflects selection state through aria-pressed toggle semantics', () => {
      const selectedWrapper = createWrapper({
        selectedCategory: 'Technology Updates',
      })
      const buttons = selectedWrapper.findAll('.news-filter__button')
      // Exactly one button is pressed.
      const pressed = buttons.filter(
        (b) => b.attributes('aria-pressed') === 'true'
      )
      expect(pressed).toHaveLength(1)
      expect(pressed[0].text()).toBe('Technology Updates')
      selectedWrapper.unmount()
    })

    it('uses native button elements for keyboard operability', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(5)
    })
  })

  // ============================================
  // Styling Tests
  // ============================================
  describe('Styling', () => {
    it('applies the news-filter class to the root element', () => {
      const root = wrapper.find('.news-filter')
      expect(root.exists()).toBe(true)
      expect(root.classes()).toContain('news-filter')
    })

    it('applies the news-filter__buttons class to the button container', () => {
      const container = wrapper.find('.news-filter__buttons')
      expect(container.exists()).toBe(true)
    })

    it('applies the news-filter__button class to each option', () => {
      const buttons = wrapper.findAll('.news-filter__button')
      expect.assertions(buttons.length)
      buttons.forEach((button) => {
        expect(button.classes()).toContain('news-filter__button')
      })
    })

    it('uses a BEM modifier class for the active state', () => {
      const selectedWrapper = createWrapper({
        selectedCategory: 'Events',
      })
      const active = selectedWrapper.find('.news-filter__button--active')
      expect(active.exists()).toBe(true)
      selectedWrapper.unmount()
    })

    it('keeps the heading visually hidden via sr-only utility class', () => {
      const heading = wrapper.find('#filter-heading')
      expect(heading.classes()).toContain('sr-only')
    })
  })

  // ============================================
  // i18n Tests
  // ============================================
  describe('Internationalization', () => {
    it('exposes a translation function on the component instance', () => {
      expect(typeof wrapper.vm.t).toBe('function')
    })

    it('translates the news.filter key correctly', () => {
      expect(wrapper.vm.t('news.filter')).toBe('Filter by category')
    })

    it('translates the news.categories.all key correctly', () => {
      expect(wrapper.vm.t('news.categories.all')).toBe('All')
    })

    it('translates a known category key correctly', () => {
      expect(wrapper.vm.t('news.categories.industry')).toBe(
        'Industry Insights'
      )
    })

    it('returns the key as fallback when translation is missing', () => {
      expect(wrapper.vm.t('nonexistent.key')).toBe('nonexistent.key')
    })

    it('uses the filter translation in the region aria-label', () => {
      const region = wrapper.find('.news-filter')
      expect(region.attributes('aria-label')).toBe('Filter by category')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('can be mounted and unmounted multiple times', () => {
      const wrappers = [createWrapper(), createWrapper(), createWrapper()]
      wrappers.forEach((w) => {
        expect(w.exists()).toBe(true)
        expect(w.findAll('.news-filter__button')).toHaveLength(5)
      })
      wrappers.forEach((w) => w.unmount())
      expect(true).toBe(true)
    })

    it('renders correctly when remounted after unmount', () => {
      wrapper.unmount()
      const reWrapper = createWrapper()
      expect(reWrapper.findAll('.news-filter__button')).toHaveLength(5)
      expect(reWrapper.text()).toContain('All')
      reWrapper.unmount()
    })

    it('handles rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const w = createWrapper()
        expect(w.exists()).toBe(true)
        w.unmount()
      }
      expect(true).toBe(true)
    })

    it('handles an unknown selectedCategory prop gracefully', () => {
      // No category matches, so no button should be marked active.
      const unknownWrapper = createWrapper({
        selectedCategory: 'Nonexistent Category',
      })
      const active = unknownWrapper.findAll('.news-filter__button--active')
      expect(active).toHaveLength(0)
      unknownWrapper.unmount()
    })

    it('renders the same number of buttons regardless of selection', () => {
      const counts = ['All', 'Company News', 'Events', 'Unknown'].map(
        (selectedCategory) => {
          const w = createWrapper({ selectedCategory })
          const count = w.findAll('.news-filter__button').length
          w.unmount()
          return count
        }
      )
      expect(counts).toEqual([5, 5, 5, 5])
    })
  })
})
